import {
  assertEquals,
  assertObjectMatch,
} from "@std/assert";
import { readJurosCompostosRequest } from "./juros_compostos_request.ts";

Deno.test("retorna erro quando content-type não indica JSON", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "text/plain",
    },
    body: "principal=1000",
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O corpo da requisição deve estar em JSON.",
  });
});

Deno.test("retorna erro quando JSON é inválido", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{",
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O JSON da requisição é inválido.",
  });
});

Deno.test("retorna erro quando principal está ausente", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      taxaMensal: 1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo principal é obrigatório.",
  });
});

Deno.test("retorna erro quando taxaMensal está ausente", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo taxaMensal é obrigatório.",
  });
});

Deno.test("retorna erro quando meses está ausente", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo meses é obrigatório.",
  });
});

Deno.test("retorna erro quando principal não é numérico", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: "1000",
      taxaMensal: 1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo principal deve ser numérico.",
  });
});

Deno.test("retorna erro quando taxaMensal não é numérico", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: "1.5",
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo taxaMensal deve ser numérico.",
  });
});

Deno.test("retorna erro quando meses não é numérico", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: "12",
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo meses deve ser numérico.",
  });
});

Deno.test("retorna os valores numéricos preservados quando a entrada é válida", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1500.75,
      taxaMensal: 2.25,
      meses: 18,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertObjectMatch(result, {
    success: true,
    data: {
      principal: 1500.75,
      taxaMensal: 2.25,
      meses: 18,
    },
  });
});
