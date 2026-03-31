# Security Considerations

When implementing Sign in with Ethereum, most security comes down to one principle: **the server must control what gets verified**. The client asks the user to sign a message, but the server decides whether that message is acceptable. This guide covers the verification parameters that enforce that principle and the common mistakes that undermine it.

## Verification Parameters

The `verify()` method accepts parameters that the server asserts against the signed message. If any parameter doesn't match, verification fails with a `SiweError`. These parameters are your primary security controls.

### Domain

**Prevents**: phishing attacks where a malicious site tricks a user into signing a message intended for your app.

The `domain` field binds a SIWE message to a specific origin. Wallets display this to the user, and the server must verify it matches the expected value:

```typescript
const { data } = await siweMessage.verify({
  signature,
  domain: 'example.com', // must match the message's domain field
  nonce: session.nonce,
})
```

**Common mistakes**:

- **Trusting the client-supplied domain** — if you read the domain from the message itself and don't compare it against an expected value, an attacker can substitute any domain. Always pass your known domain to `verify()`.
- **Using the `Host` header without a fallback** — behind reverse proxies, `request.url` may not reflect the public domain. Set an explicit environment variable:

```typescript
domain: process.env.NEXT_PUBLIC_DOMAIN ?? new URL(request.url).host,
```

### Nonce

**Prevents**: replay attacks where a previously signed message is resubmitted.

The server generates a nonce, stores it in the session, and requires the signed message to include the same nonce. After verification, the nonce is invalidated:

```typescript
// Generate — store in session
session.nonce = generateNonce()
await session.save()

// Verify — nonce is checked, then cleared
const { data } = await siweMessage.verify({
  signature,
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? new URL(request.url).host,
  nonce: session.nonce,
})
session.nonce = undefined
await session.save()
```

**Common mistakes**:

- **Reusable nonces** — if you don't clear the nonce after verification, the same signed message can be submitted again.
- **Client-generated nonces** — nonces must come from the server. A client-generated nonce provides no replay protection because an attacker can reuse the signed message with the same nonce.
- **No expiration** — nonces stored without a TTL can accumulate indefinitely. Clean up unused nonces after a few minutes.
- **Weak entropy** — use `generateNonce()` from the SIWE library, which produces 96 bits of cryptographically secure randomness.

### Time Fields

**Prevents**: indefinitely valid messages and premature use.

```typescript
const message = new SiweMessage({
  // ...
  issuedAt: new Date().toISOString(),
  expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
})
```

The `verify()` method automatically checks `expirationTime` and `notBefore` against the current time. You can also verify against a specific time:

```typescript
await siweMessage.verify({
  signature,
  domain: 'example.com',
  nonce: session.nonce,
  time: '2024-10-31T16:30:00Z', // check against this time instead of now
})
```

**Recommendations**:

- Set `expirationTime` to 5–15 minutes from `issuedAt`.
- Use `issuedAt` to detect abnormally old messages even when `expirationTime` is set.
- Account for clock skew between client and server — a few seconds of tolerance is reasonable.
- Use `notBefore` only when you need delayed validity (e.g., scheduled authentication).

### Chain ID

**Prevents**: cross-chain replay attacks where a message signed for one network is used on another.

```typescript
await siweMessage.verify({
  signature,
  domain: 'example.com',
  nonce: session.nonce,
  chainId: 1, // only accept mainnet signatures
})
```

If your application operates on multiple chains, validate that the chain ID matches one you support and handle each appropriately.

## Server-Side Message Generation

The most secure approach is generating the entire SIWE message on the server, so the client can only sign what the server provides. This eliminates any possibility of parameter tampering:

```typescript
// Server generates the full message
app.get('/api/message', async (req, res) => {
  const session = await getSession()
  const nonce = generateNonce()
  session.nonce = nonce
  await session.save()

  const message = new SiweMessage({
    domain: 'example.com',
    address: req.query.address,
    statement: 'Sign in with Ethereum.',
    uri: 'https://example.com',
    version: '1',
    chainId: 1,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  })

  res.json({ message: message.prepareMessage() })
})
```

An alternative is letting the client construct the message but having the server assert all parameters during verification. The [Quickstart](/quickstart) uses this approach — the frontend builds the message, and the backend verifies domain and nonce. Both approaches are valid as long as the server verifies the parameters it cares about.

## Signature Verification

### EOA vs. Smart Contract Wallets

For regular EOA wallets, signature verification is purely cryptographic — no network call needed. For smart contract wallets (multisigs, account abstraction), the library calls `isValidSignature` ([EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)) onchain, which requires an RPC connection:

```typescript
import { configure, createConfig } from '@signinwithethereum/siwe'

// Required for smart contract wallet support
configure(await createConfig(process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'))
```

Without this configuration, smart contract wallet signatures will fail. The library also supports [EIP-6492](https://eips.ethereum.org/EIPS/eip-6492) for **undeployed** contract wallets when using viem v2+.

### Strict Mode

For higher assurance, enable strict mode to require `uri` and `chainId` verification in addition to `domain` and `nonce`:

```typescript
const result = await message.verify(
  {
    signature,
    domain: 'example.com',
    nonce: expectedNonce,
    uri: 'https://example.com',
    chainId: 1,
  },
  { strict: true },
)
```

## Session Management

Signature verification proves identity at a point in time. After that, session security determines how long that proof remains valid.

**Recommendations**:

- **Encrypt sessions** — use a library like [iron-session](https://github.com/vvo/iron-session) that encrypts cookie values. Without encryption, a user can forge their session cookie and impersonate any address.
- **Use `httpOnly` and `secure` cookie flags** — prevents JavaScript access and ensures cookies are only sent over HTTPS.
- **Set `sameSite`** — use `lax` or `strict` to prevent CSRF attacks.
- **Use a strong session secret** — at least 32 characters, loaded from environment variables, never hardcoded.
- **Implement session expiration** — sessions should not last indefinitely.

```typescript
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!, // ≥ 32 characters
  cookieName: 'siwe-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}
```

## Rate Limiting

Authentication endpoints are abuse targets. Rate-limit both nonce generation and verification endpoints to prevent:

- **Nonce exhaustion** — flooding `/api/nonce` to fill up server-side nonce storage.
- **Brute-force attempts** — repeatedly submitting signatures against the verification endpoint.
- **Resource consumption** — EIP-1271 verification makes onchain RPC calls, which are more expensive than pure cryptographic checks.

## HTTPS

Always serve SIWE applications over HTTPS. Without TLS:

- An attacker can intercept the signed message and signature in transit, then submit them to your server (even with nonce protection, the attacker can race the legitimate request).
- The `domain` field loses its security value since DNS can be spoofed without HTTPS.
- Session cookies can be intercepted even with `httpOnly` set.

## Common Attack Patterns

| Attack | What happens | Mitigation |
|--------|-------------|------------|
| **Replay** | Attacker resubmits a previously signed message | Single-use nonces, `expirationTime` |
| **Phishing** | User signs a message on a malicious domain | `domain` verification, wallet domain display |
| **Cross-chain replay** | Message signed for chain A is accepted on chain B | `chainId` verification |
| **Session forgery** | Attacker crafts a session cookie with a target address | Encrypted sessions (iron-session) |
| **Message tampering** | Client modifies message fields before signing | Server-side verification of all parameters |
| **Nonce prediction** | Attacker guesses the next nonce | Cryptographically secure nonce generation |

## Checklist

Before deploying to production:

- [ ] `domain` passed to `verify()` is a known value, not read from the message
- [ ] Nonces are generated server-side with `generateNonce()`
- [ ] Nonces are single-use — cleared after successful verification
- [ ] Unused nonces expire after a few minutes
- [ ] `expirationTime` is set on messages (5–15 minutes)
- [ ] Session cookies use `httpOnly`, `secure`, and `sameSite` flags
- [ ] Session secret is at least 32 characters, from an environment variable
- [ ] Sessions are encrypted (not just signed)
- [ ] RPC is configured for smart contract wallet support (EIP-1271)
- [ ] Authentication endpoints are rate-limited
- [ ] Application is served over HTTPS
- [ ] `NEXT_PUBLIC_DOMAIN` is set when behind a reverse proxy
