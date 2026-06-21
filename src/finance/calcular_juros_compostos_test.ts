import { assertAlmostEquals } from "@std/assert";

import { calcularJurosCompostos } from "./calcular_juros_compostos.ts";

Deno.test("calcularJurosCompostos calcula taxa positiva com múltiplos meses", () => {
  const resultado = calcularJurosCompostos(1000, 2, 3);

  assertAlmostEquals(resultado.montante, 1061.208, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 61.208, 1e-12);
});

Deno.test("calcularJurosCompostos mantém montante igual ao principal com taxa zero", () => {
  const resultado = calcularJurosCompostos(1000, 0, 12);

  assertAlmostEquals(resultado.montante, 1000, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 0, 1e-12);
});

Deno.test("calcularJurosCompostos mantém montante igual ao principal com zero meses", () => {
  const resultado = calcularJurosCompostos(1000, 2, 0);

  assertAlmostEquals(resultado.montante, 1000, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 0, 1e-12);
});
