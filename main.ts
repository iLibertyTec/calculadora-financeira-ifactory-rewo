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
      errors.push("Informe a quantidade de meses com número inteiro maior que zero.");
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
      resultHtml = `Montante final estimado: <strong>${escapeHtml(formatCurrency(total))}</strong>.`;
    }
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Calculadora Financeira iFactory</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --ink: #162033;
        --muted: #5b657a;
        --border: #d8deea;
        --accent: #1d4ed8;
        --danger: #b91c1c;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: var(--bg);
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
        max-width: 640px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 10px 30px rgba(22, 32, 51, 0.08);
      }

      h1 {
        margin: 0 0 8px;
        font-size: 2rem;
      }

      p {
        margin: 0 0 24px;
        color: var(--muted);
        line-height: 1.5;
      }

      form {
        display: grid;
        gap: 16px;
      }

      fieldset {
        margin: 0;
        padding: 0;
        border: 0;
        display: grid;
        gap: 16px;
      }

      legend {
        margin-bottom: 8px;
        font-weight: 700;
      }

      .field {
        display: grid;
        gap: 8px;
      }

      label {
        font-weight: 700;
      }

      input {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        font: inherit;
      }

      button {
        padding: 14px 18px;
        border: 0;
        border-radius: 10px;
        background: var(--accent);
        color: #ffffff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .hint {
        margin: 0;
        font-size: 0.95rem;
        color: var(--muted);
      }

      .status {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--border);
        display: grid;
        gap: 16px;
      }

      output,
      [role="alert"] {
        display: block;
        min-height: 24px;
      }

      #erro {
        color: var(--danger);
      }

      #erro p,
      #resultado p {
        margin: 0;
      }

      [hidden] {
        display: none;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card" aria-labelledby="titulo-principal">
        <h1 id="titulo-principal">Calculadora Financeira iFactory</h1>
        <p>
          Informe os dados abaixo para calcular uma simulação financeira com
          valor principal, taxa mensal e prazo em meses.
        </p>

        <form method="get" action="/" aria-describedby="status-descricao">
          <fieldset>
            <legend>Dados da simulação</legend>

            <div class="field">
              <label for="principal">Valor principal *</label>
              <input
                id="principal"
                name="principal"
                type="text"
                inputmode="decimal"
                required
                aria-required="true"
                aria-describedby="principal-ajuda"
                placeholder="Ex.: 1000,00"
                value="${escapeHtml(principalValue)}"
              />
              <p id="principal-ajuda" class="hint">
                Campo obrigatório. Informe um valor maior que zero. Aceita ponto
                ou vírgula para decimais.
              </p>
            </div>

            <div class="field">
              <label for="taxaMensal">Taxa mensal (%) *</label>
              <input
                id="taxaMensal"
                name="taxaMensal"
                type="text"
                inputmode="decimal"
                required
                aria-required="true"
                aria-describedby="taxaMensal-ajuda"
                placeholder="Ex.: 1,50"
                value="${escapeHtml(monthlyRateValue)}"
              />
              <p id="taxaMensal-ajuda" class="hint">
                Campo obrigatório. Informe a taxa em porcentagem mensal. Aceita
                ponto ou vírgula para decimais.
              </p>
            </div>

            <div class="field">
              <label for="meses">Meses *</label>
              <input
                id="meses"
                name="meses"
                type="text"
                inputmode="numeric"
                required
                aria-required="true"
                aria-describedby="meses-ajuda"
                placeholder="Ex.: 12"
                value="${escapeHtml(monthsValue)}"
              />
              <p id="meses-ajuda" class="hint">
                Campo obrigatório. Informe um número inteiro maior que zero.
              </p>
            </div>
          </fieldset>

          <button type="submit">Calcular</button>
        </form>

        <section class="status" aria-labelledby="status-titulo">
          <h2 id="status-titulo">Resultado da simulação</h2>
          <p id="status-descricao" class="hint">${escapeHtml(statusDescription)}</p>
          <output id="resultado" aria-live="polite" aria-atomic="true">${resultHtml}</output>
          <div id="erro" aria-live="assertive" aria-atomic="true" role="alert"${errorHtml === "" ? " hidden" : ""}>${errorHtml}</div>
        </section>
      </section>
    </main>
  </body>
</html>`;
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return Response.json({
      ok: true,
      service: "ifactory-product",
      version: "0.1.0",
    });
  }

  if (url.pathname === "/api/visits" && req.method === "GET") {
    return Response.json(counter.state);
  }

  if (url.pathname === "/api/visits" && req.method === "POST") {
    const body = req.headers.get("content-type")?.includes("json")
      ? await req.json().catch(() => ({}))
      : {};
    const visitorId = typeof body.visitorId === "string"
      ? body.visitorId
      : undefined;
    const state = counter.recordVisit(visitorId);
    return Response.json({
      ...state,
      message: formatCounterMessage(state),
    });
  }

  if (url.pathname === "/") {
    return new Response(renderHomePage(url), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.main) {
  Deno.serve(handler);
}
