export interface Env {
    BEARER_TOKEN: string;
}

// Cloudflare Workers extends SubtleCrypto with timingSafeEqual, which is not
// present in the standard lib or @cloudflare/workers-types definitions.
interface CloudflareSubtleCrypto extends SubtleCrypto {
    timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean;
}

function timingSafeEqual(a: string, b: string): boolean {
    const enc = new TextEncoder();
    const bufA = enc.encode(a);
    const bufB = enc.encode(b);
    if (bufA.byteLength !== bufB.byteLength) {
        return false;
    }
    const subtle = crypto.subtle as CloudflareSubtleCrypto;
    if (typeof subtle.timingSafeEqual === "function") {
        return subtle.timingSafeEqual(bufA, bufB);
    }
    // Fallback for environments without the Cloudflare extension (e.g. Vitest).
    let diff = 0;
    for (let i = 0; i < bufA.byteLength; i++) {
        diff |= bufA[i] ^ bufB[i];
    }
    return diff === 0;
}

export function authorize(request: Request, env: Env): boolean {
    if (!env.BEARER_TOKEN) {
        return false;
    }
    const header = request.headers.get("Authorization");
    if (!header) {
        return false;
    }
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return false;
    }

    return timingSafeEqual(token, env.BEARER_TOKEN);
}

export function unauthorizedResponse(): Response {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
}
