/** Edge-safe HS256 JWT verify for middleware (must match backend JWT_SECRET). */

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<{ sub?: string; exp?: number } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signature = base64UrlToBytes(sigB64);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(signature),
    data,
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64)),
    ) as { sub?: string; exp?: number };
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return null;
    }
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}
