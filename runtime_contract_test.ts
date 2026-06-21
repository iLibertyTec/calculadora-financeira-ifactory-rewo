import { assertEquals, assertMatch } from "@std/assert";

Deno.test("main.ts mantém contrato de entrypoint com import.meta.main e Deno.serve", async () => {
  const mainSource: string = await Deno.readTextFile("./main.ts");

  assertMatch(mainSource, /if\s*\(\s*import\.meta\.main\s*\)/);
  assertMatch(mainSource, /Deno\.serve\s*\(/);
});

Deno.test("deno task start executa main.ts com deno run -A", async () => {
  const denoConfigText: string = await Deno.readTextFile("./deno.json");
  const denoConfig: {
    tasks?: {
      start?: string;
    };
  } = JSON.parse(denoConfigText);

  assertEquals(denoConfig.tasks?.start, "deno run -A main.ts");
});

Deno.test("deno.json não declara imports externos além de @std/assert", async () => {
  const denoConfigText: string = await Deno.readTextFile("./deno.json");
  const denoConfig: {
    imports?: Record<string, string>;
  } = JSON.parse(denoConfigText);
  const imports: Record<string, string> = denoConfig.imports ?? {};

  assertEquals(Object.keys(imports).sort(), ["@std/assert"]);
  assertMatch(imports["@std/assert"], /^jsr:@std\/assert@/);
});
