import { assert, assertEquals, assertMatch } from "@std/assert";

type DenoConfig = {
  tasks?: {
    start?: string;
  };
  imports?: Record<string, string>;
};

type RuntimeModule = {
  specifier: string;
  dependencies?: RuntimeModule[];
};

async function readDenoConfig(): Promise<DenoConfig> {
  const text: string = await Deno.readTextFile("./deno.json");
  return JSON.parse(text) as DenoConfig;
}

function collectExternalSpecifiers(
  module: RuntimeModule,
  found: Set<string> = new Set<string>(),
): Set<string> {
  const specifier: string = module.specifier;
  if (
    specifier.startsWith("jsr:") || specifier.startsWith("npm:") ||
    specifier.startsWith("http://") || specifier.startsWith("https://")
  ) {
    found.add(specifier);
  }

  for (const dependency of module.dependencies ?? []) {
    collectExternalSpecifiers(dependency, found);
  }

  return found;
}

Deno.test("main.ts mantém contrato de entrypoint com import.meta.main e inicialização via Deno.serve", async () => {
  const mainSource: string = await Deno.readTextFile("./main.ts");

  assertMatch(mainSource, /if\s*\(\s*import\.meta\.main\s*\)/);
  assertMatch(mainSource, /Deno\.serve\s*\(/);

  const command: Deno.Command = new Deno.Command(Deno.execPath(), {
    args: ["eval", "import \"./main.ts\";"],
    cwd: Deno.cwd(),
    env: {
      PORT: "0",
    },
  });
  const output: Deno.CommandOutput = await command.output();
  const stderr: string = new TextDecoder().decode(output.stderr);

  assert(
    output.success,
    `Import do entrypoint falhou inesperadamente: ${stderr}`,
  );
});

Deno.test("deno task start mantém intenção de executar main.ts com deno run e permissão -A", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();
  const startTask: string | undefined = denoConfig.tasks?.start;

  assert(startTask, "A task 'start' deve existir no deno.json.");
  assertMatch(startTask, /\bdeno\s+run\b/);
  assertMatch(startTask, /(^|\s)-A(\s|$)/);
  assertMatch(startTask, /(^|\s)\.?\/??main\.ts(\s|$)/);
});

Deno.test("configuração Deno mantém apenas @std/assert como import externo declarado", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();
  const imports: Record<string, string> = denoConfig.imports ?? {};
  const externalImports: Array<[string, string]> = Object.entries(imports).filter(([
    _key,
    value,
  ]) => {
    return value.startsWith("jsr:") || value.startsWith("npm:") ||
      value.startsWith("http://") || value.startsWith("https://");
  });

  assertEquals(externalImports, [["@std/assert", "jsr:@std/assert@1"]]);
});

Deno.test("grafo de runtime carregado por main.ts não inclui dependências externas além de @std/assert", async () => {
  const rootModule: RuntimeModule = await Deno.loadGraph("./main.ts");
  const externalSpecifiers: string[] = [...collectExternalSpecifiers(rootModule)]
    .sort();

  assertEquals(externalSpecifiers, []);
});
