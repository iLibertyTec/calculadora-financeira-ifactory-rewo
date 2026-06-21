import { calcularJurosCompostos } from "./src/juros_compostos.ts";

const JUROS_COMPOSTOS_FIELDS = ["capitalInicial", "taxa", "periodos"] as const;

type JurosCompostosField = typeof JUROS_COMPOSTOS_FIELDS[number];

type JurosCompostosPayload = {
  capitalInicial: number;
  taxa: number;
  periodos: number;
};

type ValidationResult =
  | {
    ok: true;
    payload: JurosCompostosPayload;
  }
  | {
    ok: false;
    errors: Record<string, string>;
  };

type VisitsState = {
  visits: number;
  uniqueVisitors: number;
};

const visitsState: VisitsState = {
  visits: 0,
  uniqueVisitors: 0,
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers: Headers = new Headers(init?.headers);

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function htmlResponse(body: string, init?: ResponseInit): Response {
  const headers: Headers = new Headers(init?.headers);

  if (!headers.has("content-type")) {
    headers.set("content-type", "text/html; charset=utf-8");
  }

  return new Response(body, {
    ...init,
    headers,
  });
}

function hasJsonContentType(req: Request): boolean {
  const contentType: string | null = req.headers.get("content-type");

  if (!contentType) {
    return false;
  }

  const mimeType: string | undefined = contentType.split(";", 1)[0]?.trim()
    .toLowerCase();

  return mimeType === "application/json";
}

function validateJurosCompostosPayload(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      ok: false,
      errors: {
        body: "must be an object",
      },
    };
  }

  const payload: Record<string, unknown> = value as Record<string, unknown>;
  const errors: Record<string, string> = {};

  for (const key of Object.keys(payload)) {
    if (!JUROS_COMPOSTOS_FIELDS.includes(key as JurosCompostosField)) {
      errors[key] = "is not allowed";
    }
  }

  if (!("capitalInicial" in payload)) {
    errors.capitalInicial = "is required";
  } else if (
    typeof payload.capitalInicial !== "number" ||
    !Number.isFinite(payload.capitalInicial)
  ) {
    errors.capitalInicial = "must be a finite number";
  }

  if (!("taxa" in payload)) {
    errors.taxa = "is required";
  } else if (
    typeof payload.taxa !== "number" ||
    !Number.isFinite(payload.taxa)
  ) {
    errors.taxa = "must be a finite number";
  }

  if (!("periodos" in payload)) {
    errors.periodos = "is required";
  } else if (
    typeof payload.periodos !== "number" ||
    !Number.isFinite(payload.periodos)
  ) {
    errors.periodos = "must be a finite number";
  } else if (!Number.isInteger(payload.periodos)) {
    errors.periodos = "must be an integer";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    payload: {
      capitalInicial: payload.capitalInicial as number,
      taxa: payload.taxa as number,
      periodos: payload.periodos as number,
    },
  };
}

function renderHomePage(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Calculadora Financeira iFactory</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1020;
        --panel: #151c33;
        --panel-border: rgba(255, 255, 255, 0.08);
        --text: #ecf1ff;
        --muted: #afbad6;
        --accent: #7cb2ff;
        --accent-strong: #4c8dff;
        --code-bg: rgba(124, 178, 255, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        font-family: system-ui, sans-serif;
        background: linear-gradient(180deg, #0b1020 0%, #121a30 100%);
        color: var(--text);
      }

      a {
        color: var(--accent);
      }

      .skip-link {
        position: absolute;
        left: 16px;
        top: -48px;
        background: var(--accent-strong);
        color: white;
        padding: 10px 14px;
        border-radius: 10px;
        text-decoration: none;
        z-index: 10;
      }

      .skip-link:focus {
        top: 16px;
      }

      main {
        width: min(960px, calc(100% - 32px));
        margin: 0 auto;
        padding: 48px 0 64px;
      }

      .hero,
      .section {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
      }

      .hero {
        margin-bottom: 24px;
      }

      .eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        color: var(--accent);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      h1,
      h2,
      h3 {
        margin: 0 0 12px;
        line-height: 1.2;
      }

      h1 {
        font-size: clamp(2rem, 4vw, 3rem);
      }

      h2 {
        font-size: 1.3rem;
      }

      h3 {
        font-size: 1.05rem;
      }

      p,
      li {
        color: var(--muted);
        line-height: 1.6;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 24px;
        margin-top: 24px;
      }

      .steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-top: 20px;
      }

      .step,
      .card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--panel-border);
        border-radius: 16px;
        padding: 18px;
      }

      .cta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 18px;
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--accent-strong);
        color: white;
        text-decoration: none;
        font-weight: 700;
      }

      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      pre {
        margin: 16px 0 0;
        padding: 18px;
        overflow-x: auto;
        border-radius: 16px;
        background: var(--code-bg);
        border: 1px solid rgba(124, 178, 255, 0.2);
        color: var(--text);
      }

      .note {
        margin-top: 14px;
        font-size: 0.95rem;
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
    <main id="conteudo-principal" tabindex="-1">
      <section class="hero" aria-labelledby="titulo-principal">
        <span class="eyebrow">iFactory</span>
        <h1 id="titulo-principal">Calculadora Financeira iFactory</h1>
        <p>
          Uma API simples para demonstrar cálculos de juros compostos com validação
          de entrada e respostas em JSON, pronta para testes, integração e evolução.
        </p>
        <a class="cta" href="#como-usar">Ver como usar</a>
      </section>

      <section class="section" id="como-usar" aria-labelledby="subtitulo-como-usar">
        <h2 id="subtitulo-como-usar">Como usar</h2>
        <div class="steps">
          <div class="step">
            <h3>1. Envie os dados</h3>
            <p>Informe <code>capitalInicial</code>, <code>taxa</code> e <code>periodos</code> em JSON.</p>
          </div>
          <div class="step">
            <h3>2. Chame a API</h3>
            <p>Faça uma requisição <code>POST /api/juros-compostos</code> com <code>content-type: application/json</code>.</p>
          </div>
          <div class="step">
            <h3>3. Receba o montante</h3>
            <p>A resposta retorna os dados informados e o valor calculado de <code>montante</code>.</p>
          </div>
        </div>
      </section>

      <div class="grid">
        <section class="section" aria-labelledby="subtitulo-exemplo">
          <h2 id="subtitulo-exemplo">Exemplo de requisição</h2>
          <pre>POST /api/juros-compostos
content-type: application/json

{
  "capitalInicial": 1000,
  "taxa": 0.1,
  "periodos": 2
}</pre>
          <p class="note">O exemplo abaixo é estático e serve apenas para ilustrar a operação da API na home.</p>
        </section>

        <section class="section" aria-labelledby="subtitulo-retorno">
          <h2 id="subtitulo-retorno">Exemplo de resposta</h2>
          <pre>{
  "capitalInicial": 1000,
  "taxa": 0.1,
  "periodos": 2,
  "montante": 1210
}</pre>
          <p class="note">Neste cenário, o montante = 1210 após aplicar juros compostos por 2 períodos.</p>
        </section>
      </div>
    </main>
  </body>
</html>`;
}

function getVisitsResponseBody(): {
  visits: number;
  uniqueVisitors: number;
  message: string;
} {
  return {
    visits: visitsState.visits,
    uniqueVisitors: visitsState.uniqueVisitors,
    message: "Visit registered successfully",
  };
}

export async function handler(req: Request): Promise<Response> {
  const url: URL = new URL(req.url);

  if (url.pathname === "/") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return jsonResponse(
        { error: "method not allowed" },
        { status: 405, headers: { allow: "GET, HEAD" } },
      );
    }

    if (req.method === "HEAD") {
      return htmlResponse("", { status: 200 });
    }

    return htmlResponse(renderHomePage());
  }

  if (url.pathname === "/health") {
    if (req.method !== "GET") {
      return jsonResponse(
        { error: "method not allowed" },
        { status: 405, headers: { allow: "GET" } },
      );
    }

    return jsonResponse({
      ok: true,
      service: "ifactory-product",
      version: "0.1.0",
    });
  }

  if (url.pathname === "/api/visits") {
    if (req.method === "GET") {
      return jsonResponse(getVisitsResponseBody());
    }

    if (req.method === "POST") {
      visitsState.visits += 1;
      visitsState.uniqueVisitors += 1;
      return jsonResponse(getVisitsResponseBody());
    }

    return jsonResponse(
      { error: "method not allowed" },
      { status: 405, headers: { allow: "GET, POST" } },
    );
  }

  if (url.pathname === "/api/juros-compostos") {
    if (req.method !== "POST") {
      return jsonResponse(
        { error: "method not allowed" },
        { status: 405, headers: { allow: "POST" } },
      );
    }

    if (!hasJsonContentType(req)) {
      return jsonResponse(
        { error: "unsupported media type" },
        { status: 415 },
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "invalid json" },
        { status: 400 },
      );
    }

    const validation: ValidationResult = validateJurosCompostosPayload(body);

    if (!validation.ok) {
      return jsonResponse(
        {
          error: "validation failed",
          fields: validation.errors,
        },
        { status: 400 },
      );
    }

    const { capitalInicial, taxa, periodos } = validation.payload;
    const montante: number = calcularJurosCompostos(
      capitalInicial,
      taxa,
      periodos,
    );

    return jsonResponse({
      capitalInicial,
      taxa,
      periodos,
      montante,
    });
  }

  return jsonResponse({ error: "not found" }, { status: 404 });
}

if (import.meta.main) {
  Deno.serve(handler);
}
