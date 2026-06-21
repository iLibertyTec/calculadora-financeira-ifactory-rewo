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
  assertMatch(body, /\[hidden\]\s*\{/);
  assertMatch(body, /output,\s*\[role="alert"\]\s*\{/);
  assertMatch(body, /display: block;/);
  assertMatch(body, /word-break: break-word;/);
  assertMatch(body, /@media \(max-width: 900px\)/);
  assertMatch(body, /@media \(max-width: 720px\)/);
  assertMatch(body, /@media \(max-width: 400px\)/);
  assertMatch(body, /margin: 0 auto;/);
  assertMatch(body, /button\s*\{[\s\S]*?cursor: pointer;/);
  assertMatch(body, /button:hover/);
  assertMatch(body, /button:focus-visible/);
  assertMatch(
    body,
    /button\s*\{[\s\S]*?@media \(max-width: 400px\)[\s\S]*?width: 100%;/,
  );
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
    /<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" tabindex="-1" hidden><\/div>/,
  );
  assertMatch(
    body,
    /<form method="get" action="\/" aria-describedby="status-descricao" id="form-simulacao">/,
  );
  assertMatch(body, /Resultado da simulação|Montante final estimado:/);
  assertMatch(body, /function limparErro\(\)/);
  assertMatch(body, /function exibirErro\(mensagem\)/);
  assertMatch(body, /function exibirErros\(mensagens\)/);
  assertMatch(body, /function obterMensagemErro\(payload, fallbackStatus\)/);
  assertMatch(body, /function obterMensagemErroHttp\(status, payload, texto\)/);
  assertMatch(body, /function atualizarStatus\(mensagem\)/);
  assertMatch(body, /async function lerPayloadJson\(resposta\)/);
  assertMatch(body, /role="alert"/);
  assertMatch(body, /tabindex="-1"/);
  assertMatch(body, /paragrafo\.textContent = mensagem;/);
  assertNotMatch(body, /innerHTML = `<p>\$\{mensagem\}<\/p>`/);
  assertMatch(
    body,
    /Ocorreu um erro ao calcular\. Tente novamente em instantes\./,
  );
  assertNotMatch(
    body,
    /Não foi possível calcular no momento por falha de rede\. Tente novamente mais tarde\./,
  );
  assertMatch(
    body,
    /Não foi possível calcular no momento porque o serviço está indisponível\. Tente novamente mais tarde\./,
  );
  assertMatch(
    body,
    /Não foi possível concluir o cálculo\. Verifique a mensagem de erro exibida\./,
  );
  assertMatch(
    body,
    /Não foi possível calcular no momento porque a solicitação expirou ou foi interrompida\. Tente novamente\./,
  );
  assertMatch(
    body,
    /Não foi possível calcular no momento por falha de comunicação\. Tente novamente mais tarde\./,
  );
  assertMatch(
    body,
    /Não foi possível calcular no momento no navegador\. Tente novamente em instantes\./,
  );
  assertMatch(body, /erro\.hidden = false;/);
  assertMatch(body, /erro\.scrollIntoView\(/);
  assertMatch(body, /erro\.focus\(\);/);
  assertMatch(body, /formulario\.setAttribute\("aria-busy", "true"\);/);
  assertMatch(body, /formulario\.removeAttribute\("aria-busy"\);/);
  assertMatch(body, /botaoSubmit\.disabled = true;/);
  assertMatch(body, /botaoSubmit\.textContent = "Calculando\.\.\.";/);
  assertMatch(body, /botaoSubmit\?\.focus\(\);/);
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
    /<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" tabindex="-1" hidden><\/div>/,
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
  assertMatch(
    body,
    /<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" tabindex="-1"><p>Informe um valor principal maior que zero\.<\/p>/,
  );
  assertNotMatch(body, /role="alert" hidden/);
});

Deno.test("POST /api/calcular retorna erro da API em pt-BR quando houver validação", async () => {
  const response = await handler(
    new Request("http://localhost/api/calcular", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        principal: "0",
        taxaMensal: "abc",
        meses: "0",
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(body.error, "Informe um valor principal maior que zero.");
  assertEquals(Array.isArray(body.errors), true);
});

Deno.test("POST /api/calcular padroniza erro em JSON quando corpo é inválido", async () => {
  const response = await handler(
    new Request("http://localhost/api/calcular", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: "{",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(
    body.error,
    "Não foi possível interpretar os dados enviados para o cálculo.",
  );
});

Deno.test("POST /api/calcular retorna total quando dados são válidos", async () => {
  const response = await handler(
    new Request("http://localhost/api/calcular", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
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
  assertEquals(typeof body.total, "number");
});
