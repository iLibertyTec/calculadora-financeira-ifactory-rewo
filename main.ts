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

function createApiErrorResponse(status: number, message: string): Response {
  return createJsonResponse(JSON.stringify({ error: message }), status);
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
        margin: 0 0 12px;
        font-size: clamp(2rem, 4vw, 2.8rem);
        line-height: 1.1;
      }

      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .intro {
        margin-bottom: 28px;
      }

      form {
        display: grid;
        gap: 24px;
      }

      fieldset {
        margin: 0;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fcfdff;
      }

      legend {
        padding: 0 8px;
        font-weight: 700;
      }

      .grid {
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
        font: inherit;
        color: var(--ink);
        background: #fff;
      }

      input:focus-visible,
      button:focus-visible {
        outline: 3px solid rgba(29, 78, 216, 0.24);
        outline-offset: 2px;
      }

      .hint {
        font-size: 0.95rem;
        color: var(--muted);
      }

      .actions {
        display: flex;
        justify-content: flex-start;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 14px 22px;
        font: inherit;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        box-shadow: 0 14px 30px rgba(29, 78, 216, 0.24);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 18px 34px rgba(29, 78, 216, 0.28);
      }

      button:disabled {
        cursor: wait;
        opacity: 0.8;
        transform: none;
      }

      .feedback {
        margin-top: 28px;
        display: grid;
        gap: 12px;
      }

      .feedback h2 {
        margin: 0;
        font-size: 1.1rem;
      }

      output,
      [role="alert"] {
        display: block;
        padding: 16px 18px;
        border-radius: 14px;
        border: 1px solid transparent;
        word-break: break-word;
      }

      #resultado {
        background: var(--success-bg);
        color: var(--success-ink);
        border-color: var(--success-border);
      }

      #resultado strong {
        font-size: 1.1em;
      }

      #erro {
        background: var(--danger-bg);
        color: var(--danger);
        border-color: var(--danger-border);
      }

      #erro p + p {
        margin-top: 8px;
      }

      .status {
        font-size: 0.95rem;
        color: var(--muted);
      }

      .footer {
        margin-top: 24px;
        font-size: 0.9rem;
        color: var(--muted);
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

        .card,
        fieldset {
          padding: 20px;
        }
      }

      @media (max-width: 400px) {
        .card {
          padding: 18px;
          border-radius: 16px;
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
        <p class="eyebrow">iFactory • Simulador</p>
        <h1 id="titulo-principal">Calculadora de juros compostos</h1>
        <p class="intro">
          Informe os dados abaixo para simular o montante final de um investimento com capitalização mensal.
        </p>

        <form method="get" action="/" aria-describedby="status-descricao" id="form-simulacao">
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
                  required
                  aria-describedby="principal-ajuda"
                  value="${escapeHtml(principalValue)}"
                />
                <span class="hint" id="principal-ajuda">Digite o valor inicial do investimento em reais.</span>
              </div>

              <div class="field">
                <label for="taxaMensal">Taxa mensal (%) *</label>
                <input
                  id="taxaMensal"
                  name="taxaMensal"
                  type="text"
                  inputmode="decimal"
                  placeholder="Ex.: 1,50"
                  required
                  aria-describedby="taxaMensal-ajuda"
                  value="${escapeHtml(monthlyRateValue)}"
                />
                <span class="hint" id="taxaMensal-ajuda">Informe a taxa de juros mensal em percentual.</span>
              </div>

              <div class="field">
                <label for="meses">Meses *</label>
                <input
                  id="meses"
                  name="meses"
                  type="text"
                  inputmode="numeric"
                  placeholder="Ex.: 12"
                  required
                  aria-describedby="meses-ajuda"
                  value="${escapeHtml(monthsValue)}"
                />
                <span class="hint" id="meses-ajuda">Use apenas números inteiros para a quantidade de meses.</span>
              </div>
            </div>
          </fieldset>

          <div class="actions">
            <button type="submit">Calcular</button>
          </div>
        </form>

        <section class="feedback" aria-label="Resultado da simulação">
          <h2>Resultado da simulação</h2>
          <p class="status" id="status-descricao">${escapeHtml(statusDescription)}</p>
          ${resultSection}
          ${errorSection}
        </section>

        <p class="footer">${visitMessage}</p>
      </section>
    </main>
    <script>
      const formulario = document.getElementById("form-simulacao");
      const resultado = document.getElementById("resultado");
      const erro = document.getElementById("erro");
      const statusDescricao = document.getElementById("status-descricao");
      const botaoSubmit = formulario?.querySelector('button[type="submit"]');

      function atualizarStatus(mensagem) {
        statusDescricao.textContent = mensagem;
      }

      function limparErro() {
        erro.textContent = "";
        erro.hidden = true;
      }

      function focarErroVisivel() {
        erro.hidden = false;
        erro.scrollIntoView({ behavior: "smooth", block: "nearest" });
        erro.focus();
      }

      function exibirErro(mensagem) {
        erro.textContent = "";
        const paragrafo = document.createElement("p");
        paragrafo.textContent = mensagem;
        erro.appendChild(paragrafo);
        focarErroVisivel();
      }

      function exibirErros(mensagens) {
        erro.textContent = "";
        for (const mensagem of mensagens) {
          const paragrafo = document.createElement("p");
          paragrafo.textContent = mensagem;
          erro.appendChild(paragrafo);
        }
        focarErroVisivel();
      }

      function obterMensagemErro(payload, fallbackStatus) {
        if (!payload || typeof payload !== "object") {
          return fallbackStatus;
        }

        if (typeof payload.error === "string" && payload.error.trim() !== "") {
          return payload.error.trim();
        }

        if (typeof payload.message === "string" && payload.message.trim() !== "") {
          return payload.message.trim();
        }

        return fallbackStatus;
      }

      function obterMensagemErroHttp(status, payload, texto) {
        const textoLimpo = typeof texto === "string" ? texto.trim() : "";
        const mensagemPayload = obterMensagemErro(payload, "");

        if (mensagemPayload !== "") {
          return mensagemPayload;
        }

        if (textoLimpo !== "") {
          return textoLimpo;
        }

        if (status === 503) {
          return "Não foi possível calcular no momento porque o serviço está indisponível. Tente novamente mais tarde.";
        }

        return "Ocorreu um erro ao calcular. Tente novamente em instantes.";
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

      if (formulario instanceof HTMLFormElement &&
        resultado instanceof HTMLOutputElement &&
        erro instanceof HTMLDivElement &&
        statusDescricao instanceof HTMLElement &&
        botaoSubmit instanceof HTMLButtonElement) {
        formulario.addEventListener("submit", async (event) => {
          event.preventDefault();

          const formData = new FormData(formulario);
          const principal = String(formData.get("principal") ?? "");
          const taxaMensal = String(formData.get("taxaMensal") ?? "");
          const meses = String(formData.get("meses") ?? "");

          limparErro();
          resultado.textContent = "";
          atualizarStatus("Calculando a simulação. Aguarde um instante.");
          formulario.setAttribute("aria-busy", "true");
          botaoSubmit.disabled = true;
          botaoSubmit.textContent = "Calculando...";

          try {
            const resposta = await fetch("/api/calcular", {
              method: "POST",
              headers: {
                "content-type": "application/json; charset=utf-8",
              },
              body: JSON.stringify({ principal, taxaMensal, meses }),
            });

            const payload = await lerPayloadJson(resposta);
            const texto = payload === null ? await resposta.text() : "";

            if (!resposta.ok) {
              const mensagem = obterMensagemErroHttp(resposta.status, payload, texto);
              exibirErro(mensagem);
              atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
              return;
            }

            const montante = payload && typeof payload.total === "number"
              ? payload.total
              : null;

            if (montante === null) {
              exibirErro("O cálculo foi concluído, mas a resposta recebida é inválida. Tente novamente em instantes.");
              atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
              return;
            }

            limparErro();
            resultado.textContent = "Montante final estimado: ";
            const destaque = document.createElement("strong");
            destaque.textContent = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(montante);
            resultado.appendChild(destaque);
            resultado.append(".");
            atualizarStatus("Simulação calculada com sucesso. Confira o resultado abaixo.");
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              exibirErro("Não foi possível calcular no momento porque a solicitação expirou ou foi interrompida. Tente novamente.");
            } else if (error instanceof TypeError) {
              exibirErro("Não foi possível calcular no momento por falha de comunicação. Tente novamente mais tarde.");
            } else {
              exibirErro("Não foi possível calcular no momento no navegador. Tente novamente em instantes.");
            }
            atualizarStatus("Não foi possível concluir o cálculo. Verifique a mensagem de erro exibida.");
          } finally {
            formulario.removeAttribute("aria-busy");
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = "Calcular";
            botaoSubmit?.focus();
          }
        });
      }
    </script>
  </body>
</html>`;
}

async function handleApiCalcular(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return createApiErrorResponse(
      400,
      "Não foi possível interpretar os dados enviados para o cálculo.",
    );
  }

  if (!payload || typeof payload !== "object") {
    return createApiErrorResponse(
      400,
      "Envie os dados da simulação em formato JSON válido.",
    );
  }

  const body = payload as Record<string, unknown>;
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

  return createJsonResponse(JSON.stringify({ total }), 200);
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
