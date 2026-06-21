import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertStringIncludes,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("handler responde / com HTML da Calculadora Financeira iFactory", async () => {
  const response: Response = await handler(new Request("http://localhost/"));

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );

  const html: string = await response.text();

  assertStringIncludes(html, "<title>Calculadora Financeira iFactory</title>");
  assertStringIncludes(html, "<h1 id=\"titulo-principal\">Calculadora Financeira iFactory</h1>");
  assertStringIncludes(html, "POST /api/juros-compostos");
  assertStringIncludes(html, "Pular para o conteúdo principal");
  assertStringIncludes(html, "montante = 1210");
  assertStringIncludes(html, "O exemplo abaixo é estático e serve apenas para ilustrar a operação da API na home.");
  assert(!html.includes("Visit Analytics"));
  assert(!html.includes("Registrar visita"));
  assert(!html.includes("/api/visits"));
  assert(!html.includes("visits"));
  assert(!html.includes("<form"));
});

Deno.test("handler responde HEAD / com status 200 e content-type html", async () => {
  const response: Response = await handler(
    new Request("http://localhost/", { method: "HEAD" }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertEquals(await response.text(), "");
});

Deno.test("handler responde 405 em métodos não permitidos na home", async () => {
  const response: Response = await handler(
    new Request("http://localhost/", { method: "POST" }),
  );

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "GET, HEAD");
});

Deno.test("handler responde /health com status 200 e metadados do serviço", async () => {
  const response: Response = await handler(
    new Request("http://localhost/health"),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertObjectMatch(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

Deno.test("handler retorna 405 em métodos não permitidos para /health", async () => {
  const response: Response = await handler(
    new Request("http://localhost/health", { method: "POST" }),
  );

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "GET");
  assertObjectMatch(await response.json(), {
    error: "method not allowed",
  });
});

Deno.test("handler mantém compatibilidade com GET /api/visits", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/visits"),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertObjectMatch(await response.json(), {
    count: 0,
  });
});

Deno.test("handler mantém compatibilidade com POST /api/visits", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/visits", { method: "POST" }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertObjectMatch(await response.json(), {
    count: 1,
  });
});

Deno.test("handler calcula juros compostos em POST /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: 0.1,
        periodos: 2,
      }),
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertObjectMatch(await response.json(), {
    capitalInicial: 1000,
    taxa: 0.1,
    periodos: 2,
    montante: 1210,
  });
});

Deno.test("handler retorna 405 em GET /api/juros-compostos com Allow POST", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos"),
  );

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "POST");
  assertObjectMatch(await response.json(), {
    error: "method not allowed",
  });
});

Deno.test("handler aceita content-type application/json com charset em /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: 0.1,
        periodos: 2,
      }),
    }),
  );

  assertEquals(response.status, 200);
  assertObjectMatch(await response.json(), {
    montante: 1210,
  });
});

Deno.test("handler retorna 415 sem content-type json em /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: 0.1,
        periodos: 2,
      }),
    }),
  );

  assertEquals(response.status, 415);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertObjectMatch(await response.json(), {
    error: "unsupported media type",
  });
});

Deno.test("handler retorna 415 para content-type ambíguo em /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "text/plain, application/json" },
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: 0.1,
        periodos: 2,
      }),
    }),
  );

  assertEquals(response.status, 415);
  assertObjectMatch(await response.json(), {
    error: "unsupported media type",
  });
});

Deno.test("handler retorna 400 para JSON malformado em /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );

  assertEquals(response.status, 400);
  assertObjectMatch(await response.json(), {
    error: "invalid json",
  });
});

Deno.test("handler retorna 400 para payload inválido em /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: "0.1",
        periodos: 2,
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertObjectMatch(await response.json(), {
    error: "invalid payload",
    details: {
      taxa: "must be a finite number",
    },
  });
});

Deno.test("handler retorna 400 para campos ausentes em /api/juros-compostos", async () => {
  const response: Response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capitalInicial: 1000,
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertObjectMatch(await response.json(), {
    error: "invalid payload",
    details: {
      taxa: "is required",
      periodos: "is required",
    },
  });
});
