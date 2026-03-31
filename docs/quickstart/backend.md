# Backend

This page walks through the API routes and server-side configuration in the [quickstart repo](https://github.com/signinwithethereum/siwe-quickstart). All paths are relative to the repo root.

## Session Configuration

**`lib/session.ts`** — configures [iron-session](https://github.com/vvo/iron-session) for encrypted cookie-based sessions.

iron-session wraps Next.js's `cookies()` API with encryption so users can't forge their session cookie. The session stores three fields:

```typescript
export interface SessionData {
  nonce?: string    // pending SIWE nonce
  address?: string  // verified Ethereum address
  chainId?: number  // chain used during sign-in
}
```

Cookies are `httpOnly` and `secure` in production (HTTPS only).

## SIWE Configuration

**`lib/siwe.ts`** — configures the SIWE library with an Ethereum RPC connection.

```typescript
import { configure, createConfig } from '@signinwithethereum/siwe'

configure(
  await createConfig(process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'),
)
```

The RPC connection is needed for smart contract wallet verification ([EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)). For regular EOA wallets, signature verification is purely cryptographic — no RPC call needed. The library handles this distinction automatically.

This module is imported for its side effect (`import '@/lib/siwe'`) by routes that call `verify()`.

## API Routes

The app has four routes. Together they implement a nonce-based authentication flow.

### `GET /api/nonce`

**`app/api/nonce/route.ts`** — generates a random nonce using the SIWE library and stores it in the session. The frontend includes this nonce in the SIWE message, and the server checks it during verification to prevent replay attacks.

### `POST /api/verify`

**`app/api/verify/route.ts`** — the core authentication endpoint. Receives a signed SIWE message, verifies it, and creates a session.

```typescript
const siweMessage = new SiweMessage(message)

const { data } = await siweMessage.verify({
  signature,
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? new URL(request.url).host,
  nonce: session.nonce,
})

// Store verified identity in session
session.address = data.address
session.chainId = data.chainId
session.nonce = undefined  // invalidate nonce — one-time use
await session.save()
```

The `domain` parameter uses `NEXT_PUBLIC_DOMAIN` when set, falling back to the request's `Host` header. Set it explicitly when running behind a reverse proxy.

### `GET /api/me`

**`app/api/me/route.ts`** — returns the current user's address and chain ID from the session, or 401 if not authenticated.

### `POST /api/logout`

**`app/api/logout/route.ts`** — destroys the session.

## What `verify()` Checks

When you call `siweMessage.verify()`, the library validates:

1. **Domain binding** — the message's domain matches your server (prevents phishing)
2. **Nonce match** — the nonce matches what your server issued (prevents replay attacks)
3. **Signature recovery** — the recovered address matches the message's claimed address
4. **Time validation** — checks `expirationTime` and `notBefore` if present
5. **EIP-1271** — for smart contract wallets, calls `isValidSignature` onchain

If any check fails, `verify()` throws a `SiweError` with a typed error:

```typescript
import { SiweError, SiweErrorType } from '@signinwithethereum/siwe'

try {
  await siweMessage.verify({ signature, domain, nonce })
} catch (error) {
  if (error instanceof SiweError) {
    // error.type is one of:
    //   EXPIRED_MESSAGE, NONCE_MISMATCH, INVALID_SIGNATURE, ...
  }
}
```

## Production Tips

:::tip
For production deployments, review the full [Security Considerations](/security-considerations) guide. Key recommendations:

- **Use a strong session secret** — at least 32 characters, loaded from environment variables
- **Use a dedicated RPC provider** — public RPCs have rate limits; use Alchemy, Infura, or similar
- **Set short nonce expiry** — nonces should expire after a few minutes
- **Rate-limit** the `/api/nonce` and `/api/verify` endpoints
- **Set `NEXT_PUBLIC_DOMAIN`** — explicitly set the expected domain for verification when behind a reverse proxy
:::

## Next Steps

- [TypeScript Library Reference](/libraries/typescript) — full API documentation including configuration options
- [Security Considerations](/security-considerations) — comprehensive security guide
- [NextAuth.js Integration](/integrations/nextauth.js) — use SIWE with NextAuth.js
- [OIDC Provider](/oidc-provider) — use SIWE as an OpenID Connect identity provider
