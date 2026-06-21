export interface HealthPayload {
  ok: true;
  service: string;
  version: string;
}

export const healthPayload: HealthPayload = {
  ok: true,
  service: "ifactory-product",
  version: "0.1.0",
};

export function createHealthResponse(): Response {
  return Response.json(healthPayload);
}
