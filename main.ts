import { formatCounterMessage, VisitCounter } from "./counter.ts";

const counter = new VisitCounter();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseDecimal(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().replace(",", ".");
  if (normalized === "") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function calculateCompoundAmount(
  principal: number,
  monthlyRatePercent: number,
  months: number,
): number {
  const rate = monthlyRatePercent / 100;
  return principal * (1 + rate) ** months;
}

function renderHomePage(url: URL): string {
  const principalValue = url.searchParams.get("principal") ?? "";
  const monthlyRateValue = url.searchParams.get("taxaMensal") ?? "";
  const monthsValue = url.searchParams.get("meses") ?? "";

  let resultHtml = "";
  let errorHtml = "";
  let statusDescription =
    "Preencha os campos e envie o formulário para calcular o montante final da simulação.";

  const hasSubmitted =
    principalValue !== "" || monthlyRateValue !== "" || monthsValue !== "";

  if (hasSubmitted) {
    const principal = parseDecimal(principalValue);
    const monthlyRate = parseDecimal(monthlyRateValue);
    const months = parseInteger(monthsValue);

    const errors: string[] = [];

    if (principal === null || principal <= 0) {
      errors.push("Informe um valor principal maior que zero.");
    }

    if (monthlyRate === null || monthlyRate < 0) {
      errors.push("Informe uma taxa mensal válida, igual ou maior que zero.");
    }

    if (months === null || months <= 0) {
      errors.push(
        "Informe a quantidade de meses com número inteiro maior que zero.",
      );
    }

    if (errors.length > 0) {
      statusDescription =
        "Há erros no preenchimento. Revise os campos informados.";
      errorHtml = errors.map((error: string) => `<p>${escapeHtml(error)}</p>`)
        .join("");
    } else {
      const total = calculateCompoundAmount(principal, monthlyRate, months);
      statusDescription =
        "Simulação calculada com sucesso. Confira o resultado abaixo.";
      resultHtml =
        `Montante final estimado: <strong>${escapeHtml(formatCurrency(total))}</strong>.`;
    }
  }

  const resultSection = resultHtml === ""
    ? '<output id="resultado" aria-live="polite" aria-atomic="true"></output>'
    : `<output id="resultado" aria-live="polite" aria-atomic="true">${resultHtml}</output>`;

  const errorSection = errorHtml === ""
    ? '<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" hidden></div>'
    : `<div id="erro" aria-live="assertive" aria-atomic="true" role="alert">${errorHtml}</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Calculadora Financeira iFactory</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f6fb;
        --bg-accent: #e8eefc;
        --panel: #ffffff;
        --ink: #162033;
        --muted: #4b5565;
        --border: #d8deea;
        --accent: #1d4ed8;
        --accent-strong: #173ea6;
        --accent-soft: #dbeafe;
        --success-ink: #14532d;
        --success-bg: #ecfdf3;
        --success-border: #86efac;
        --danger: #991b1b;
        --danger-bg: #fef2f2;
        --danger-border: #fecaca;
        --shadow: 0 18px 50px rgba(22, 32, 51, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      html {
        font-size: 16px;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background:
          radial-gradient(circle at top, var(--bg-accent), transparent 35%),
          var(--bg);
        color: var(--ink);
      }

      main {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .card {
        width: 100%;
        max-width: 720px;
        background: var(--panel);
        border: 1px solid rgba(216, 222, 234, 0.9);
        border-radius: 20px;
        padding: 32px;
        box-shadow: var(--shadow);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent-strong);
        font-size: 0.9rem;
        font-weight: 700;
      }

      h1 {
        margin: 0 0 10px;
        font-size: clamp(1.8rem, 4vw, 2.5rem);
        line-height: 1.15;
      }

      p {
        margin: 0 0 24px;
        color: var(--muted);
        line-height: 1.6;
      }

      form {
        display: grid;
        gap: 20px;
      }

      fieldset {
        margin: 0;
        padding: 20px;
        border: 1px solid var(--border);
        border-radius: 16px;
        display: grid;
        gap: 16px;
        background: #fcfdff;
      }

      legend {
        padding: 0 8px;
        font-weight: 700;
        color: var(--ink);
      }

      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .field {
        display: grid;
        gap: 8px;
      }

      label {
        font-weight: 700;
        color: var(--ink);
      }

      input {
        width: 100%;
        min-height: 48px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        font: inherit;
        color: var(--ink);
        background: #ffffff;
      }

      input::placeholder {
        color: #6b7280;
      }

      input:focus {
        outline: 3px solid rgba(29, 78, 216, 0.18);
        outline-offset: 1px;
        border-color: var(--accent);
      }

      small {
        color: var(--muted);
        line-height: 1.5;
      }

      .actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 12px;
        background: var(--accent-strong);
        color: #ffffff;
        font: inherit;
        font-weight: 700;
        padding: 14px 20px;
        min-height: 48px;
        cursor: pointer;
      }

      button:hover,
      button:focus-visible {
        background: var(--accent);
      }

      .status {
        margin: 0;
        font-size: 0.95rem;
        color: var(--muted);
      }

      .panel {
        margin-top: 4px;
        padding: 16px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #f8fafc;
      }

      #resultado {
        display: block;
        color: var(--success-ink);
        background: var(--success-bg);
        border-color: var(--success-border);
      }

      #erro {
        color: var(--danger);
        background: var(--danger-bg);
        border-color: var(--danger-border);
      }

      #erro p:last-child {
        margin-bottom: 0;
      }

      .counter {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
        font-size: 0.95rem;
        color: var(--muted);
      }

      @media (max-width: 900px) {
        .card {
          max-width: 680px;
        }
      }

      @media (max-width: 720px) {
        main {
          padding: 16px;
        }

        .card {
          padding: 24px;
          border-radius: 16px;
        }

        fieldset {
          padding: 16px;
        }

        .actions {
          align-items: stretch;
        }

        button {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .card {
          padding: 20px;
        }

        form {
          gap: 16px;
        }

        fieldset {
          padding: 14px;
          gap: 14px;
        }

        .grid {
          gap: 14px;
        }

        input,
        button {
          min-height: 44px;
          padding: 11px 13px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card" aria-labelledby="titulo-pagina">
        <div class="eyebrow">iFactory • Simulação financeira</div>
        <h1 id="titulo-pagina">Calculadora de juros compostos</h1>
        <p>
          Simule o montante final a partir do valor inicial, taxa mensal e período em meses.
        </p>
        <form method="get" action="/" aria-describedby="status-descricao">
          <fieldset>
            <legend>Dados da simulação</legend>
            <div class="grid">
              <div class="field">
                <label for="principal">Valor principal *</label>
                <input
                  id="principal"
                  name="principal"
                  type="text"
                  inputmode="decimal"
                  placeholder="Ex.: 1000,00"
                  value="${escapeHtml(principalValue)}"
                  required
                  aria-describedby="principal-ajuda"
                />
                <small id="principal-ajuda">Informe o valor inicial da aplicação.</small>
              </div>
              <div class="field">
                <label for="taxaMensal">Taxa mensal (%) *</label>
                <input
                  id="taxaMensal"
                  name="taxaMensal"
                  type="text"
                  inputmode="decimal"
                  placeholder="Ex.: 1,50"
                  value="${escapeHtml(monthlyRateValue)}"
                  required
                  aria-describedby="taxaMensal-ajuda"
                />
                <small id="taxaMensal-ajuda">Use percentual mensal, com ponto ou vírgula.</small>
              </div>
              <div class="field">
                <label for="meses">Meses *</label>
                <input
                  id="meses"
                  name="meses"
                  type="text"
                  inputmode="numeric"
                  placeholder="Ex.: 12"
                  value="${escapeHtml(monthsValue)}"
                  required
                  aria-describedby="meses-ajuda"
                />
                <small id="meses-ajuda">Digite apenas números inteiros.</small>
              </div>
            </div>
          </fieldset>

          <div class="actions">
            <button type="submit">Calcular</button>
            <p id="status-descricao" class="status">${escapeHtml(statusDescription)}</p>
          </div>

          <section aria-labelledby="titulo-resultado">
            <h2 id="titulo-resultado">Resultado da simulação</h2>
            <div class="panel">${resultSection}</div>
            <div class="panel">${errorSection}</div>
          </section>
        </form>
        <div class="counter">${escapeHtml(formatCounterMessage(counter.current()))}</div>
      </section>
    </main>
  </body>
</html>`;
}

function jsonResponse(body: string, init?: ResponseInit): Response {
  return new Response(body, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

export function handler(request: Request): Response | Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/") {
    return new Response(renderHomePage(url), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return jsonResponse(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (request.method === "GET" && url.pathname === "/api/visits") {
    const visits = counter.increment();
    return jsonResponse(
      JSON.stringify({ visits, message: formatCounterMessage(visits) }),
      { status: 200 },
    );
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.main) {
  Deno.serve(handler);
}
