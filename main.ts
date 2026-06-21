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

  const visitMessage = escapeHtml(formatCounterMessage(counter.value()));

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
        font-size: clamp(2rem, 4vw, 2.75rem);
        line-height: 1.1;
      }

      p.lead {
        margin: 0 0 24px;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.6;
      }

      form {
        display: grid;
        gap: 20px;
      }

      fieldset {
        margin: 0;
        padding: 0;
        border: 0;
      }

      legend {
        margin-bottom: 12px;
        font-weight: 700;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
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
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        font: inherit;
        color: inherit;
        background: #fff;
      }

      input:focus-visible,
      button:focus-visible {
        outline: 3px solid rgba(29, 78, 216, 0.25);
        outline-offset: 2px;
      }

      small {
        color: var(--muted);
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 14px 20px;
        font: inherit;
        font-weight: 700;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease,
          background 0.15s ease;
      }

      button:hover {
        background: var(--accent-strong);
      }

      button:disabled {
        opacity: 0.7;
        cursor: wait;
      }

      .actions {
        display: flex;
        justify-content: flex-start;
      }

      .status {
        margin: 0;
        color: var(--muted);
      }

      output,
      [role="alert"] {
        display: block;
        margin-top: 20px;
        padding: 16px 18px;
        border-radius: 14px;
        border: 1px solid transparent;
        word-break: break-word;
      }

      #resultado {
        color: var(--success-ink);
        background: var(--success-bg);
        border-color: var(--success-border);
      }

      #resultado strong {
        font-size: 1.05em;
      }

      #erro {
        color: var(--danger);
        background: var(--danger-bg);
        border-color: var(--danger-border);
      }

      #erro:focus {
        outline: 3px solid rgba(153, 27, 27, 0.2);
        outline-offset: 2px;
      }

      #erro p {
        margin: 0;
      }

      #erro p + p {
        margin-top: 8px;
      }

      .footer {
        margin-top: 24px;
        color: var(--muted);
        font-size: 0.95rem;
      }

      @media (max-width: 900px) {
        .card {
          padding: 28px;
        }
      }

      @media (max-width: 720px) {
        main {
          padding: 16px;
        }

        .card {
          padding: 22px;
          border-radius: 18px;
        }
      }

      @media (max-width: 400px) {
        .actions,
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
        <h1 id="titulo-principal">Calculadora financeira</h1>
        <p class="lead">
          Simule juros compostos de forma simples para estimar o montante final do seu investimento.
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
                <small id="principal-ajuda">Informe o valor inicial da aplicação.</small>
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
                <small id="taxaMensal-ajuda">Use valores positivos ou zero.</small>
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
                <small id="meses-ajuda">Informe um número inteiro maior que zero.</small>
              </div>
            </div>
          </fieldset>
          <p id="status-descricao" class="status" aria-live="polite" aria-atomic="true">${escapeHtml(statusDescription)}</p>
          <div class="actions">
            <button type="submit">Calcular</button>
          </div>
        </form>
        <section aria-label="Resultado da simulação">
          ${resultSection}
          ${errorSection}
        </section>
        <p class="footer">${visitMessage}</p>
      </section>
    </main>
    <script>
      const formulario = document.querySelector("form");
      const resultado = document.getElementById("resultado");
      const erro = document.getElementById("erro");
      const statusDescricao = document.getElementById("status-descricao");
      const botaoSubmit = formulario?.querySelector('button[type="submit"]');
      const textoOriginalBotao = botaoSubmit?.textContent ?? "Calcular";

      function atualizarStatus(mensagem) {
        if (statusDescricao) {
          statusDescricao.textContent = mensagem;
        }
      }

      function limparErro() {
        if (!erro) {
          return;
        }

        erro.replaceChildren();
        erro.hidden = true;
      }

      function exibirErro(mensagem) {
        if (!erro) {
          atualizarStatus(mensagem);
          console.error("Falha ao exibir erro na interface:", mensagem);
          return;
        }

        erro.replaceChildren();
        const paragrafo = document.createElement("p");
        paragrafo.textContent = mensagem;
        erro.appendChild(paragrafo);
        erro.hidden = false;
        erro.scrollIntoView({ behavior: "smooth", block: "nearest" });
        requestAnimationFrame(() => {
          erro.focus();
        });
      }

      function exibirErros(mensagens) {
        if (!Array.isArray(mensagens) || mensagens.length === 0) {
          exibirErro("Ocorreu um erro ao calcular. Tente novamente em instantes.");
          return;
        }

        if (!erro) {
          atualizarStatus(mensagens.join(" "));
          console.error("Falha ao exibir erros na interface:", mensagens);
          return;
        }

        erro.replaceChildren();
        for (const mensagem of mensagens) {
          const paragrafo = document.createElement("p");
          paragrafo.textContent = String(mensagem);
          erro.appendChild(paragrafo);
        }
        erro.hidden = false;
        erro.scrollIntoView({ behavior: "smooth", block: "nearest" });
        requestAnimationFrame(() => {
          erro.focus();
        });
      }

      function obterMensagemErro(payload, fallbackStatus) {
        if (!payload || typeof payload !== "object") {
          return null;
        }

        if (Array.isArray(payload.errors)) {
          const mensagens = payload.errors.filter((item) => typeof item === "string" && item.trim() !== "");
          if (mensagens.length > 0) {
            return mensagens;
          }
        }

        if (typeof payload.error === "string" && payload.error.trim() !== "") {
          return [payload.error.trim()];
        }

        if (typeof payload.message === "string" && payload.message.trim() !== "") {
          return [payload.message.trim()];
        }

        return fallbackStatus ? [fallbackStatus] : null;
      }

      function obterMensagemErroHttp(status, payload, texto) {
        const mensagemPayload = obterMensagemErro(payload, null);
        if (mensagemPayload && mensagemPayload.length > 0) {
          return mensagemPayload;
        }

        if (status >= 500) {
          return ["Não foi possível calcular no momento porque o serviço está indisponível. Tente novamente mais tarde."];
        }

        if (status >= 400) {
          return ["Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida."];
        }

        return ["Ocorreu um erro ao calcular. Tente novamente em instantes."];
      }

      async function lerPayloadJson(resposta) {
        const contentType = resposta.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          return null;
        }

        try {
          return await resposta.json();
        } catch {
          return null;
        }
      }

      formulario?.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        limparErro();
        if (resultado) {
          resultado.textContent = "";
        }
        atualizarStatus("Calculando simulação. Aguarde.");
        if (botaoSubmit) {
          botaoSubmit.disabled = true;
          botaoSubmit.textContent = "Calculando...";
          botaoSubmit.setAttribute("aria-busy", "true");
        }

        const formData = new FormData(formulario);
        const principal = String(formData.get("principal") ?? "");
        const taxaMensal = String(formData.get("taxaMensal") ?? "");
        const meses = String(formData.get("meses") ?? "");

        try {
          const resposta = await fetch("/api/calcular", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ principal, taxaMensal, meses }),
          });

          const payload = await lerPayloadJson(resposta);
          const texto = payload === null ? await resposta.text() : "";

          if (!resposta.ok) {
            const mensagens = obterMensagemErroHttp(resposta.status, payload, texto);
            exibirErros(mensagens);
            atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
            return;
          }

          const montante = payload && typeof payload.montanteFormatado === "string"
            ? payload.montanteFormatado
            : null;

          if (!montante) {
            exibirErro("Ocorreu um erro ao calcular. Tente novamente em instantes.");
            atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
            return;
          }

          limparErro();
          if (resultado) {
            resultado.innerHTML = `Montante final estimado: <strong>${montante}</strong>.`;
          }
          atualizarStatus("Simulação calculada com sucesso. Confira o resultado abaixo.");
        } catch (error) {
          const mensagem = error instanceof DOMException && error.name === "AbortError"
            ? "Não foi possível calcular no momento porque a solicitação expirou ou foi interrompida. Tente novamente."
            : "Não foi possível calcular no momento por falha de rede. Tente novamente mais tarde.";
          exibirErro(mensagem);
          atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
        } finally {
          if (botaoSubmit) {
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = textoOriginalBotao;
            botaoSubmit.removeAttribute("aria-busy");
            botaoSubmit?.focus();
          }
        }
      });
    </script>
  </body>
</html>`;
}

async function handleCalculate(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return createJsonResponse(
      JSON.stringify({
        error: "Não foi possível interpretar os dados enviados para o cálculo.",
      }),
      400,
    );
  }

  const body = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : {};

  const principalValue = String(body.principal ?? "");
  const monthlyRateValue = String(body.taxaMensal ?? "");
  const monthsValue = String(body.meses ?? "");

  const validation = validateSimulationInput(
    principalValue,
    monthlyRateValue,
    monthsValue,
  );

  if (validation.errors.length > 0) {
    return createJsonResponse(
      JSON.stringify({
        error: validation.errors[0],
        errors: validation.errors,
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
      montante: total,
      montanteFormatado: formatCurrency(total),
    }),
    200,
  );
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/") {
    counter.increment();
    return new Response(renderHomePage(url), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return createJsonResponse(JSON.stringify({ ok: true }), 200);
  }

  if (request.method === "GET" && url.pathname === "/api/visits") {
    return createJsonResponse(
      JSON.stringify({
        visits: counter.value(),
        message: formatCounterMessage(counter.value()),
      }),
      200,
    );
  }

  if (request.method === "POST" && url.pathname === "/api/calcular") {
    return await handleCalculate(request);
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.main) {
  Deno.serve(handler);
}
