export interface JurosCompostosInput {
  principal: number;
  taxaMensal: number;
  meses: number;
}

export interface JurosCompostosRequestError {
  error: string;
}

export type JurosCompostosRequestResult =
  | { success: true; data: JurosCompostosInput }
  | { success: false; error: string };

export async function readJurosCompostosRequest(
  req: Request,
): Promise<JurosCompostosRequestResult> {
  const contentType: string | null = req.headers.get("content-type");

  if (!contentType?.toLowerCase().includes("json")) {
    return {
      success: false,
      error: "O corpo da requisição deve estar em JSON.",
    };
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return {
      success: false,
      error: "O JSON da requisição é inválido.",
    };
  }

  if (typeof body !== "object" || body === null) {
    return {
      success: false,
      error: "Os campos principal, taxaMensal e meses são obrigatórios.",
    };
  }

  const payload: Record<string, unknown> = body as Record<string, unknown>;

  if (!("principal" in payload)) {
    return {
      success: false,
      error: "O campo principal é obrigatório.",
    };
  }

  if (!("taxaMensal" in payload)) {
    return {
      success: false,
      error: "O campo taxaMensal é obrigatório.",
    };
  }

  if (!("meses" in payload)) {
    return {
      success: false,
      error: "O campo meses é obrigatório.",
    };
  }

  if (
    typeof payload.principal !== "number" ||
    !Number.isFinite(payload.principal) ||
    payload.principal <= 0
  ) {
    return {
      success: false,
      error: "O campo principal deve ser um número finito maior que zero.",
    };
  }

  if (
    typeof payload.taxaMensal !== "number" ||
    !Number.isFinite(payload.taxaMensal)
  ) {
    return {
      success: false,
      error: "O campo taxaMensal deve ser um número finito.",
    };
  }

  if (
    typeof payload.meses !== "number" ||
    !Number.isFinite(payload.meses) ||
    !Number.isInteger(payload.meses) ||
    payload.meses <= 0
  ) {
    return {
      success: false,
      error: "O campo meses deve ser um número inteiro positivo.",
    };
  }

  return {
    success: true,
    data: {
      principal: payload.principal,
      taxaMensal: payload.taxaMensal,
      meses: payload.meses,
    },
  };
}
