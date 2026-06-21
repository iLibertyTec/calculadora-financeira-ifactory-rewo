import { formatCounterMessage, VisitCounter } from "./counter.ts";
import { calcularJurosCompostos } from "./src/juros_compostos.ts";

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

function validateSimulationInput(
  principalValue: string,
  monthlyRateValue: string,
  monthsValue: string,
): {
  errors: string[];
  principal: number | null;
  monthlyRate: number | null;
  months: number | null;
} {
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

  return { errors, principal, monthlyRate, months };
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
    const validation = validateSimulationInput(
      principalValue,
      monthlyRateValue,
      monthsValue,
    );

    if (validation.errors.length > 0) {
      statusDescription =
        "Há erros no preenchimento. Revise os campos informados.";
      errorHtml = validation.errors.map((error: string) =>
        `<p>${escapeHtml(error)}</p>`
      ).join("");
    } else {
      const total = calculateCompoundAmount(
        validation.principal as number,
        validation.monthlyRate as number,
        validation.months as number,
      );
      statusDescription =
        "Simulação calculada com sucesso. Confira o resultado abaixo.";
      resultHtml =
        `Montante final estimado: <strong>${escapeHtml(formatCurrency(total))}</strong>.`;
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

      button:disabled {
        opacity: 0.7;
        cursor: wait;
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

        <form id="calculadora-form" method="get" action="/" aria-describedby="status-descricao">
          <fieldset>
            <legend>Dados da simulação</legend>

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
              <p id="principal-ajuda" class="hint">
                Informe o valor inicial da aplicação.
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
                required
                aria-describedby="taxaMensal-ajuda"
              />
              <p id="taxaMensal-ajuda" class="hint">
                Use porcentagem mensal, aceitando vírgula ou ponto.
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
                required
                aria-describedby="meses-ajuda"
              />
              <p id="meses-ajuda" class="hint">
                Informe um número inteiro de meses para a simulação.
              </p>
            </div>
          </fieldset>

          <button id="calcular" type="submit">Calcular</button>
        </form>

        <section class="status" aria-labelledby="resultado-titulo">
          <h2 id="resultado-titulo">Resultado da simulação</h2>
          <p id="status-descricao">${escapeHtml(statusDescription)}</p>
          <output id="resultado" aria-live="polite" aria-atomic="true">${resultHtml}</output>
          <div id="erro" aria-live="assertive" aria-atomic="true" role="alert"${errorHtml === "" ? " hidden" : ""}>${errorHtml}</div>
        </section>
      </section>
    </main>
    <script>
      const form = document.getElementById("calculadora-form");
      const principalInput = document.getElementById("principal");
      const taxaMensalInput = document.getElementById("taxaMensal");
      const mesesInput = document.getElementById("meses");
      const resultado = document.getElementById("resultado");
      const erro = document.getElementById("erro");
      const statusDescricao = document.getElementById("status-descricao");
      const botao = document.getElementById("calcular");

      function limparMensagens() {
        resultado.textContent = "";
        erro.replaceChildren();
        erro.hidden = true;
      }

      function exibirErros(messages) {
        erro.replaceChildren();
        for (const message of messages) {
          const paragraph = document.createElement("p");
          paragraph.textContent = message;
          erro.appendChild(paragraph);
        }
        erro.hidden = messages.length === 0;
      }

      if (form instanceof HTMLFormElement &&
        principalInput instanceof HTMLInputElement &&
        taxaMensalInput instanceof HTMLInputElement &&
        mesesInput instanceof HTMLInputElement &&
        resultado instanceof HTMLOutputElement &&
        erro instanceof HTMLDivElement &&
        statusDescricao instanceof HTMLParagraphElement &&
        botao instanceof HTMLButtonElement) {
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          limparMensagens();
          statusDescricao.textContent = "Calculando simulação...";
          botao.disabled = true;

          try {
            const response = await fetch("/api/juros-compostos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                principal: principalInput.value,
                taxaMensal: taxaMensalInput.value,
                meses: mesesInput.value,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              const messages = Array.isArray(data.errors) && data.errors.length > 0
                ? data.errors
                : [data.error || "Não foi possível calcular a simulação."];
              exibirErros(messages);
              statusDescricao.textContent =
                "Não foi possível concluir a simulação sem recarregar. Revise os dados ou tente novamente.";
              return;
            }

            statusDescricao.textContent =
              "Simulação calculada com sucesso. Confira o resultado abaixo.";
            resultado.textContent =
              "Montante final estimado: " + data.montanteFormatado + ".";
          } catch (_error) {
            statusDescricao.textContent =
              "Falha ao calcular sem recarregar. Enviando pelo modo tradicional...";
            form.submit();
          } finally {
            botao.disabled = false;
          }
        });
      }
    </script>
  </body>
</html>`;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

async function handleCompoundInterestApi(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      {
        error: "Envie o corpo da requisição em JSON.",
        errors: ["Envie o corpo da requisição em JSON."],
      },
      400,
    );
  }

  let payload: Record<string, unknown>;

  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return jsonResponse(
        {
          error: "Envie um objeto JSON válido.",
          errors: ["Envie um objeto JSON válido."],
        },
        400,
      );
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse(
      {
        error: "JSON inválido no corpo da requisição.",
        errors: ["JSON inválido no corpo da requisição."],
      },
      400,
    );
  }

  const principalValue = String(payload.principal ?? "");
  const monthlyRateValue = String(payload.taxaMensal ?? "");
  const monthsValue = String(payload.meses ?? "");

  const validation = validateSimulationInput(
    principalValue,
    monthlyRateValue,
    monthsValue,
  );

  if (validation.errors.length > 0) {
    return jsonResponse(
      {
        error: "Dados inválidos para calcular juros compostos.",
        errors: validation.errors,
      },
      400,
    );
  }

  const montante = calcularJurosCompostos(
    validation.principal as number,
    validation.monthlyRate as number,
    validation.months as number,
  );

  return jsonResponse(
    {
      montante,
      montanteFormatado: formatCurrency(montante),
    },
    200,
  );
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/visits") {
    const visits = counter.increment();
    return jsonResponse({ message: formatCounterMessage(visits), visits }, 200);
  }

  if (request.method === "POST" && url.pathname === "/api/juros-compostos") {
    return await handleCompoundInterestApi(request);
  }

  if (request.method === "GET" && url.pathname === "/") {
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
