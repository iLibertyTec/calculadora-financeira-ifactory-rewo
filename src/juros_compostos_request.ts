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

  const normalizedContentType: string = contentType.trim().toLowerCase();

  return normalizedContentType === "application/json" ||
    normalizedContentType.startsWith("application/json;") ||
    normalizedContentType.includes("+json") ||
    normalizedContentType.includes("/json;");
}

export async function readJurosCompostosRequest(
  req: Request,
): Promise<JurosCompostosRequestResult> {
  if (!isJsonContentType(req.headers.get("content-type"))) {
    return {
      success: false,
      error: "Validação falhou: o corpo da requisição deve estar em JSON.",
    };
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return {
      success: false,
      error: "Validação falhou: o JSON da requisição é inválido.",
    };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      success: false,
      error:
        "Validação falhou: o corpo da requisição deve ser um objeto JSON.",
    };
  }

  const payload: Record<string, unknown> = body as Record<string, unknown>;
  const payloadKeys: string[] = Reflect.ownKeys(payload).filter((key: PropertyKey) => {
    return typeof key === "string";
  }) as string[];
  const extraFields: string[] = payloadKeys.filter((key: string) => {
    return !JUROS_COMPOSTOS_FIELDS.includes(key);
  });

  if (extraFields.length > 0) {
    return {
      success: false,
      error:
        `Validação falhou: campo(s) desconhecido(s): ${extraFields.join(", ")}.`,
    };
  }

  if (!Object.hasOwn(payload, "principal")) {
    return {
      success: false,
      error: "Validação falhou: campo principal é obrigatório.",
    };
  }

  if (!Object.hasOwn(payload, "taxaMensal")) {
    return {
      success: false,
      error: "Validação falhou: campo taxaMensal é obrigatório.",
    };
  }

  if (!Object.hasOwn(payload, "meses")) {
    return {
      success: false,
      error: "Validação falhou: campo meses é obrigatório.",
    };
  }

  if (
    typeof payload.principal !== "number" ||
    !Number.isFinite(payload.principal) ||
    payload.principal <= 0
  ) {
    return {
      success: false,
      error:
        "Validação falhou: campo principal inválido: deve ser um número finito maior que zero.",
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
        "Validação falhou: campo taxaMensal inválido: deve ser um número finito maior ou igual a zero.",
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
      error:
        "Validação falhou: campo meses inválido: deve ser um número inteiro positivo.",
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
