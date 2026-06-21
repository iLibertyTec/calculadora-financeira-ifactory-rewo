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
      li,
      label {
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

      ul {
        margin: 0;
        padding-left: 20px;
      }

      code,
      pre,
      input,
      button,
      output {
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

      form {
        display: grid;
        gap: 16px;
        margin-top: 20px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      label {
        display: grid;
        gap: 8px;
      }

      input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--panel-border);
        background: #0a1327;
        color: var(--text);
      }

      button {
        width: fit-content;
        padding: 12px 16px;
        border: 0;
        border-radius: 12px;
        background: var(--accent-strong);
        color: white;
        font-weight: 700;
        cursor: pointer;
      }

      output {
        display: block;
        margin-top: 16px;
        padding: 16px;
        border-radius: 14px;
        background: #0a1327;
        border: 1px solid var(--panel-border);
        color: var(--text);
        white-space: pre-wrap;
      }

      .section + .section {
        margin-top: 24px;
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
    <main id="conteudo-principal">
      <section class="hero" aria-labelledby="titulo-principal">
        <span class="eyebrow">iFactory</span>
        <h1 id="titulo-principal">Calculadora Financeira iFactory</h1>
        <p>
          Serviço para cálculo de juros compostos com uma interface inicial clara,
          acessível e pronta para demonstração. Use a home para entender o fluxo,
          testar o exemplo e integrar sua aplicação com o endpoint principal.
        </p>
        <a class="cta" href="#demo-api" aria-describedby="descricao-cta-api">
          Testar fluxo da calculadora
        </a>
        <p id="descricao-cta-api">
          Endpoint principal: <code>POST /api/juros-compostos</code>
        </p>
        <div class="steps" aria-label="Fluxo principal de uso">
          <div class="step">
            <h2>1. Informe os dados</h2>
            <p>Capital inicial, taxa por período e quantidade de períodos.</p>
          </div>
          <div class="step">
            <h2>2. Envie para a API</h2>
            <p>Faça uma requisição JSON para <code>/api/juros-compostos</code>.</p>
          </div>
          <div class="step">
            <h2>3. Receba o montante</h2>
            <p>A resposta retorna os dados enviados e o valor final calculado.</p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="demo-api">
        <h2 id="demo-api">Demonstração visível do cálculo</h2>
        <p>
          Exemplo de uso com <code>capitalInicial = 1000</code>,
          <code>taxa = 0.1</code> e <code>periodos = 2</code>. O resultado esperado
          é <code>1210</code>.
        </p>
        <form aria-label="Exemplo de cálculo de juros compostos">
          <div class="form-grid">
            <label>
              Capital inicial
              <input type="number" value="1000" readonly>
            </label>
            <label>
              Taxa
              <input type="number" value="0.1" readonly>
            </label>
            <label>
              Períodos
              <input type="number" value="2" readonly>
            </label>
          </div>
          <button type="button" aria-disabled="true">Calcular via API</button>
          <output aria-label="Resultado esperado do cálculo">
montante = 1210
endpoint = POST /api/juros-compostos
          </output>
        </form>
      </section>

      <section class="section" aria-labelledby="integracao-api">
        <h2 id="integracao-api">Integração rápida</h2>
        <div class="grid">
          <div class="card">
            <h3>Payload esperado</h3>
            <pre>{
  "capitalInicial": 1000,
  "taxa": 0.1,
  "periodos": 2
}</pre>
          </div>
          <div class="card">
            <h3>Exemplo com fetch</h3>
            <pre>fetch("/api/juros-compostos", {
  method: "POST",
  headers: {
    "content-type": "application/json"
  },
  body: JSON.stringify({
    capitalInicial: 1000,
    taxa: 0.1,
    periodos: 2
  })
});</pre>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export async function handler(req: Request): Promise<Response> {
  const url: URL = new URL(req.url);

  if (url.pathname === "/" && (req.method === "GET" || req.method === "HEAD")) {
    return htmlResponse(req.method === "HEAD" ? "" : renderHomePage());
  }

  if (url.pathname === "/health" && req.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "ifactory-product",
      version: "0.1.0",
    });
  }

  if (url.pathname === "/api/juros-compostos") {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          error: "method not allowed",
        },
        {
          status: 405,
          headers: {
            allow: "POST",
          },
        },
      );
    }

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

    const montante: number = calcularJurosCompostos(
      validation.payload.capitalInicial,
      validation.payload.taxa,
      validation.payload.periodos,
    );

    return jsonResponse({
      ...validation.payload,
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
