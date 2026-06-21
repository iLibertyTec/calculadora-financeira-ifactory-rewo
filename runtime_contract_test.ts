import { assertEquals, assertMatch } from "@std/assert";

type DenoConfig = {
  tasks?: {
    start?: string;
  };
  imports?: Record<string, string>;
};

async function readDenoConfig(): Promise<DenoConfig> {
  for (const path of ["./deno.json", "./deno.jsonc"]) {
    try {
      const text: string = await Deno.readTextFile(path);
      return JSON.parse(text) as DenoConfig;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  throw new Error("Nenhum arquivo de configuração Deno encontrado.");
}

Deno.test("main.ts mantém contrato de entrypoint com import.meta.main executando Deno.serve", async () => {
  const mainSource: string = await Deno.readTextFile("./main.ts");

  assertMatch(
    mainSource,
    /if\s*\(\s*import\.meta\.main\s*\)\s*\{[\s\S]*Deno\.serve\s*\(/,
  );
});

Deno.test("deno task start executa main.ts com deno run -A", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();

  assertEquals(denoConfig.tasks?.start, "deno run -A main.ts");
});

Deno.test("configuração Deno mantém apenas @std/assert como dependência externa declarada em imports", async () => {
  const denoConfig: DenoConfig = await readDenoConfig();
  const imports: Record<string, string> = denoConfig.imports ?? {};

  for (const [key, value] of Object.entries(imports)) {
    const isExternal: boolean = value.startsWith("jsr:") ||
      value.startsWith("npm:") || value.startsWith("http://") ||
      value.startsWith("https://");

    if (!isExternal) {
      continue;
    }

    assertEquals(key, "@std/assert");
    assertMatch(value, /^jsr:@std\/assert@/);
  }
});
