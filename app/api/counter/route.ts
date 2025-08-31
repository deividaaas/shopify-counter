export const runtime = "nodejs";

// Reuse existing counter handler implemented in legacy api/index.js
// @ts-ignore - no type definitions for legacy module
import legacyHandler from "@/api/index.js";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (query[key]) {
      const current = query[key];
      if (Array.isArray(current)) {
        current.push(value);
      } else {
        query[key] = [current, value];
      }
    } else {
      query[key] = value;
    }
  }

  return await new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: any) {
        resolve(
          new Response(JSON.stringify(body), {
            status: this.statusCode || 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      },
    };
    legacyHandler({ headers, query }, res);
  });
}
