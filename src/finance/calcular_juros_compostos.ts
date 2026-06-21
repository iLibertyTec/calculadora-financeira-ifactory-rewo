export type ResultadoJurosCompostos = {
  montante: number;
  jurosTotais: number;
};

export function calcularJurosCompostos(
  principal: number,
  taxaMensalPercent: number,
  meses: number,
): ResultadoJurosCompostos {
  const taxaMensal: number = taxaMensalPercent / 100;
  const montante: number = principal * Math.pow(1 + taxaMensal, meses);
  const jurosTotais: number = montante - principal;

  return {
    montante,
    jurosTotais,
  };
}
