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

const JUROS_COMPOSTOS_FIELDS: readonly string[] = [
  "principal",
  "taxaMensal",
  "meses",
];

function isJsonContentType(contentType: string | null): boolean {
  if (contentType === null) {
    return false;
  }

  const mediaType: string = contentType.split(";", 1)[0].trim().toLowerCase();

  return mediaType === "application/json" || mediaType.endsWith("+json");
}

export async function readJurosCompostosRequest(
  req: Request,
): Promise<JurosCompostosRequestResult> {
  if (!isJsonContentType(req.headers.get("content-type"))) {
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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      success: false,
      error: "O corpo da requisição deve ser um objeto JSON.",
    };
  }

  const payload: Record<string, unknown> = body as Record<string, unknown>;
  const extraFields: string[] = Object.keys(payload).filter((key: string) => {
    return !JUROS_COMPOSTOS_FIELDS.includes(key);
  });

  if (extraFields.length > 0) {
    return {
      success: false,
      error: `Campo(s) desconhecido(s): ${extraFields.join(", ")}.`,
    };
  }

  if (!Object.hasOwn(payload, "principal")) {
    return {
      success: false,
      error: "O campo principal é obrigatório.",
    };
  }

  if (!Object.hasOwn(payload, "taxaMensal")) {
    return {
      success: false,
      error: "O campo taxaMensal é obrigatório.",
    };
  }

  if (!Object.hasOwn(payload, "meses")) {
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
    !Number.isFinite(payload.taxaMensal) ||
    payload.taxaMensal < 0
  ) {
    return {
      success: false,
      error:
        "O campo taxaMensal deve ser um número finito maior ou igual a zero.",
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
