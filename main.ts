import { formatCounterMessage, VisitCounter } from "./counter.ts";

const counter = new VisitCounter();

function renderHomePage(): string {
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
        --error-bg: #fef2f2;
        --error-ink: #b91c1c;
        --result-bg: #eff6ff;
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

      #resultado,
      #erro {
        margin-top: 24px;
        padding: 16px;
        border-radius: 12px;
      }

      #resultado {
        background: var(--result-bg);
      }

      #erro {
        background: var(--error-bg);
        color: var(--error-ink);
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

        <form method="post" action="#" aria-describedby="descricao-formulario">
          <span id="descricao-formulario" hidden>
            Formulário para cálculo financeiro.
          </span>

          <div class="field">
            <label for="principal">Valor principal</label>
            <input
              id="principal"
              name="principal"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="Ex.: 1000,00"
            />
          </div>

          <div class="field">
            <label for="taxaMensal">Taxa mensal (%)</label>
            <input
              id="taxaMensal"
              name="taxaMensal"
              type="number"
              inputmode="decimal"
              step="0.01"
              placeholder="Ex.: 1,50"
            />
          </div>

          <div class="field">
            <label for="meses">Meses</label>
            <input
              id="meses"
              name="meses"
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="Ex.: 12"
            />
          </div>

          <button type="submit">Calcular</button>
        </form>

        <section id="resultado" aria-live="polite" aria-label="Resultado">
          Resultado da simulação aparecerá aqui.
        </section>

        <section id="erro" aria-live="polite" aria-label="Mensagens de erro">
          Nenhuma mensagem de erro no momento.
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
    return new Response(renderHomePage(), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return Response.json({ error: "not found" }, { status: 404 });
}

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") ?? 8000);
  console.log(`iFactory Product on http://localhost:${port}`);
  Deno.serve({ port }, handler);
}
