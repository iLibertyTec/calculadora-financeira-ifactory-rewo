import {
  assertEquals,
  assertThrows,
} from "@std/assert";
import { calcularJurosCompostos } from "./juros_compostos.ts";

Deno.test("calcula juros compostos no caso nominal", () => {
  const resultado = calcularJurosCompostos({
    capitalInicial: 1000,
    taxaPorPeriodo: 0.1,
    quantidadePeriodos: 2,
  });

  assertEquals(resultado.parametros, {
    capitalInicial: 1000,
    taxaPorPeriodo: 0.1,
    quantidadePeriodos: 2,
  });
  assertEquals(resultado.montanteFinal, 1210);
  assertEquals(resultado.jurosAcumulados, 210);
});

Deno.test("retorna o capital inicial quando a taxa é zero", () => {
  const resultado = calcularJurosCompostos({
    capitalInicial: 1500,
    taxaPorPeriodo: 0,
    quantidadePeriodos: 12,
  });

  assertEquals(resultado.montanteFinal, 1500);
  assertEquals(resultado.jurosAcumulados, 0);
});

Deno.test("retorna o capital inicial quando a quantidade de períodos é zero", () => {
  const resultado = calcularJurosCompostos({
    capitalInicial: 800,
    taxaPorPeriodo: 0.05,
    quantidadePeriodos: 0,
  });

  assertEquals(resultado.montanteFinal, 800);
  assertEquals(resultado.jurosAcumulados, 0);
});

Deno.test("rejeita entradas inválidas com erro controlado", () => {
  assertThrows(
    () => {
      calcularJurosCompostos({
        capitalInicial: -1,
        taxaPorPeriodo: 0.1,
        quantidadePeriodos: 1,
      });
    },
    RangeError,
    "capitalInicial deve ser maior ou igual a zero.",
  );

  assertThrows(
    () => {
      calcularJurosCompostos({
        capitalInicial: 100,
        taxaPorPeriodo: 0.1,
        quantidadePeriodos: -1,
      });
    },
    RangeError,
    "quantidadePeriodos deve ser maior ou igual a zero.",
  );

  assertThrows(
    () => {
      calcularJurosCompostos({
        capitalInicial: 100,
        taxaPorPeriodo: 0.1,
        quantidadePeriodos: 1.5,
      });
    },
    RangeError,
    "quantidadePeriodos deve ser um inteiro.",
  );

  assertThrows(
    () => {
      calcularJurosCompostos({
        capitalInicial: 100,
        taxaPorPeriodo: Number.NaN,
        quantidadePeriodos: 1,
      });
    },
    TypeError,
    "taxaPorPeriodo deve ser um número finito.",
  );
});
