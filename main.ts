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
      const total = calcularJurosCompostos(
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

  const errorHiddenAttribute = errorHtml === "" ? " hidden" : "";

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
    </style>
  </head>
  <body>
    <main>
      <section class="card" aria-labelledby="titulo">
        <h1 id="titulo">Calculadora Financeira iFactory</h1>
        <p>Simule juros compostos informando o valor principal, a taxa mensal e o período em meses.</p>
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
              <p id="principal-ajuda" class="hint">Use vírgula ou ponto para representar centavos.</p>
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
              <p id="taxaMensal-ajuda" class="hint">Informe a taxa percentual aplicada a cada mês.</p>
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
              <p id="meses-ajuda" class="hint">Digite a quantidade de meses como número inteiro.</p>
            </div>
          </fieldset>

          <button id="calcular" type="submit">Calcular</button>
        </form>

        <section class="status" aria-labelledby="resultado-titulo">
          <h2 id="resultado-titulo">Resultado da simulação</h2>
          <p id="status-descricao">${escapeHtml(statusDescription)}</p>
          <output id="resultado" aria-live="polite" aria-atomic="true">${resultHtml}</output>
          <div id="erro" aria-live="assertive" aria-atomic="true" role="alert"${errorHiddenAttribute}>${errorHtml}</div>
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

      if (
        form &&
        principalInput &&
        taxaMensalInput &&
        mesesInput &&
        resultado &&
        erro &&
        statusDescricao &&
        botao
      ) {
        form.addEventListener("submit", async (event) => {
          event.preventDefault();

          resultado.innerHTML = "";
          erro.innerHTML = "";
          erro.hidden = true;
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

            let data;

            try {
              data = await response.json();
            } catch (_error) {
              throw new Error("Não foi possível interpretar a resposta do servidor.");
            }

            if (!response.ok) {
              const messages = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors
                : [data?.error || "Não foi possível calcular a simulação."];

              erro.hidden = false;
              messages.forEach((message) => {
                const paragraph = document.createElement("p");
                paragraph.textContent = message;
                erro.appendChild(paragraph);
              });
              statusDescricao.textContent =
                "Há erros no preenchimento. Revise os campos informados.";
              return;
            }

            resultado.innerHTML =
              'Montante final estimado: <strong>' +
              data.montanteFormatado +
              '</strong>.';
            statusDescricao.textContent =
              "Simulação calculada com sucesso. Confira o resultado abaixo.";
          } catch (error) {
            erro.hidden = false;
            const paragraph = document.createElement("p");
            const message = error instanceof Error
              ? error.message
              : "Não foi possível calcular a simulação.";
            paragraph.textContent = message;
            erro.appendChild(paragraph);
            statusDescricao.textContent =
              "Não foi possível calcular a simulação no momento.";
          } finally {
            botao.disabled = false;
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

async function handleCompoundInterestApi(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    const errorMessage = "Envie o corpo da requisição em JSON.";
    return jsonResponse({ error: errorMessage, errors: [errorMessage] }, 400);
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    const errorMessage = "JSON inválido no corpo da requisição.";
    return jsonResponse({ error: errorMessage, errors: [errorMessage] }, 400);
  }

  const principalValue = typeof payload.principal === "string"
    ? payload.principal
    : null;
  const monthlyRateValue = typeof payload.taxaMensal === "string"
    ? payload.taxaMensal
    : null;
  const monthsValue = typeof payload.meses === "string" ? payload.meses : null;

  const validation = validateSimulationInput(
    principalValue ?? "",
    monthlyRateValue ?? "",
    monthsValue ?? "",
  );

  if (validation.errors.length > 0) {
    return jsonResponse(
      {
        error: validation.errors[0],
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

  return jsonResponse({
    principal: validation.principal,
    taxaMensal: validation.monthlyRate,
    meses: validation.months,
    montante,
    montanteFormatado: formatCurrency(montante),
  });
}

function handleVisits(request: Request): Response {
  if (request.method === "POST") {
    const count = counter.increment();
    return jsonResponse({
      count,
      message: formatCounterMessage(count),
    });
  }

  if (request.method === "GET") {
    return jsonResponse({
      count: counter.current(),
      message: formatCounterMessage(counter.current()),
    });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      allow: "GET, POST",
    },
  });
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/juros-compostos") {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          allow: "POST",
        },
      });
    }

    return await handleCompoundInterestApi(request);
  }

  if (url.pathname === "/api/visits") {
    return handleVisits(request);
  }

  if (url.pathname === "/" && request.method === "GET") {
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
