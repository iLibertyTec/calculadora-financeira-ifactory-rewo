import { assertEquals, assertMatch, assertNotMatch } from "@std/assert";
import { handler } from "./main.ts";

Deno.test("GET / retorna HTML da calculadora financeira", async () => {
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertMatch(body, /<html lang="pt-BR">/);
  assertMatch(body, /<title>Calculadora Financeira iFactory<\/title>/);
  assertMatch(body, /<style>/);
  assertMatch(body, /\.card/);
  assertMatch(
    body,
    /grid-template-columns: repeat\(auto-fit, minmax\(180px, 1fr\)\);/,
  );
  assertMatch(body, /output,\s*\[role="alert"\]\s*\{/);
  assertMatch(body, /display: block;/);
  assertMatch(body, /word-break: break-word;/);
  assertMatch(body, /@media \(max-width: 900px\)/);
  assertMatch(body, /@media \(max-width: 720px\)/);
  assertMatch(body, /@media \(max-width: 400px\)/);
  assertMatch(body, /<legend>Dados da simulação<\/legend>/);
  assertMatch(body, /<label for="principal">Valor principal \*<\/label>/);
  assertMatch(body, /name="principal"/);
  assertMatch(body, /id="principal"/);
  assertMatch(body, /type="text"/);
  assertMatch(body, /inputmode="decimal"/);
  assertMatch(body, /placeholder="Ex\.: 1000,00"/);
  assertMatch(body, /required/);
  assertMatch(body, /aria-describedby="principal-ajuda"/);
  assertMatch(body, /<label for="taxaMensal">Taxa mensal \(%\) \*<\/label>/);
  assertMatch(body, /name="taxaMensal"/);
  assertMatch(body, /id="taxaMensal"/);
  assertMatch(body, /placeholder="Ex\.: 1,50"/);
  assertMatch(body, /aria-describedby="taxaMensal-ajuda"/);
  assertMatch(body, /<label for="meses">Meses \*<\/label>/);
  assertMatch(body, /name="meses"/);
  assertMatch(body, /aria-describedby="meses-ajuda"/);
  assertMatch(body, /<button type="submit">Calcular<\/button>/);
  assertMatch(
    body,
    /<output id="resultado" aria-live="polite" aria-atomic="true"><\/output>/,
  );
  assertMatch(
    body,
    /<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" hidden><\/div>/,
  );
  assertMatch(
    body,
    /<form method="get" action="\/" aria-describedby="status-descricao">/,
  );
  assertMatch(body, /Resultado da simulação/);
  assertNotMatch(body, /novalidate/);
});

Deno.test("GET / processa a simulação pela query string", async () => {
  const response = await handler(
    new Request(
      "http://localhost/?principal=1000,00&taxaMensal=1,5&meses=12",
    ),
  );
  const body = await response.text();

  assertEquals(response.status, 200);
  assertMatch(body, /Simulação calculada com sucesso/);
  assertMatch(body, /Montante final estimado:/);
  assertMatch(body, /R\$/);
  assertMatch(body, /value="1000,00"/);
  assertMatch(body, /value="1,5"/);
  assertMatch(body, /value="12"/);
  assertMatch(body, /#resultado strong/);
  assertMatch(
    body,
    /<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" hidden><\/div>/,
  );
});

Deno.test("GET / exibe erros de validação quando necessário", async () => {
  const response = await handler(
    new Request(
      "http://localhost/?principal=0&taxaMensal=abc&meses=0",
    ),
  );
  const body = await response.text();

  assertEquals(response.status, 200);
  assertMatch(body, /Há erros no preenchimento/);
  assertMatch(body, /Informe um valor principal maior que zero\./);
  assertMatch(
    body,
    /Informe uma taxa mensal válida, igual ou maior que zero\./,
  );
  assertMatch(
    body,
    /Informe a quantidade de meses com número inteiro maior que zero\./,
  );
  assertNotMatch(body, /role="alert" hidden/);
});

Deno.test("GET / não referencia frameworks ou dependências externas", async () => {
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertMatch(body, /^((?!preact).)*$/is);
  assertMatch(body, /^((?!fresh).)*$/is);
  assertMatch(body, /^((?!islands).)*$/is);
  assertMatch(body, /^((?!https?:\/\/).)*$/is);
});

Deno.test("GET /health permanece disponível", async () => {
  const response = await handler(new Request("http://localhost/health"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(body, '{"ok":true}');
});

Deno.test("GET /api/visits permanece disponível", async () => {
  const response = await handler(new Request("http://localhost/api/visits"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertMatch(body, /"visits":\d+/);
  assertMatch(body, /"message":"/);
});
