export interface JurosCompostosResultado {
  montante: number;
  jurosTotais: number;
}

/**
 * Calcula juros compostos usando taxa mensal em percentual.
 *
 * Exemplo: taxaMensalPercentual = 2 representa 2% ao mês.
 *
 * Fórmula:
 * montante = principal * (1 + taxaMensalPercentual / 100) ^ meses
 */
function validarNumeroFinito(valor: unknown, nomeCampo: string): number {
  if (
    typeof valor !== "number" || Number.isNaN(valor) || !Number.isFinite(valor)
  ) {
    throw new TypeError(`${nomeCampo} deve ser um número finito.`);
  }

  return valor;
}

export function calcularJurosCompostos(
  principal: number,
  taxaMensalPercentual: number,
  meses: number,
): JurosCompostosResultado {
  const principalValidado = validarNumeroFinito(principal, "principal");
  const taxaValidada = validarNumeroFinito(
    taxaMensalPercentual,
    "taxaMensal",
  );
  const mesesValidado = validarNumeroFinito(meses, "meses");

  if (principalValidado < 0) {
    throw new RangeError("principal não pode ser negativo.");
  }

  if (taxaValidada < 0) {
    throw new RangeError("taxaMensal não pode ser negativa.");
  }

  if (mesesValidado < 0) {
    throw new RangeError("meses não pode ser negativo.");
  }

  if (!Number.isInteger(mesesValidado)) {
    throw new RangeError("meses deve ser um número inteiro.");
  }

  const montante = principalValidado *
    Math.pow(1 + taxaValidada / 100, mesesValidado);
  const jurosTotais = montante - principalValidado;

  return {
    montante,
    jurosTotais,
  };
}
