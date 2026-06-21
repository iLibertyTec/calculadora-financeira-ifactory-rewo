import {
  assertEquals,
  assertObjectMatch,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("handler responde /health com status 200 e metadados do serviço", async () => {
  const response = await handler(new Request("http://localhost/health"));

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

Deno.test("handler aceita content-type application/json com charset em /api/juros-compostos", async () => {
  const response = await handler(
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
  const response = await handler(
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
  const response = await handler(
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
    details: {
      taxa: "must be a finite number",
    },
  });
});

Deno.test("handler retorna 400 para campos ausentes em /api/juros-compostos", async () => {
  const response = await handler(
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

Deno.test("handler retorna 400 para campos extras em /api/juros-compostos", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: 0.1,
        periodos: 2,
        extra: true,
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertObjectMatch(await response.json(), {
    error: "invalid payload",
    details: {
      extra: "is not allowed",
    },
  });
});

Deno.test("handler retorna 400 para periodos não inteiro em /api/juros-compostos", async () => {
  const response = await handler(
    new Request("http://localhost/api/juros-compostos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capitalInicial: 1000,
        taxa: 0.1,
        periodos: 2.5,
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertObjectMatch(await response.json(), {
    error: "invalid payload",
    details: {
      periodos: "must be an integer",
    },
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

Deno.test("handler mantém GET /api/visits funcionando", async () => {
  const response = await handler(new Request("http://localhost/api/visits"));

  assertEquals(response.status, 200);
  assertObjectMatch(await response.json(), {
    visits: 0,
  });
});

Deno.test("handler retorna 404 para rota desconhecida", async () => {
  const response = await handler(new Request("http://localhost/nao-existe"));

  assertEquals(response.status, 404);
  assertObjectMatch(await response.json(), {
    error: "not found",
  });
});
