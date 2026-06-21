import { formatCounterMessage, VisitCounter } from "./counter.ts";
import { calcularJurosCompostos } from "./src/juros_compostos.ts";

const counter = new VisitCounter();

interface JurosCompostosPayload {
  principal: number;
  taxaMensalPercentual: number;
  meses: number;
}

function validarCampoNumerico(
  valor: unknown,
  nomeCampo: "principal" | "taxaMensalPercentual" | "meses",
): number {
  if (typeof valor === "undefined") {
    throw new TypeError(`${nomeCampo} é obrigatório.`);
  }

  if (
    typeof valor !== "number" || Number.isNaN(valor) || !Number.isFinite(valor)
  ) {
    throw new TypeError(`${nomeCampo} deve ser um número finito.`);
  }

  return valor;
}

function validarRegrasDeDominio(
  payload: JurosCompostosPayload,
): JurosCompostosPayload {
  if (payload.principal < 0) {
    throw new RangeError("principal não pode ser negativo.");
  }

  if (payload.taxaMensalPercentual < 0) {
    throw new RangeError("taxaMensalPercentual não pode ser negativa.");
  }

  if (payload.meses < 0) {
    throw new RangeError("meses não pode ser negativo.");
  }

  if (!Number.isInteger(payload.meses)) {
    throw new RangeError("meses deve ser um número inteiro.");
  }

  return payload;
}

function parseJurosCompostosPayload(body: unknown): JurosCompostosPayload {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new TypeError("Corpo da requisição deve ser um objeto JSON.");
  }

  const payload = body as Record<string, unknown>;
  const taxaMensalPercentual = typeof payload.taxaMensalPercentual !==
      "undefined"
    ? payload.taxaMensalPercentual
    : payload.taxaMensal;

  return validarRegrasDeDominio({
    principal: validarCampoNumerico(payload.principal, "principal"),
    taxaMensalPercentual: validarCampoNumerico(
      taxaMensalPercentual,
      "taxaMensalPercentual",
    ),
    meses: validarCampoNumerico(payload.meses, "meses"),
  });
}

function arredondarTresCasas(valor: number): number {
  return Math.round(valor * 1000) / 1000;
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

  if (url.pathname === "/api/juros-compostos") {
    if (req.method !== "POST") {
      return Response.json(
        { error: "Método não permitido." },
        {
          status: 405,
          headers: { "Allow": "POST" },
        },
      );
    }

    if (!req.headers.get("content-type")?.includes("application/json")) {
      return Response.json(
        { error: "Content-Type deve ser application/json." },
        { status: 415 },
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "JSON inválido." },
        { status: 400 },
      );
    }

    try {
      const payload = parseJurosCompostosPayload(body);
      const resultado = calcularJurosCompostos(
        payload.principal,
        payload.taxaMensalPercentual,
        payload.meses,
      );

      return Response.json({
        montante: arredondarTresCasas(resultado.montante),
        jurosTotais: arredondarTresCasas(resultado.jurosTotais),
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Dados inválidos.";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (url.pathname === "/") {
    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>iFactory Product — Visit Analytics</title>
<style>
:root{--bg:#080b17;--panel:#141b34;--ink:#eaeefa;--mut:#8b95b8;--accent:#4c8dff}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;display:grid;place-items:center}
.card{background:var(--panel);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:36px;text-align:center;max-width:420px;width:90%}
h1{font-size:1.35rem;margin-bottom:8px}
p{color:var(--mut);font-size:.9rem;margin-bottom:20px}
#count{font-size:3rem;font-weight:700;color:var(--accent);margin:12px 0}
button{background:var(--accent);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-weight:600;cursor:pointer}
.badge{display:inline-block;margin-top:16px;font-size:.75rem;color:var(--mut)}
</style></head>
<body><div class="card">
<h1>Visit Analytics</h1>
<p>Evolved by the iFactory autonomous team.</p>
<div id="count">0</div>
<p id="msg"></p>
<button id="btn">Registrar visita</button>
<div class="badge">iFactory Product · Deno Deploy</div>
</div>
<script>
const countEl=document.getElementById('count'),msgEl=document.getElementById('msg');
async function refresh(){const r=await fetch('/api/visits');const d=await r.json();countEl.textContent=d.visits;msgEl.textContent=d.lastVisitor?'Último: '+d.lastVisitor:''}
document.getElementById('btn').onclick=async()=>{await fetch('/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:'browser'})});refresh()};
refresh();
</script></body></html>`;
    return new Response(html, {
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
