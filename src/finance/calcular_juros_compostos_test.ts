import { assertAlmostEquals } from "@std/assert";

import { calcularJurosCompostos } from "./calcular_juros_compostos.ts";

Deno.test("calcularJurosCompostos calcula taxa positiva com múltiplos meses", () => {
  const resultado = calcularJurosCompostos(1000, 2, 3);

  assertAlmostEquals(resultado.montante, 1061.208, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 61.208, 1e-12);
});

Deno.test("calcularJurosCompostos calcula principal e taxa mensal decimais", () => {
  const resultado = calcularJurosCompostos(1234.56, 1.75, 4);

  assertAlmostEquals(resultado.montante, 1323.3297370086, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 88.7697370086, 1e-12);
});
