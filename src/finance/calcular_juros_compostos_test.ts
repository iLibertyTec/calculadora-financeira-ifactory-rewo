import { assertAlmostEquals } from "@std/assert";

import { calcularJurosCompostos } from "./calcular_juros_compostos.ts";

Deno.test("calcularJurosCompostos calcula taxa positiva com múltiplos meses", () => {
  const resultado = calcularJurosCompostos(1000, 2, 3);

  assertAlmostEquals(resultado.montante, 1061.208, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, 61.208, 1e-12);
});

Deno.test("calcularJurosCompostos calcula principal e taxa mensal decimais", () => {
  const principal: number = 1234.56;
  const taxaMensalPercent: number = 1.75;
  const meses: number = 4;
  const taxaMensal: number = taxaMensalPercent / 100;
  const montanteEsperado: number = principal * Math.pow(1 + taxaMensal, meses);
  const jurosTotaisEsperados: number = montanteEsperado - principal;

  const resultado = calcularJurosCompostos(principal, taxaMensalPercent, meses);

  assertAlmostEquals(resultado.montante, montanteEsperado, 1e-12);
  assertAlmostEquals(resultado.jurosTotais, jurosTotaisEsperados, 1e-12);
});
