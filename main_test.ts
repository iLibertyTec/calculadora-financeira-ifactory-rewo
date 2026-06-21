import {
  assertEquals,
  assertObjectMatch,
} from "@std/assert";
import { handler } from "./main.ts";

deno.test("GET /health responde 200 com JSON", async () => {
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertObjectMatch(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

deno.test("POST /api/juros-compostos responde 200 com montante e jurosTotais", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensal: 0.01,
        meses: 3,
      }),
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), {
    montante: 1030.301,
    jurosTotais: 30.301,
  });
});

deno.test("POST /api/juros-compostos com JSON inválido responde 400", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), { erro: "JSON inválido." });
});

deno.test("POST /api/juros-compostos com campos ausentes responde 400", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: 1000,
        taxaMensal: 0.01,
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), {
    erro: "Campos obrigatórios ausentes: meses.",
  });
});

deno.test("POST /api/juros-compostos com valores não numéricos responde 400", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: "1000",
        taxaMensal: 0.01,
        meses: 3,
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), {
    erro: "Os campos principal, taxaMensal e meses devem ser numéricos.",
  });
});

deno.test("rota inexistente responde 404 com JSON", async () => {
  const response = await handler(new Request("http://localhost/inexistente"));

  assertEquals(response.status, 404);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), { error: "not found" });
});
