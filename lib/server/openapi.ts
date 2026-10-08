export type RouteDoc = { method: string; path: string; summary: string; auth: string };

export function openApiDocument(routes: RouteDoc[]) {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of routes) {
    const path = route.path.replace(/:([A-Za-z]+)/g, "{$1}");
    paths[path] ??= {};
    paths[path][route.method.toLowerCase()] = {
      summary: route.summary,
      security: route.auth === "public" ? [] : [{ bearer: [] }],
      responses: { "200": { description: "OK" }, "400": { description: "Invalid request" }, "401": { description: "Sign in required" }, "403": { description: "Forbidden" }, "409": { description: "Conflict" } },
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Auraloomdimond API",
      version: "1.0.0",
      description: "HTTP route, controller, service, repository, then Postgres. Catalog reads may use Redis. Stock, checkout, payments, and orders are read from Postgres at decision time.",
    },
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    },
    paths,
  };
}
