export interface ResultadoJurosCompostos {
  montante: number;
  jurosTotais: number;
}

export function calcularJurosCompostos(
  principal: number,
  taxaMensal: number,
  meses: number,
): ResultadoJurosCompostos {
  const taxaDecimal: number = taxaMensal / 100;
  const montante: number = principal * (1 + taxaDecimal) ** meses;
  const jurosTotais: number = montante - principal;

  return {
    montante,
    jurosTotais,
  };
}
