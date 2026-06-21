import {
  assertEquals,
  assertObjectMatch,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("GET /health responde com status 200", async () => {
  const response = await handler(new Request("http://localhost/health"));
  const body = await response.json();

  assertEquals(response.status, 200);
  assertObjectMatch(body, {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

Deno.test("POST /api/juros-compostos responde cálculo com sucesso", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensalPercentual: 2,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.montante, 1061.208);
  assertEquals(body.jurosTotais, 61.208);
});

Deno.test("POST /api/juros-compostos aceita campo legado taxaMensal", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensal: 2,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.montante, 1061.208);
  assertEquals(body.jurosTotais, 61.208);
});

Deno.test("POST /api/juros-compostos responde 400 para dados inválidos", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: -1000,
        taxaMensalPercentual: 2,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "principal não pode ser negativo.");
});

Deno.test("POST /api/juros-compostos responde 400 para taxa negativa", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensalPercentual: -2,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "taxaMensalPercentual não pode ser negativa.");
});

Deno.test("POST /api/juros-compostos responde 400 para meses negativo", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensalPercentual: 2,
        meses: -3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "meses não pode ser negativo.");
});

Deno.test("POST /api/juros-compostos responde 400 para meses decimal", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensalPercentual: 2,
        meses: 1.5,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "meses deve ser um número inteiro.");
});

Deno.test("POST /api/juros-compostos responde 400 para campo ausente", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "taxaMensalPercentual é obrigatório.");
});

Deno.test("POST /api/juros-compostos responde 400 para tipo inválido", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: "1000",
        taxaMensalPercentual: 2,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "principal deve ser um número finito.");
});

Deno.test("POST /api/juros-compostos responde 400 para JSON malformado", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error, "JSON inválido.");
});

Deno.test("POST /api/juros-compostos responde 415 para Content-Type inválido", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensalPercentual: 2,
        meses: 3,
      }),
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 415);
  assertEquals(body.error, "Content-Type deve ser application/json.");
});

Deno.test("GET /api/juros-compostos responde 405 sem executar cálculo", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "GET",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("Allow"), "POST");
  assertEquals(body.error, "Método não permitido.");
});
