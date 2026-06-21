import {
  assertAlmostEquals,
  assertEquals,
} from "@std/assert";
import { calcularJurosCompostos } from "./financeiro.ts";

Deno.test("calcularJurosCompostos cresce com taxa positiva", () => {
  const resultado = calcularJurosCompostos(1000, 1, 12);

  assertAlmostEquals(resultado.montante, 1126.8250301319697);
  assertAlmostEquals(resultado.jurosTotais, 126.82503013196972);
});

Deno.test("calcularJurosCompostos retorna principal com taxa zero", () => {
  const resultado = calcularJurosCompostos(1000, 0, 12);

  assertEquals(resultado.montante, 1000);
  assertEquals(resultado.jurosTotais, 0);
});

Deno.test("calcularJurosCompostos calcula jurosTotais como montante menos principal", () => {
  const principal = 2500;
  const resultado = calcularJurosCompostos(principal, 2, 6);

  assertAlmostEquals(resultado.jurosTotais, resultado.montante - principal);
});
