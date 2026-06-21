import { formatCounterMessage, VisitCounter } from "./counter.ts";
import { calcularJurosCompostos } from "./src/juros_compostos.ts";

const counter: VisitCounter = new VisitCounter();

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

      body {
        margin: 0;
        font-family: system-ui, sans-serif;
        background: linear-gradient(180deg, #0b1020 0%, #121a30 100%);
        color: var(--text);
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
      h2 {
        margin: 0 0 12px;
        line-height: 1.2;
      }

      h1 {
        font-size: clamp(2rem, 4vw, 3rem);
      }

      h2 {
        font-size: 1.3rem;
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

      ul {
        margin: 0;
        padding-left: 20px;
      }

      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", "Courier New", monospace;
      }

      code {
        background: var(--code-bg);
        border-radius: 8px;
        padding: 2px 6px;
        color: var(--text);
      }

      pre {
        margin: 16px 0 0;
        padding: 16px;
        overflow-x: auto;
        background: #0a1327;
        border: 1px solid var(--panel-border);
        border-radius: 14px;
        color: var(--text);
      }

      .section + .section {
        margin-top: 24px;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero" aria-labelledby="titulo-principal">
        <span class="eyebrow">iFactory</span>
        <h1 id="titulo-principal">Calculadora Financeira iFactory</h1>
        <p>
          API simples para cálculo de juros compostos, pronta para testes,
          integração com front-end e automações internas.
        </p>
      </section>

      <div class="grid">
        <section class="section" aria-labelledby="como-usar">
          <h2 id="como-usar">Como usar</h2>
          <ul>
            <li>Envie requisições <code>POST</code> para <code>/api/juros-compostos</code>.</li>
            <li>Informe <code>capitalInicial</code>, <code>taxa</code> e <code>periodos</code>.</li>
            <li>Receba o <code>montante</code> calculado com juros compostos.</li>
          </ul>
        </section>

        <section class="section" aria-labelledby="casos-de-uso">
          <h2 id="casos-de-uso">Casos de uso</h2>
          <ul>
            <li>Simulações financeiras rápidas em aplicações internas.</li>
            <li>Validação de cenários de investimento e projeções.</li>
            <li>Integração com formulários, dashboards e workflows automatizados.</li>
          </ul>
        </section>
      </div>

      <section class="section" aria-labelledby="exemplo-api">
        <h2 id="exemplo-api">Exemplo de requisição</h2>
        <p>
          Faça um <code>POST</code> para <code>/api/juros-compostos</code> com JSON.
        </p>
        <pre>{
  "capitalInicial": 1000,
  "taxa": 0.1,
  "periodos": 2
}</pre>
      </section>
    </main>
  </body>
</html>`;
}

export async function handler(req: Request): Promise<Response> {
  const url: URL = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/") {
    return htmlResponse(renderHomePage());
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "ifactory-product",
      version: "0.1.0",
    });
  }

  if (req.method === "GET" && url.pathname === "/api/visits") {
    const visits: number = counter.increment();

    return jsonResponse({
      message: formatCounterMessage(visits),
      totalVisits: visits,
      visits,
    });
  }

  if (req.method === "POST" && url.pathname === "/api/juros-compostos") {
    if (!hasJsonContentType(req)) {
      return jsonResponse(
        {
          error: "unsupported media type",
        },
        { status: 415 },
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          error: "invalid json",
        },
        { status: 400 },
      );
    }

    const validation: ValidationResult = validateJurosCompostosPayload(body);

    if (!validation.ok) {
      return jsonResponse(
        {
          error: "invalid payload",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const { capitalInicial, taxa, periodos } = validation.payload;
    const montante: number = calcularJurosCompostos({
      capitalInicial,
      taxa,
      periodos,
    });

    return jsonResponse({
      capitalInicial,
      taxa,
      periodos,
      montante,
    });
  }

  return jsonResponse(
    {
      error: "not found",
    },
    { status: 404 },
  );
}

if (import.meta.main) {
  Deno.serve(handler);
}
