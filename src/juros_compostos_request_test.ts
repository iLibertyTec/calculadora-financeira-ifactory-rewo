import { assertEquals, assertObjectMatch } from "@std/assert";
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

Deno.test("aceita application/json", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertObjectMatch(result, {
    success: true,
    data: {
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12,
    },
  });
});

Deno.test("aceita variantes +json de content-type", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/problem+json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertObjectMatch(result, {
    success: true,
    data: {
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12,
    },
  });
});

Deno.test("rejeita content-type com substring json fora do media type esperado", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "text/json-like",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12,
    }),
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

Deno.test("retorna erro quando corpo JSON está vazio", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "",
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O JSON da requisição é inválido.",
  });
});

Deno.test("retorna erro quando corpo não é um objeto JSON", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify([1, 2, 3]),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O corpo da requisição deve ser um objeto JSON.",
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

Deno.test("retorna erro quando há campos extras", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12,
      moeda: "BRL",
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "Campo(s) desconhecido(s): moeda.",
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
    error: "O campo principal deve ser um número finito maior que zero.",
  });
});

Deno.test("retorna erro quando principal é zero", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 0,
      taxaMensal: 1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo principal deve ser um número finito maior que zero.",
  });
});

Deno.test("retorna erro quando principal é negativo", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: -1000,
      taxaMensal: 1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo principal deve ser um número finito maior que zero.",
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
    error:
      "O campo taxaMensal deve ser um número finito maior ou igual a zero.",
  });
});

Deno.test("retorna erro quando taxaMensal é negativa", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: -1.5,
      meses: 12,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error:
      "O campo taxaMensal deve ser um número finito maior ou igual a zero.",
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
    error: "O campo meses deve ser um número inteiro positivo.",
  });
});

Deno.test("retorna erro quando meses não é inteiro", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: 12.5,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo meses deve ser um número inteiro positivo.",
  });
});

Deno.test("retorna erro quando meses é zero", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 1000,
      taxaMensal: 1.5,
      meses: 0,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: false,
    error: "O campo meses deve ser um número inteiro positivo.",
  });
});

Deno.test("retorna sucesso quando entrada é válida", async () => {
  const req = new Request("http://localhost/api/juros-compostos", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      principal: 2500.75,
      taxaMensal: 2.25,
      meses: 18,
    }),
  });

  const result = await readJurosCompostosRequest(req);

  assertEquals(result, {
    success: true,
    data: {
      principal: 2500.75,
      taxaMensal: 2.25,
      meses: 18,
    },
  });
});
