import {
  assertEquals,
  assertObjectMatch,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("handler responde /health com status 200 e metadados do serviço", async () => {
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertObjectMatch(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

Deno.test("handler calcula juros compostos em POST /api/juros-compostos", async () => {
  const response = await handler(
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
  assertObjectMatch(await response.json(), {
    capitalInicial: 1000,
    taxa: 0.1,
    periodos: 2,
    montante: 1210,
  });
});

Deno.test("handler retorna 400 para JSON malformado em /api/juros-compostos", async () => {
  const response = await handler(
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
  const response = await handler(
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
  });
});

Deno.test("handler retorna 405 para método incorreto em /api/juros-compostos", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "GET",
    }),
  );

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "POST");
  assertObjectMatch(await response.json(), {
    error: "method not allowed",
  });
});
