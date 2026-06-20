// Netlify Function — SSR handler voor TanStack Start
// Netlify bundelt deze file en volgt static imports
import ssrApp from "../../dist/server/server.js";

export async function handler(event) {
  const host = event.headers["host"] || event.headers["x-forwarded-host"] || "localhost";
  const proto = event.headers["x-forwarded-proto"] || "https";
  const rawPath = event.rawPath || event.path || "/";
  const qs = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const url = `${proto}://${host}${rawPath}${qs}`;

  const request = new Request(url, {
    method: event.httpMethod,
    headers: event.headers,
    body:
      event.body
        ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf-8")
        : undefined,
  });

  const response = await ssrApp.fetch(request);

  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    statusCode: response.status,
    headers,
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
}
