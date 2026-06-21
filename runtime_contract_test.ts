import { assert, assertEquals, assertMatch } from "@std/assert";

type DenoConfig = {
  tasks?: {
    start?: string;
  };
  imports?: Record<string, string>;
};

async function readDenoConfig(): Promise<DenoConfig> {
  const text: string = await Deno.readTextFile("./deno.json");
  return JSON.parse(text) as DenoConfig;
}

async function readMainSource(): Promise<string> {
  return await Deno.readTextFile("./main.ts");
}

function splitCommand(command: string): string[] {
  return command.match(/(?:"[^"]*"|'[^']*'|\S+)/g) ?? [];
}

function unquote(token: string): string {
  if (
    (token.startsWith("\"") && token.endsWith("\"")) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    return token.slice(1, -1);
  }

  return token;
}

function isMainEntrypointToken(token: string): boolean {
  const normalized: string = token.replaceAll("\\", "/");
  return normalized === "main.ts" || normalized === "./main.ts" ||
    normalized.endsWith("/main.ts");
}

Deno.test("main.ts mantém contrato de entrypoint com import.meta.main e inicialização via Deno.serve", async () => {
  const mainSource: string = await readMainSource();

  assertMatch(mainSource, /if\s*\(\s*import\.meta\.main\s*\)/);
  assertMatch(mainSource, /Deno\.serve\s*\(/);
});

Deno.test("deno task start mantém intenção de executar main.ts com deno run e permissão total", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();
  const startTask: string | undefined = denoConfig.tasks?.start;

  assert(startTask, "A task 'start' deve existir no deno.json.");

  const tokens: string[] = splitCommand(startTask).map(unquote);

  assert(tokens.length >= 3, "A task 'start' deve conter um comando válido.");
  assertEquals(tokens[0], "deno");
  assert(tokens.includes("run"), "A task 'start' deve usar 'deno run'.");
  assert(
    tokens.includes("-A") || tokens.includes("--allow-all"),
    "A task 'start' deve manter permissão total (-A ou --allow-all).",
  );
  assert(
    tokens.some(isMainEntrypointToken),
    "A task 'start' deve incluir main.ts como entrypoint.",
  );
});

Deno.test("deno.json mantém apenas o alias esperado de dependência externa no import map", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();
  const imports: Record<string, string> = denoConfig.imports ?? {};

  assertEquals(Object.keys(imports).sort(), ["@std/assert"]);
  assertEquals(imports["@std/assert"], "jsr:@std/assert@1");
});
