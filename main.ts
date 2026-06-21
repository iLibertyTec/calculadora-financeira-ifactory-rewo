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

function createJsonResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
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
        background: var(--accent);
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      button:hover {
        background: var(--accent-strong);
      }

      button:focus-visible {
        outline: 3px solid rgba(29, 78, 216, 0.28);
        outline-offset: 2px;
      }

      output,
      [role="alert"] {
        display: block;
        word-break: break-word;
      }

      #resultado {
        padding: 18px 20px;
        border-radius: 16px;
        background: var(--success-bg);
        border: 1px solid var(--success-border);
        color: var(--success-ink);
      }

      #resultado strong {
        font-size: 1.05rem;
      }

      #erro {
        padding: 18px 20px;
        border-radius: 16px;
        background: var(--danger-bg);
        border: 1px solid var(--danger-border);
        color: var(--danger);
      }

      #erro p:last-child {
        margin-bottom: 0;
      }

      .status {
        margin-bottom: 0;
      }

      .counter {
        margin-top: 18px;
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
        <div class="eyebrow">iFactory • Simulador financeiro</div>
        <h1 id="titulo-principal">Calculadora de juros compostos</h1>
        <p>
          Informe os dados da simulação para calcular o montante final estimado
          com base em juros compostos mensais.
        </p>
        <p id="status-descricao" class="status">${escapeHtml(statusDescription)}</p>
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
                <p id="principal-ajuda" class="help">
                  Digite o valor inicial do investimento ou empréstimo.
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
                <p id="taxaMensal-ajuda" class="help">
                  Informe a taxa de juros mensal em percentual.
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
                <p id="meses-ajuda" class="help">
                  Use um número inteiro maior que zero para o período.
                </p>
              </div>
            </div>
          </fieldset>
          <button type="submit">Calcular</button>
        </form>
        ${resultSection}
        ${errorSection}
        <p class="counter">${escapeHtml(formatCounterMessage(counter.incrementAndGet()))}</p>
      </section>
    </main>
    <script>
      const form = document.querySelector("form");
      const resultado = document.getElementById("resultado");
      const erro = document.getElementById("erro");
      const statusDescricao = document.getElementById("status-descricao");
      const botaoSubmit = form?.querySelector('button[type="submit"]');

      function limparErro() {
        erro.replaceChildren();
        erro.hidden = true;
      }

      function atualizarStatus(mensagem) {
        statusDescricao.textContent = mensagem;
      }

      function exibirErro(mensagem) {
        erro.hidden = false;
        erro.replaceChildren();
        const paragrafo = document.createElement("p");
        paragrafo.textContent = mensagem;
        erro.appendChild(paragrafo);
        erro.scrollIntoView({ behavior: "smooth", block: "nearest" });
        erro.focus();
      }

      function obterMensagemErro(payload, fallbackStatus) {
        const mensagemPadrao =
          fallbackStatus >= 500
            ? "Não foi possível calcular no momento porque o serviço está indisponível. Tente novamente mais tarde."
            : "Ocorreu um erro ao calcular. Tente novamente em instantes.";

        if (payload === null || typeof payload !== "object") {
          return mensagemPadrao;
        }

        if (typeof payload.message !== "string") {
          return mensagemPadrao;
        }

        const mensagem = payload.message.trim();
        if (mensagem === "") {
          return mensagemPadrao;
        }

        if (/informe /i.test(mensagem) || /não foi possível/i.test(mensagem)) {
          return mensagem;
        }

        return mensagemPadrao;
      }

      async function lerPayloadJson(resposta) {
        const texto = await resposta.text();

        if (texto.trim() === "") {
          return { json: null, text: "" };
        }

        try {
          return { json: JSON.parse(texto), text: texto.trim() };
        } catch {
          return { json: null, text: texto.trim() };
        }
      }

      function obterMensagemErroHttp(status, payload, texto) {
        const mensagemPayload = obterMensagemErro(payload, status);
        if (mensagemPayload !== "Ocorreu um erro ao calcular. Tente novamente em instantes." &&
          mensagemPayload !== "Não foi possível calcular no momento porque o serviço está indisponível. Tente novamente mais tarde.") {
          return mensagemPayload;
        }

        if (texto !== "" && !/^<!DOCTYPE html>/i.test(texto) && !/^<html/i.test(texto)) {
          return `Não foi possível concluir o cálculo (${status}). ${texto}`;
        }

        if (status >= 500) {
          return "Não foi possível calcular no momento porque o serviço está indisponível. Tente novamente mais tarde.";
        }

        return "Ocorreu um erro ao calcular. Tente novamente em instantes.";
      }

      form?.addEventListener("submit", async function(evento) {
        evento.preventDefault();

        const dados = new FormData(form);
        const payload = {
          principal: String(dados.get("principal") ?? ""),
          taxaMensal: String(dados.get("taxaMensal") ?? ""),
          meses: String(dados.get("meses") ?? ""),
        };

        try {
          const resposta = await fetch("/api/calcular", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const { json, text } = await lerPayloadJson(resposta);

          if (!resposta.ok) {
            resultado.textContent = "";
            exibirErro(obterMensagemErroHttp(resposta.status, json, text));
            atualizarStatus(
              "Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.",
            );
            return;
          }

          limparErro();
          resultado.innerHTML =
            `Montante final estimado: <strong>${json.resultadoFormatado}</strong>.`;
          atualizarStatus(
            "Simulação calculada com sucesso. Confira o resultado abaixo.",
          );
          botaoSubmit?.focus();
        } catch {
          resultado.textContent = "";
          exibirErro(
            "Não foi possível calcular no momento por falha de rede. Tente novamente mais tarde.",
          );
          atualizarStatus(
            "Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.",
          );
        }
      });
    </script>
  </body>
</html>`;
}

async function handleApiCalcular(request: Request): Promise<Response> {
  let payload: {
    principal?: string;
    taxaMensal?: string;
    meses?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return createJsonResponse(
      JSON.stringify({
        message: "Não foi possível interpretar os dados enviados para cálculo.",
      }),
      400,
    );
  }

  const principalValue = payload.principal ?? "";
  const monthlyRateValue = payload.taxaMensal ?? "";
  const monthsValue = payload.meses ?? "";

  const validation = validateSimulationInput(
    principalValue,
    monthlyRateValue,
    monthsValue,
  );

  if (validation.errors.length > 0) {
    return createJsonResponse(
      JSON.stringify({
        message: validation.errors[0],
      }),
      400,
    );
  }

  const total = calculateCompoundAmount(
    validation.principal as number,
    validation.monthlyRate as number,
    validation.months as number,
  );

  return createJsonResponse(
    JSON.stringify({
      resultado: total,
      resultadoFormatado: formatCurrency(total),
    }),
    200,
  );
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/calcular") {
    return await handleApiCalcular(request);
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
