import { formatCounterMessage, VisitCounter } from "./counter.ts";

const counter = new VisitCounter();
const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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

function formatCurrency(value: number): string {
  return brlFormatter.format(value);
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
      const formattedTotal = formatCurrency(total);
      const formattedTotalInterest = formatCurrency(totalInterest);
      statusDescription =
        "Simulação calculada com sucesso. Confira o resultado abaixo.";
      resultHtml = `
        <p>Montante final estimado: <strong data-amount="${escapeHtml(String(total))}">${escapeHtml(formattedTotal)}</strong>.</p>
        <p>Juros totais: <strong data-interest="${escapeHtml(String(totalInterest))}">${escapeHtml(formattedTotalInterest)}</strong>.</p>
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

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 700;
        color: var(--ink);
      }

      input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        font: inherit;
        color: var(--ink);
        background: #fff;
      }

      input:focus {
        outline: 3px solid rgba(29, 78, 216, 0.18);
        border-color: var(--accent);
      }

      .hint {
        margin: 8px 0 0;
        font-size: 0.92rem;
        color: var(--muted);
      }

      button {
        border: 0;
        border-radius: 12px;
        padding: 14px 18px;
        background: var(--accent);
        color: #fff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      button:hover {
        background: var(--accent-strong);
      }

      output,
      [role="alert"] {
        display: block;
        margin-top: 8px;
        padding: 16px 18px;
        border-radius: 16px;
        border: 1px solid transparent;
        word-break: break-word;
      }

      output {
        background: var(--success-bg);
        border-color: var(--success-border);
        color: var(--success-ink);
      }

      #resultado p,
      #erro p {
        margin: 0;
      }

      #resultado p + p,
      #erro p + p {
        margin-top: 12px;
      }

      #resultado strong {
        color: var(--success-ink);
      }

      [role="alert"] {
        background: var(--danger-bg);
        border-color: var(--danger-border);
        color: var(--danger);
      }

      .footer {
        margin-top: 24px;
        font-size: 0.95rem;
        color: var(--muted);
      }

      @media (max-width: 900px) {
        .card {
          max-width: 100%;
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
          Informe os dados abaixo para estimar o montante acumulado e os juros
          totais da aplicação.
        </p>
        <form method="get" action="/" aria-describedby="status-descricao">
          <fieldset>
            <legend>Dados da simulação</legend>
            <div class="grid">
              <div>
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
                <p id="principal-ajuda" class="hint">
                  Digite o valor inicial da aplicação em reais.
                </p>
              </div>
              <div>
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
                <p id="taxaMensal-ajuda" class="hint">
                  Informe a taxa percentual aplicada ao mês.
                </p>
              </div>
              <div>
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
                <p id="meses-ajuda" class="hint">
                  Use um número inteiro de meses para a simulação.
                </p>
              </div>
            </div>
            <button type="submit">Calcular</button>
          </fieldset>
        </form>

        <p id="status-descricao" class="hint">${escapeHtml(statusDescription)}</p>

        <section aria-labelledby="resultado-titulo">
          <h2 id="resultado-titulo">Resultado da simulação</h2>
          ${resultSection}
          ${errorSection}
        </section>

        <p class="footer">${escapeHtml(formatCounterMessage(counter.incrementAndGetVisits()))}</p>
      </section>
    </main>
    <script>
      const currencyFormatter = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      for (const element of document.querySelectorAll("[data-amount], [data-interest]")) {
        const rawValue = element.getAttribute("data-amount") ??
          element.getAttribute("data-interest");

        if (rawValue === null) {
          continue;
        }

        const parsedValue = Number(rawValue);
        if (!Number.isFinite(parsedValue)) {
          continue;
        }

        element.textContent = currencyFormatter.format(parsedValue);
      }
    </script>
  </body>
</html>`;
}

function jsonResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export function handler(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return jsonResponse(
      JSON.stringify({
        ok: true,
        service: "calculadora-financeira-ifactory-rewo",
        version: "1.0.0",
      }),
    );
  }

  if (url.pathname === "/api/visits") {
    const visits = counter.incrementAndGetVisits();
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
