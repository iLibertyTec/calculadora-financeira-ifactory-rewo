import {
  assert,
  assertEquals,
  assertMatch,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("GET /health returns contract response", async (): Promise<void> => {
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");

  const body: unknown = await response.json();
  assert(typeof body === "object" && body !== null);

  const payload = body as {
    ok?: unknown;
    service?: unknown;
    version?: unknown;
  };

  assertEquals(payload.ok, true);
  assert(typeof payload.service === "string");
  assert(typeof payload.version === "string");
  assertMatch(payload.service, /\S/);
  assertMatch(payload.version, /\S/);
});
