import { formatCounterMessage, VisitCounter } from "./counter.ts";
import { calcularJurosCompostos } from "./src/juros_compostos.ts";

const counter = new VisitCounter();
const JSON_HEADERS: HeadersInit = {
  "content-type": "application/json; charset=utf-8",
};

const JUROS_COMPOSTOS_FIELDS = ["capitalInicial", "taxa", "periodos"] as const;

type JurosCompostosField = typeof JUROS_COMPOSTOS_FIELDS[number];

type JurosCompostosPayload = {
  capitalInicial: number;
  taxa: number;
  periodos: number;
};

type ValidationResult =
  | {
    ok: true;
    payload: JurosCompostosPayload;
  }
  | {
    ok: false;
    errors: Record<string, string>;
  };

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function hasJsonContentType(req: Request): boolean {
  const contentType = req.headers.get("content-type");

  return contentType?.toLowerCase().includes("application/json") ?? false;
}

function validateJurosCompostosPayload(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      ok: false,
      errors: {
        body: "must be an object",
      },
    };
  }

  const payload = value as Record<string, unknown>;
  const errors: Record<string, string> = {};

  for (const key of Object.keys(payload)) {
    if (!JUROS_COMPOSTOS_FIELDS.includes(key as JurosCompostosField)) {
      errors[key] = "is not allowed";
    }
  }

  if (!("capitalInicial" in payload)) {
    errors.capitalInicial = "is required";
  } else if (
    typeof payload.capitalInicial !== "number" ||
    !Number.isFinite(payload.capitalInicial)
  ) {
    errors.capitalInicial = "must be a finite number";
  }

  if (!("taxa" in payload)) {
    errors.taxa = "is required";
  } else if (
    typeof payload.taxa !== "number" ||
    !Number.isFinite(payload.taxa)
  ) {
    errors.taxa = "must be a finite number";
  }

  if (!("periodos" in payload)) {
    errors.periodos = "is required";
  } else if (
    typeof payload.periodos !== "number" ||
    !Number.isFinite(payload.periodos)
  ) {
    errors.periodos = "must be a finite number";
  } else if (!Number.isInteger(payload.periodos)) {
    errors.periodos = "must be an integer";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    payload: {
      capitalInicial: payload.capitalInicial as number,
      taxa: payload.taxa as number,
      periodos: payload.periodos as number,
    },
  };
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "ifactory-product",
      version: "0.1.0",
    });
  }

  if (url.pathname === "/api/juros-compostos") {
    if (req.method === "POST") {
      if (!hasJsonContentType(req)) {
        return jsonResponse(
          { error: "unsupported media type" },
          { status: 415, headers: JSON_HEADERS },
        );
      }

      let body: unknown;

      try {
        body = await req.json();
      } catch {
        return jsonResponse(
          { error: "invalid json" },
          { status: 400, headers: JSON_HEADERS },
        );
      }

      const validation = validateJurosCompostosPayload(body);

      if (!validation.ok) {
        return jsonResponse(
          { error: "invalid payload", details: validation.errors },
          { status: 400, headers: JSON_HEADERS },
        );
      }

      const { capitalInicial, taxa, periodos } = validation.payload;
      const montante = calcularJurosCompostos(
        capitalInicial,
        taxa,
        periodos,
      );

      return jsonResponse({
        capitalInicial,
        taxa,
        periodos,
        montante,
      }, { headers: JSON_HEADERS });
    }

    return jsonResponse(
      { error: "method not allowed" },
      {
        status: 405,
        headers: {
          ...JSON_HEADERS,
          "allow": "POST",
        },
      },
    );
  }

  if (url.pathname === "/api/visits" && req.method === "GET") {
    return jsonResponse(counter.state);
  }

  if (url.pathname === "/api/visits" && req.method === "POST") {
    const body = req.headers.get("content-type")?.includes("json")
      ? await req.json().catch(() => ({}))
      : {};
    const visitorId = typeof body.visitorId === "string"
      ? body.visitorId
      : undefined;
    const state = counter.recordVisit(visitorId);
    return jsonResponse({
      ...state,
      message: formatCounterMessage(state),
    });
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

  return jsonResponse({ error: "not found" }, { status: 404 });
}

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") ?? 8000);
  console.log(`iFactory Product on http://localhost:${port}`);
  Deno.serve({ port }, handler);
}
