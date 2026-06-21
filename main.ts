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
      const totalInterest = total - principal;
      statusDescription =
        "Simulação calculada com sucesso. Confira o resultado abaixo.";
      resultHtml = `
        <p>Montante final estimado: <strong data-amount="${escapeHtml(String(total))}">${escapeHtml(String(total))}</strong>.</p>
        <p>Juros totais: <strong data-interest="${escapeHtml(String(totalInterest))}">${escapeHtml(String(totalInterest))}</strong>.</p>
      `;
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
        margin: 0 auto;
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

      input {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 1rem;
        color: var(--ink);
        background: #fff;
      }

      input:focus {
        outline: 3px solid rgba(29, 78, 216, 0.18);
        border-color: var(--accent);
      }

      .help {
        margin: 0;
        font-size: 0.92rem;
        color: var(--muted);
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 14px 22px;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        justify-self: start;
      }

      button:hover {
        filter: brightness(1.03);
      }

      button:focus-visible {
        outline: 3px solid rgba(29, 78, 216, 0.22);
        outline-offset: 3px;
      }

      .status {
        margin: 0;
        font-size: 0.95rem;
      }

      output,
      [role="alert"] {
        display: block;
        padding: 18px 20px;
        border-radius: 16px;
        word-break: break-word;
      }

      output {
        background: var(--success-bg);
        border: 1px solid var(--success-border);
        color: var(--success-ink);
      }

      #resultado p {
        margin: 0;
        color: inherit;
      }

      #resultado p + p {
        margin-top: 8px;
      }

      #resultado strong {
        font-size: 1.05em;
      }

      [role="alert"] {
        background: var(--danger-bg);
        border: 1px solid var(--danger-border);
        color: var(--danger);
      }

      [role="alert"] p {
        margin: 0;
        color: inherit;
      }

      [role="alert"] p + p {
        margin-top: 8px;
      }

      footer {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 0.95rem;
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
          border-radius: 18px;
        }
      }

      @media (max-width: 400px) {
        .card {
          padding: 20px;
        }

        button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card" aria-labelledby="titulo-principal">
        <div class="eyebrow">iFactory • Simulador financeiro</div>
        <h1 id="titulo-principal">Calculadora de juros compostos</h1>
        <p>
          Informe os dados da simulação para descobrir o montante acumulado ao
          final do período desejado.
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
                  aria-describedby="principal-ajuda"
                  required
                />
                <p class="help" id="principal-ajuda">
                  Digite o valor inicial da aplicação ou empréstimo.
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
                  value="${escapeHtml(monthlyRateValue)}"
                  aria-describedby="taxaMensal-ajuda"
                  required
                />
                <p class="help" id="taxaMensal-ajuda">
                  Informe a taxa de juros aplicada por mês.
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
                  value="${escapeHtml(monthsValue)}"
                  aria-describedby="meses-ajuda"
                  required
                />
                <p class="help" id="meses-ajuda">
                  Use apenas números inteiros para a duração da simulação.
                </p>
              </div>
            </div>
          </fieldset>

          <button type="submit">Calcular</button>

          <p class="status" id="status-descricao">${escapeHtml(statusDescription)}</p>

          <section aria-labelledby="resultado-titulo">
            <h2 id="resultado-titulo">Resultado da simulação</h2>
            ${resultSection}
            ${errorSection}
          </section>
        </form>

        <footer>
          ${escapeHtml(formatCounterMessage(counter.increment()))}
        </footer>
      </section>
    </main>
    <script>
      const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      const montante = document.querySelector("[data-amount]");
      if (montante instanceof HTMLElement) {
        const valor = Number(montante.dataset.amount);
        if (Number.isFinite(valor)) {
          montante.textContent = formatadorMoeda.format(valor);
        }
      }

      const jurosTotais = document.querySelector("[data-interest]");
      if (jurosTotais instanceof HTMLElement) {
        const valor = Number(jurosTotais.dataset.interest);
        if (Number.isFinite(valor)) {
          jurosTotais.textContent = formatadorMoeda.format(valor);
        }
      }
    </script>
  </body>
</html>`;
}

function jsonResponse(body: string, status: number = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function htmlResponse(body: string, status: number = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export function handler(request: Request): Response | Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return jsonResponse(
      '{"ok":true,"service":"calculadora-financeira-ifactory-rewo","version":"1.0.0"}',
    );
  }

  if (url.pathname === "/api/visits") {
    const visits = counter.increment();
    return jsonResponse(
      JSON.stringify({
        visits,
        message: formatCounterMessage(visits),
      }),
    );
  }

  if (url.pathname === "/") {
    return htmlResponse(renderHomePage(url));
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.main) {
  Deno.serve(handler);
}
