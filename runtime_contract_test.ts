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

function isExternalImportSpecifier(specifier: string): boolean {
  return specifier.startsWith("jsr:") || specifier.startsWith("npm:") ||
    specifier.startsWith("http://") || specifier.startsWith("https://");
}

Deno.test("main.ts mantém contrato de entrypoint com import.meta.main e inicialização via Deno.serve", async () => {
  const mainSource: string = await Deno.readTextFile("./main.ts");

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
  assertEquals(
    tokens[tokens.length - 1],
    "main.ts",
    "A task 'start' deve apontar para main.ts como entrypoint final.",
  );
});

Deno.test("configuração Deno não declara imports externos além de @std/assert", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();
  const imports: Record<string, string> = denoConfig.imports ?? {};
  const disallowedExternalImports: Array<[string, string]> = Object.entries(
    imports,
  ).filter(([key, value]) => {
    return isExternalImportSpecifier(value) && key !== "@std/assert";
  });

  assertEquals(disallowedExternalImports, []);
  assert(
    imports["@std/assert"] !== undefined,
    "O alias @std/assert deve permanecer declarado em deno.json.",
  );
});
