import { assertEquals, assertMatch } from "@std/assert";
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
  assertMatch(body, /<label for="principal">Valor principal<\/label>/);
  assertMatch(body, /name="principal"/);
  assertMatch(body, /<label for="taxaMensal">Taxa mensal \(%\)<\/label>/);
  assertMatch(body, /name="taxaMensal"/);
  assertMatch(body, /<label for="meses">Meses<\/label>/);
  assertMatch(body, /name="meses"/);
  assertMatch(body, /<button type="submit">Calcular<\/button>/);
  assertMatch(body, /id="resultado"/);
  assertMatch(body, /id="erro"/);
});

Deno.test("GET / não referencia frameworks ou dependências externas", async () => {
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertMatch(body, /^((?!preact).)*$/is);
  assertMatch(body, /^((?!fresh).)*$/is);
  assertMatch(body, /^((?!islands).)*$/is);
  assertMatch(body, /^((?!https?:\/\/).)*$/is);
});
