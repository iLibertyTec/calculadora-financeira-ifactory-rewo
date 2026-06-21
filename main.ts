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
    ? '<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" tabindex="-1" hidden></div>'
    : `<div id="erro" aria-live="assertive" aria-atomic="true" role="alert" tabindex="-1">${errorHtml}</div>`;

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

      .help {
        margin: 0;
        font-size: 0.92rem;
        color: var(--muted);
      }

      input {
        width: 100%;
        padding: 14px 16px;
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

      button {
        border: none;
        border-radius: 12px;
        padding: 14px 20px;
        font: inherit;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        cursor: pointer;
      }

      output, [role="alert"] {
        display: block;
        word-break: break-word;
        border-radius: 14px;
        padding: 16px 18px;
      }

      #resultado {
        background: var(--success-bg);
        border: 1px solid var(--success-border);
        color: var(--success-ink);
      }

      #resultado strong {
        font-size: 1.1rem;
      }

      #erro {
        background: var(--danger-bg);
        border: 1px solid var(--danger-border);
        color: var(--danger);
      }

      #erro p:last-child {
        margin-bottom: 0;
      }

      .actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .footer {
        margin-top: 20px;
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
        <div class="eyebrow">iFactory • Simulador</div>
        <h1 id="titulo-principal">Calculadora de juros compostos</h1>
        <p>
          Informe os dados da simulação para calcular o montante final estimado com base em juros compostos.
        </p>
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
                <p class="help" id="principal-ajuda">
                  Informe o valor inicial usando vírgula ou ponto para separar os decimais.
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
                  Informe a taxa mensal em percentual, usando vírgula ou ponto quando houver casas decimais.
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
                  Informe a quantidade de meses com número inteiro maior que zero.
                </p>
              </div>
            </div>
          </fieldset>
          <div class="actions">
            <button type="submit">Calcular</button>
          </div>
          <section aria-label="Resultado da simulação">
            ${resultSection}
            ${errorSection}
          </section>
        </form>
        <p class="footer">${escapeHtml(formatCounterMessage(counter.incrementAndGet()))}</p>
      </section>
    </main>
    <script>
      const formulario = document.querySelector("form");
      const resultado = document.getElementById("resultado");
      const erro = document.getElementById("erro");
      const statusDescricao = document.getElementById("status-descricao");

      function limparErro() {
        erro.textContent = "";
        erro.hidden = true;
      }

      function atualizarStatus(mensagem) {
        statusDescricao.textContent = mensagem;
      }

      function exibirErro(mensagem) {
        erro.textContent = "";
        const paragrafo = document.createElement("p");
        paragrafo.textContent = mensagem;
        erro.appendChild(paragrafo);
        erro.hidden = false;
        atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
        erro.focus();
      }

      function obterMensagemErro(payload) {
        if (!payload || typeof payload !== "object") {
          return "Ocorreu um erro ao calcular. Tente novamente em instantes.";
        }

        if (typeof payload.message === "string" && payload.message.trim() !== "") {
          return payload.message;
        }

        if (typeof payload.erro === "string" && payload.erro.trim() !== "") {
          return payload.erro;
        }

        return "Ocorreu um erro ao calcular. Tente novamente em instantes.";
      }

      async function lerPayloadJson(resposta) {
        const texto = await resposta.text();

        if (texto.trim() === "") {
          return null;
        }

        try {
          return JSON.parse(texto);
        } catch {
          return null;
        }
      }

      if (formulario && resultado && erro && statusDescricao) {
        formulario.addEventListener("submit", async (event) => {
          event.preventDefault();

          const formData = new FormData(formulario);
          const payload = {
            principal: formData.get("principal"),
            taxaMensal: formData.get("taxaMensal"),
            meses: formData.get("meses"),
          };

          try {
            const resposta = await fetch("/api/calcular", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            const dados = await lerPayloadJson(resposta);

            if (!resposta.ok) {
              resultado.innerHTML = "";
              exibirErro(obterMensagemErro(dados));
              return;
            }

            limparErro();
            atualizarStatus("Simulação calculada com sucesso. Confira o resultado abaixo.");
            const totalFormatado =
              dados && typeof dados.totalFormatado === "string"
                ? dados.totalFormatado
                : "";
            resultado.innerHTML = totalFormatado === ""
              ? "Montante final estimado calculado com sucesso."
              : `Montante final estimado: <strong>${totalFormatado}</strong>.`;
          } catch {
            resultado.innerHTML = "";
            exibirErro(
              "Não foi possível calcular no momento por falha de rede. Tente novamente mais tarde.",
            );
          }
        });
      }
    </script>
  </body>
</html>`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

async function handleApiCalcular(request: Request): Promise<Response> {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ message: "Não foi possível interpretar os dados enviados." }, 400);
  }

  const principal = parseDecimal(String(payload.principal ?? ""));
  const monthlyRate = parseDecimal(String(payload.taxaMensal ?? ""));
  const months = parseInteger(String(payload.meses ?? ""));

  if (principal === null || principal <= 0) {
    return jsonResponse({ message: "Informe um valor principal maior que zero." }, 400);
  }

  if (monthlyRate === null || monthlyRate < 0) {
    return jsonResponse(
      { message: "Informe uma taxa mensal válida, igual ou maior que zero." },
      400,
    );
  }

  if (months === null || months <= 0) {
    return jsonResponse(
      {
        message:
          "Informe a quantidade de meses com número inteiro maior que zero.",
      },
      400,
    );
  }

  const total = calculateCompoundAmount(principal, monthlyRate, months);

  return jsonResponse({
    total,
    totalFormatado: formatCurrency(total),
  });
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/calcular") {
    return await handleApiCalcular(request);
  }

  if (request.method === "GET" && url.pathname === "/") {
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
