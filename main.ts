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
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        font-size: 1rem;
        color: var(--ink);
        background: #fff;
      }

      input:focus {
        outline: 3px solid rgba(29, 78, 216, 0.2);
        border-color: var(--accent);
      }

      small {
        color: var(--muted);
        line-height: 1.5;
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 12px;
        padding: 14px 20px;
        background: var(--accent);
        color: #fff;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      button:hover,
      button:focus-visible {
        background: var(--accent-strong);
      }

      .status {
        margin-top: 20px;
        display: grid;
        gap: 12px;
      }

      #status-descricao {
        margin: 0;
      }

      output,
      [role="alert"] {
        display: block;
        padding: 16px;
        border-radius: 14px;
        border: 1px solid transparent;
        word-break: break-word;
      }

      #resultado {
        background: var(--success-bg);
        border-color: var(--success-border);
        color: var(--success-ink);
      }

      #resultado strong {
        color: inherit;
      }

      #erro {
        background: var(--danger-bg);
        border-color: var(--danger-border);
        color: var(--danger);
      }

      #erro p {
        margin: 0;
        color: inherit;
      }

      #erro p + p {
        margin-top: 8px;
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
      <section class="card" aria-labelledby="titulo-pagina">
        <div class="eyebrow">iFactory • Simulador</div>
        <h1 id="titulo-pagina">Calculadora financeira</h1>
        <p>
          Simule o montante final com juros compostos informando o valor
          principal, a taxa mensal e o prazo em meses.
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
                <small id="principal-ajuda">
                  Informe o valor inicial do investimento ou aplicação.
                </small>
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
                <small id="taxaMensal-ajuda">
                  Use ponto ou vírgula para representar casas decimais.
                </small>
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
                <small id="meses-ajuda">
                  Informe somente números inteiros positivos.
                </small>
              </div>
            </div>
          </fieldset>

          <button type="submit">Calcular</button>
        </form>

        <section class="status" aria-labelledby="resultado-titulo">
          <h2 id="resultado-titulo">Resultado da simulação</h2>
          <p id="status-descricao">${escapeHtml(statusDescription)}</p>
          ${resultSection}
          ${errorSection}
        </section>
      </section>
    </main>

    <script>
      const form = document.querySelector("form");
      const resultado = document.getElementById("resultado");
      const erro = document.getElementById("erro");
      const statusDescricao = document.getElementById("status-descricao");

      function limparErro() {
        erro.innerHTML = "";
        erro.hidden = true;
      }

      function exibirErro(mensagem) {
        resultado.innerHTML = "";
        erro.innerHTML = "<p>" + mensagem + "</p>";
        erro.hidden = false;
        statusDescricao.textContent = "Não foi possível concluir a simulação.";
      }

      function obterMensagemErro(payload) {
        if (!payload || typeof payload !== "object") {
          return null;
        }

        if (typeof payload.message === "string" && payload.message.trim() !== "") {
          return payload.message.trim();
        }

        if (typeof payload.erro === "string" && payload.erro.trim() !== "") {
          return payload.erro.trim();
        }

        return null;
      }

      async function calcularViaApi(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const params = new URLSearchParams();

        for (const [chave, valor] of formData.entries()) {
          params.set(chave, String(valor));
        }

        try {
          const response = await fetch("/api/calcular", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              principal: formData.get("principal"),
              taxaMensal: formData.get("taxaMensal"),
              meses: formData.get("meses"),
            }),
          });

          const responseText = await response.text();
          let payload = null;

          if (responseText.trim() !== "") {
            try {
              payload = JSON.parse(responseText);
            } catch {
              payload = null;
            }
          }

          if (!response.ok) {
            const mensagemApi = obterMensagemErro(payload);
            exibirErro(
              mensagemApi ??
                "Ocorreu um erro ao calcular. Tente novamente em instantes.",
            );
            return;
          }

          const redirectUrl = "/?" + params.toString();
          const pageResponse = await fetch(redirectUrl, {
            headers: {
              "x-requested-with": "fetch",
            },
          });

          if (!pageResponse.ok) {
            exibirErro(
              "Ocorreu um erro ao atualizar o resultado. Tente novamente em instantes.",
            );
            return;
          }

          const html = await pageResponse.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          const novoResultado = doc.getElementById("resultado");
          const novaDescricao = doc.getElementById("status-descricao");

          if (novoResultado && novaDescricao) {
            resultado.innerHTML = novoResultado.innerHTML;
            statusDescricao.textContent = novaDescricao.textContent ?? "";
            limparErro();
            history.replaceState(null, "", redirectUrl);
            return;
          }

          exibirErro(
            "Ocorreu um erro ao atualizar o resultado. Tente novamente em instantes.",
          );
        } catch {
          exibirErro(
            "Não foi possível calcular no momento por falha de rede. Tente novamente mais tarde.",
          );
        }
      }

      if (form && resultado && erro && statusDescricao) {
        form.addEventListener("submit", calcularViaApi);
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

async function handleCalculationApi(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const principal = parseDecimal(String(body.principal ?? ""));
    const monthlyRate = parseDecimal(String(body.taxaMensal ?? ""));
    const months = parseInteger(String(body.meses ?? ""));

    if (principal === null || principal <= 0) {
      return jsonResponse(
        JSON.stringify({
          message: "Informe um valor principal maior que zero.",
        }),
        400,
      );
    }

    if (monthlyRate === null || monthlyRate < 0) {
      return jsonResponse(
        JSON.stringify({
          message: "Informe uma taxa mensal válida, igual ou maior que zero.",
        }),
        400,
      );
    }

    if (months === null || months <= 0) {
      return jsonResponse(
        JSON.stringify({
          message:
            "Informe a quantidade de meses com número inteiro maior que zero.",
        }),
        400,
      );
    }

    const total = calculateCompoundAmount(principal, monthlyRate, months);

    return jsonResponse(
      JSON.stringify({
        total,
        totalFormatado: formatCurrency(total),
      }),
    );
  } catch {
    return jsonResponse(
      JSON.stringify({
        message: "Não foi possível processar a solicitação no momento.",
      }),
      500,
    );
  }
}

export async function handler(request: Request): Promise<Response> {
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
    const visits = counter.increment();
    return jsonResponse(
      JSON.stringify({
        visits,
        message: formatCounterMessage(visits),
      }),
    );
  }

  if (url.pathname === "/api/calcular" && request.method === "POST") {
    return await handleCalculationApi(request);
  }

  if (url.pathname === "/") {
    return new Response(renderHomePage(url), {
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
