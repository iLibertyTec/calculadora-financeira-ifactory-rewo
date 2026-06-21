export interface ResultadoJurosCompostos {
  montante: number;
  jurosTotais: number;
}

export function calcularJurosCompostos(
  principal: number,
  taxaMensalPercent: number,
  meses: number,
): ResultadoJurosCompostos {
  const montante: number =
    principal * (1 + taxaMensalPercent / 100) ** meses;
  const jurosTotais: number = montante - principal;

  return {
    montante,
    jurosTotais,
  };
}
