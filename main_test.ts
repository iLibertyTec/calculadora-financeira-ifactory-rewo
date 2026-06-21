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
  assertMatch(body, /<button id="calcular" type="submit">Calcular<\/button>/);
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
    /<form id="calculadora-form" method="get" action="\/" aria-describedby="status-descricao">/,
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

Deno.test("GET / contém JavaScript puro para submit sem recarregar", async () => {
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertMatch(body, /typeof fetch === "function"/);
  assertMatch(body, /form\.addEventListener\("submit", async \(event\) => \{/);
  assertMatch(body, /event\.preventDefault\(\);/);
  assertMatch(body, /fetch\("\/api\/juros-compostos", \{/);
  assertMatch(body, /method: "POST"/);
  assertMatch(body, /"Content-Type": "application\/json"/);
  assertMatch(body, /body: JSON\.stringify\(\{/);
  assertMatch(body, /principal: principalInput\.value/);
  assertMatch(body, /taxaMensal: taxaMensalInput\.value/);
  assertMatch(body, /meses: mesesInput\.value/);
  assertMatch(body, /statusDescricao\.textContent = "Calculando simulação\.\.\.";/);
  assertMatch(body, /botao\.disabled = true;/);
  assertMatch(body, /paragraph\.textContent = message;/);
  assertMatch(body, /strong\.textContent = String\(data\.montanteFormatado \|\| ""\);/);
  assertNotMatch(body, /form\.submit\(\);/);
  assertMatch(body, /data = await response\.json\(\);/);
  assertMatch(
    body,
    /throw new Error\("Não foi possível interpretar a resposta do servidor\."\);/,
  );
});

Deno.test("POST /api/juros-compostos retorna cálculo em JSON", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        principal: "1000,00",
        taxaMensal: "1,5",
        meses: "12",
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(body.principal, 1000);
  assertEquals(body.taxaMensal, 1.5);
  assertEquals(body.meses, 12);
  assertEquals(typeof body.montante, "number");
  assertMatch(body.montanteFormatado, /R\$/);
});

Deno.test("POST /api/juros-compostos rejeita content-type inválido", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
      },
      body: "principal=1000",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "Envie o corpo da requisição em JSON.");
  assertEquals(body.errors[0], "Envie o corpo da requisição em JSON.");
});

Deno.test("POST /api/juros-compostos rejeita JSON inválido", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "Não foi possível interpretar o JSON enviado.");
  assertEquals(body.errors[0], "Não foi possível interpretar o JSON enviado.");
});
