# Backend

This guide adds API route handlers to your Next.js app for nonce generation, SIWE signature verification, and session management.

## Session Configuration

Next.js provides a `cookies()` API for reading and writing cookies, but doesn't encrypt or sign them — meaning a user could forge their session cookie and impersonate any address. **iron-session** wraps the native `cookies()` API with encryption, giving you secure sessions with zero configuration. It's a single dependency with no transitive dependencies.

Create `lib/session.ts`:

```typescript
import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
	nonce?: string
	address?: string
	chainId?: number
}

export const sessionOptions: SessionOptions = {
	password: process.env.SESSION_SECRET!,
	cookieName: 'siwe-session',
	cookieOptions: {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		sameSite: 'lax' as const,
	},
}

export async function getSession() {
	return getIronSession<SessionData>(await cookies(), sessionOptions)
}
```

## SIWE Configuration

SIWE needs an Ethereum RPC connection to verify signatures from smart contract wallets ([EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)). For regular EOA wallets the signature is verified purely with cryptography, but smart contract wallets require an onchain call to `isValidSignature`. The library handles this automatically — you just need to provide an RPC URL once at startup.

Create `lib/siwe.ts`:

```typescript
import { configure, createConfig } from '@signinwithethereum/siwe'

configure(
	await createConfig(process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'),
)
```

This module is imported for its side effect (`import '@/lib/siwe'`) — it configures the SIWE library globally so that `verify()` calls can reach the RPC when needed.

## Route Handlers

### Generate Nonce

Create `app/api/nonce/route.ts`:

```typescript
import { generateNonce } from '@signinwithethereum/siwe'
import { getSession } from '@/lib/session'

export async function GET() {
	const session = await getSession()
	session.nonce = generateNonce()
	await session.save()

	return Response.json({ nonce: session.nonce })
}
```

### Verify Signature

Create `app/api/verify/route.ts`:

```typescript
import { SiweMessage, SiweError } from '@signinwithethereum/siwe'
import { getSession } from '@/lib/session'
import '@/lib/siwe' // ensure SIWE is configured

export async function POST(request: Request) {
	const session = await getSession()
	const body = await request.json().catch(() => null)
	if (!body?.message || !body?.signature) {
		return Response.json(
			{ error: 'Missing message or signature' },
			{ status: 400 },
		)
	}
	const { message, signature } = body

	if (!session.nonce) {
		return Response.json({ error: 'No nonce in session' }, { status: 400 })
	}

	try {
		const siweMessage = new SiweMessage(message)

		const { data } = await siweMessage.verify({
			signature,
			domain: process.env.NEXT_PUBLIC_DOMAIN ?? new URL(request.url).host,
			nonce: session.nonce,
		})

		// Store verified identity in session
		session.address = data.address
		session.chainId = data.chainId
		session.nonce = undefined // invalidate nonce
		await session.save()

		return Response.json({ address: data.address, chainId: data.chainId })
	} catch (error) {
		if (error instanceof SiweError) {
			return Response.json({ error: error.type }, { status: 401 })
		}
		return Response.json({ error: 'Verification failed' }, { status: 400 })
	}
}
```

The `domain` check uses `NEXT_PUBLIC_DOMAIN` when set, falling back to the request's `Host` header. This is useful when your app runs behind a reverse proxy where `request.url` may not reflect the public domain.

### Get Current User

Create `app/api/me/route.ts`:

```typescript
import { getSession } from '@/lib/session'

export async function GET() {
	const session = await getSession()

	if (!session.address) {
		return Response.json({ error: 'Not authenticated' }, { status: 401 })
	}

	return Response.json({ address: session.address, chainId: session.chainId })
}
```

### Logout

Create `app/api/logout/route.ts`:

```typescript
import { getSession } from '@/lib/session'

export async function POST() {
	const session = await getSession()
	session.destroy()
	return Response.json({ ok: true })
}
```

## Run the App

```bash
npm run dev
```

Visit `http://localhost:3000` — connect your wallet, sign the SIWE message, and you're authenticated. The frontend and API routes run together in a single process, no CORS needed.

## How Verification Works

When you call `siweMessage.verify()`, the library checks:

1. **Domain binding** — the message's domain matches your server (prevents phishing)
2. **Nonce match** — the nonce matches what your server issued (prevents replay attacks)
3. **Signature recovery** — the recovered address matches the message's claimed address
4. **Time validation** — checks `expirationTime` and `notBefore` if present
5. **EIP-1271** — for smart contract wallets, calls `isValidSignature` onchain

If any check fails, `verify()` throws a `SiweError`:

```typescript
import { SiweError, SiweErrorType } from '@signinwithethereum/siwe'

try {
	await siweMessage.verify({ signature, domain, nonce })
} catch (error) {
	if (error instanceof SiweError) {
		switch (error.type) {
			case SiweErrorType.EXPIRED_MESSAGE:
				// Message has expired
				break
			case SiweErrorType.NONCE_MISMATCH:
				// Possible replay attack
				break
			case SiweErrorType.INVALID_SIGNATURE:
				// Signature doesn't match the address
				break
		}
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
- **Enable HTTPS** — `iron-session` sets `secure: true` automatically in production
- **Set `NEXT_PUBLIC_DOMAIN`** — when behind a reverse proxy, explicitly set the expected domain for verification
:::

## Next Steps

- [TypeScript Library Reference](/libraries/typescript) — full API documentation including configuration options
- [Security Considerations](/security-considerations) — comprehensive security guide
- [NextAuth.js Integration](/integrations/nextauth.js) — use SIWE with NextAuth.js
- [OIDC Provider](/oidc-provider) — use SIWE as an OpenID Connect identity provider
