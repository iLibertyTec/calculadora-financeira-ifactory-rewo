import {
  assertAlmostEquals,
  assertEquals,
  assertThrows,
} from "@std/assert";
import { calcularJurosCompostos } from "./juros_compostos.ts";

Deno.test("calcula montante com juros compostos", () => {
  const resultado = calcularJurosCompostos(1000, 2, 3);

  assertAlmostEquals(resultado.montante, 1061.208, 1e-12);
});

Deno.test("calcula juros totais com juros compostos", () => {
  const resultado = calcularJurosCompostos(1000, 2, 3);

  assertAlmostEquals(resultado.jurosTotais, 61.208, 1e-12);
});

Deno.test("aceita taxa mensal percentual decimal", () => {
  const resultado = calcularJurosCompostos(1500, 1.5, 6);

  assertAlmostEquals(resultado.montante, 1640.6826226566407, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 140.68262265664072, 1e-12);
});

Deno.test("retorna zero de juros quando meses e taxa sao zero", () => {
  const resultado = calcularJurosCompostos(1000, 0, 0);

  assertEquals(resultado, {
    montante: 1000,
    jurosTotais: 0,
  });
});

Deno.test("aceita principal zero com taxa e meses positivos", () => {
  const resultado = calcularJurosCompostos(0, 1.5, 12);

  assertEquals(resultado, {
    montante: 0,
    jurosTotais: 0,
  });
});

Deno.test("rejeita principal negativo", () => {
  assertThrows(
    () => calcularJurosCompostos(-1, 1, 1),
    RangeError,
    "principal não pode ser negativo.",
  );
});

Deno.test("rejeita taxa negativa", () => {
  assertThrows(
    () => calcularJurosCompostos(1000, -1, 1),
    RangeError,
    "taxaMensalPercentual não pode ser negativa.",
  );
});

Deno.test("rejeita meses negativo", () => {
  assertThrows(
    () => calcularJurosCompostos(1000, 1, -1),
    RangeError,
    "meses não pode ser negativo.",
  );
});

Deno.test("rejeita meses nao inteiro", () => {
  assertThrows(
    () => calcularJurosCompostos(1000, 1, 1.5),
    RangeError,
    "meses deve ser um número inteiro.",
  );
});

Deno.test("rejeita valores nao numericos ou nao finitos", () => {
  assertThrows(
    () => calcularJurosCompostos(Number.NaN, 1, 1),
    TypeError,
    "principal deve ser um número finito.",
  );

  assertThrows(
    () => calcularJurosCompostos(1000, Number.POSITIVE_INFINITY, 1),
    TypeError,
    "taxaMensalPercentual deve ser um número finito.",
  );

  assertThrows(
    () => calcularJurosCompostos(1000, 1, Number.NaN),
    TypeError,
    "meses deve ser um número finito.",
  );
});
