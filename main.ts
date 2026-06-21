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
        --success-ink: #166534;
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

      [hidden] {
        display: none;
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
        gap: 16px;
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

      .help {
        font-size: 0.9rem;
        color: var(--muted);
      }

      input {
        width: 100%;
        min-width: 0;
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: 12px;
        font: inherit;
        color: var(--ink);
        background: #ffffff;
      }

      input:focus {
        outline: 3px solid rgba(29, 78, 216, 0.2);
        border-color: var(--accent);
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 12px;
        padding: 14px 20px;
        font: inherit;
        font-weight: 700;
        color: #ffffff;
        background: var(--accent);
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      button:hover {
        background: var(--accent-strong);
      }

      button:focus-visible {
        outline: 3px solid rgba(29, 78, 216, 0.25);
        outline-offset: 2px;
      }

      .feedback {
        display: grid;
        gap: 12px;
      }

      output,
      [role="alert"] {
        display: block;
        padding: 16px 18px;
        border-radius: 14px;
        border: 1px solid var(--border);
        word-break: break-word;
      }

      #resultado {
        color: var(--success-ink);
        background: var(--success-bg);
        border-color: var(--success-border);
      }

      #resultado strong {
        color: #14532d;
      }

      #erro {
        color: var(--danger);
        background: var(--danger-bg);
        border-color: var(--danger-border);
      }

      #erro p {
        margin: 0;
        color: inherit;
      }

      #erro p + p {
        margin-top: 8px;
      }

      .meta {
        margin-top: 24px;
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

        input,
        button {
          padding: 13px 14px;
        }
      }

      @media (max-width: 400px) {
        main {
          padding: 12px;
        }

        .card {
          padding: 18px;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card" aria-labelledby="titulo-principal">
        <div class="eyebrow">iFactory • Simulação financeira</div>
        <h1 id="titulo-principal">Calculadora de juros compostos</h1>
        <p id="status-descricao">${escapeHtml(statusDescription)}</p>
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
                  aria-describedby="principal-ajuda"
                  required
                />
                <span id="principal-ajuda" class="help">Informe o valor inicial aplicado.</span>
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
                  aria-describedby="taxaMensal-ajuda"
                  required
                />
                <span id="taxaMensal-ajuda" class="help">Use percentual mensal, como 1,5 para 1,5%.</span>
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
                  aria-describedby="meses-ajuda"
                  required
                />
                <span id="meses-ajuda" class="help">Digite a duração da simulação em meses inteiros.</span>
              </div>
            </div>
          </fieldset>
          <div class="actions">
            <button type="submit">Calcular</button>
          </div>
          <div class="feedback" aria-label="Resultado da simulação">
            ${resultSection}
            ${errorSection}
          </div>
        </form>
        <div class="meta">${escapeHtml(formatCounterMessage(counter.current()))}</div>
      </section>
    </main>
  </body>
</html>`;
}

export function handler(request: Request): Response | Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return Response.json({ ok: true });
  }

  if (url.pathname === "/api/visits") {
    const visits = counter.increment();
    return Response.json({
      visits,
      message: formatCounterMessage(visits),
    });
  }

  if (url.pathname === "/") {
    return new Response(renderHomePage(url), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.main) {
  Deno.serve(handler);
}
