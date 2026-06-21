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
        --muted: #5b657a;
        --border: #d8deea;
        --accent: #1d4ed8;
        --accent-strong: #1e40af;
        --accent-soft: #dbeafe;
        --success-bg: #ecfdf3;
        --success-border: #86efac;
        --danger: #b91c1c;
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
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
        background: #ffffff;
        color: var(--ink);
        font: inherit;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      input::placeholder {
        color: #8a94a6;
      }

      input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.14);
      }

      button {
        min-height: 50px;
        padding: 14px 18px;
        border: 0;
        border-radius: 12px;
        background: linear-gradient(180deg, var(--accent), var(--accent-strong));
        color: #ffffff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        box-shadow: 0 12px 24px rgba(29, 78, 216, 0.22);
      }

      button:hover {
        transform: translateY(-1px);
      }

      button:focus-visible {
        outline: 3px solid rgba(29, 78, 216, 0.2);
        outline-offset: 2px;
      }

      button:active {
        transform: translateY(0);
      }

      .hint {
        margin: 0;
        font-size: 0.92rem;
        color: var(--muted);
      }

      .status {
        margin-top: 8px;
        padding-top: 24px;
        border-top: 1px solid var(--border);
        display: grid;
        gap: 14px;
      }

      .status h2 {
        margin: 0;
        font-size: 1.1rem;
      }

      #status-descricao {
        margin: 0;
      }

      output,
      [role="alert"] {
        display: block;
        min-height: 24px;
        padding: 16px;
        border-radius: 14px;
        line-height: 1.6;
      }

      #resultado {
        background: var(--success-bg);
        border: 1px solid var(--success-border);
        color: #166534;
      }

      #erro {
        background: var(--danger-bg);
        border: 1px solid var(--danger-border);
        color: var(--danger);
      }

      #erro p,
      #resultado p {
        margin: 0;
      }

      #erro p + p {
        margin-top: 8px;
      }

      .footer-note {
        margin-top: 20px;
        font-size: 0.92rem;
      }

      [hidden] {
        display: none;
      }

      @media (max-width: 720px) {
        main {
          padding: 16px;
        }

        .card {
          padding: 22px;
          border-radius: 18px;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        fieldset {
          padding: 16px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card" aria-labelledby="titulo-principal">
        <div class="eyebrow">iFactory • Simulação financeira</div>
        <h1 id="titulo-principal">Calculadora Financeira iFactory</h1>
        <p>
          Informe os dados abaixo para calcular uma simulação financeira com
          valor principal, taxa mensal e prazo em meses.
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
                  aria-describedby="principal-ajuda"
                  value="${escapeHtml(principalValue)}"
                  required
                />
                <p id="principal-ajuda" class="hint">
                  Informe o valor inicial da aplicação ou investimento.
                </p>
              </div>

              <div class="field">
                <label for="taxaMensal">Taxa mensal (%) *</label>
                <input
                  id="taxaMensal"
                  name="taxaMensal"
                  type="text"
                  inputmode="decimal"
                  placeholder="Ex.: 1,50"
                  aria-describedby="taxaMensal-ajuda"
                  value="${escapeHtml(monthlyRateValue)}"
                  required
                />
                <p id="taxaMensal-ajuda" class="hint">
                  Use percentual mensal, aceitando vírgula ou ponto.
                </p>
              </div>

              <div class="field">
                <label for="meses">Meses *</label>
                <input
                  id="meses"
                  name="meses"
                  type="text"
                  inputmode="numeric"
                  placeholder="Ex.: 12"
                  aria-describedby="meses-ajuda"
                  value="${escapeHtml(monthsValue)}"
                  required
                />
                <p id="meses-ajuda" class="hint">
                  Informe a duração da simulação em meses inteiros.
                </p>
              </div>
            </div>

            <button type="submit">Calcular</button>
          </fieldset>
        </form>

        <section class="status" aria-labelledby="resultado-titulo">
          <h2 id="resultado-titulo">Resultado da simulação</h2>
          <p id="status-descricao">${escapeHtml(statusDescription)}</p>
          ${resultSection}
          ${errorSection}
        </section>

        <p class="footer-note">${escapeHtml(formatCounterMessage(counter.increment()))}</p>
      </section>
    </main>
  </body>
</html>`;
}

export function handler(request: Request): Response {
  const url = new URL(request.url);

  if (request.method !== "GET" || url.pathname !== "/") {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(renderHomePage(url), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

if (import.meta.main) {
  Deno.serve(handler);
}
