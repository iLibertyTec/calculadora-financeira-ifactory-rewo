export interface JurosCompostosInput {
  capitalInicial: number;
  taxaPorPeriodo: number;
  quantidadePeriodos: number;
}

export interface JurosCompostosParamsNormalizados {
  capitalInicial: number;
  taxaPorPeriodo: number;
  quantidadePeriodos: number;
}

export interface JurosCompostosResultado {
  parametros: JurosCompostosParamsNormalizados;
  montanteFinal: number;
  jurosAcumulados: number;
}

function validarNumeroFinito(valor: number, nomeCampo: string): void {
  if (!Number.isFinite(valor)) {
    throw new TypeError(`${nomeCampo} deve ser um número finito.`);
  }
}

function normalizarEntrada(
  input: JurosCompostosInput,
): JurosCompostosParamsNormalizados {
  validarNumeroFinito(input.capitalInicial, "capitalInicial");
  validarNumeroFinito(input.taxaPorPeriodo, "taxaPorPeriodo");
  validarNumeroFinito(input.quantidadePeriodos, "quantidadePeriodos");

  if (input.capitalInicial < 0) {
    throw new RangeError("capitalInicial deve ser maior ou igual a zero.");
  }

  if (input.quantidadePeriodos < 0) {
    throw new RangeError("quantidadePeriodos deve ser maior ou igual a zero.");
  }

  if (!Number.isInteger(input.quantidadePeriodos)) {
    throw new RangeError("quantidadePeriodos deve ser um inteiro.");
  }

  if (input.taxaPorPeriodo < -1) {
    throw new RangeError("taxaPorPeriodo deve ser maior ou igual a -1.");
  }

  return {
    capitalInicial: input.capitalInicial,
    taxaPorPeriodo: input.taxaPorPeriodo,
    quantidadePeriodos: input.quantidadePeriodos,
  };
}

export function calcularJurosCompostos(
  input: JurosCompostosInput,
): JurosCompostosResultado {
  const parametros: JurosCompostosParamsNormalizados = normalizarEntrada(input);
  const fatorCapitalizacao = (1 + parametros.taxaPorPeriodo) **
    parametros.quantidadePeriodos;
  const montanteFinal = parametros.capitalInicial * fatorCapitalizacao;
  const jurosAcumulados = montanteFinal - parametros.capitalInicial;

  return {
    parametros,
    montanteFinal,
    jurosAcumulados,
  };
}
