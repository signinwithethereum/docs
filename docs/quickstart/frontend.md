# Frontend

This page walks through the key frontend files in the [quickstart repo](https://github.com/signinwithethereum/siwe-quickstart). All paths are relative to the repo root.

## Wagmi Configuration

**`lib/wagmi.ts`** — configures wallet connectors and chain transports.

Two connectors are set up: `injected()` for browser wallets (MetaMask, etc.) and `walletConnect()` for mobile wallets via QR code. The app supports mainnet and Sepolia.

```typescript
export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
})
```

When the `NEXT_PUBLIC_*_RPC_URL` env vars are empty, `http()` falls back to each chain's default public RPC. These client-side RPCs are separate from the server-side `ETH_RPC_URL` used for signature verification.

## Authentication Context

**`hooks/useSiweAuth.tsx`** — the core of the frontend. A React context that manages the full SIWE sign-in lifecycle.

### The sign-in flow

The `signIn` function implements the four-step SIWE handshake:

```typescript
const signIn = useCallback(async () => {
  // 1. Fetch nonce from backend
  const nonceRes = await fetch('/api/nonce')
  const { nonce } = await nonceRes.json()

  // 2. Create SIWE message
  const message = new SiweMessage({
    domain: window.location.host,
    address,
    statement: 'Sign in with Ethereum.',
    uri: window.location.origin,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  })

  // 3. Request wallet signature
  const signature = await signMessageAsync({
    message: message.prepareMessage(),
  })

  // 4. Verify on backend
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message.prepareMessage(), signature }),
  })
}, [address, chainId, signMessageAsync])
```

### Auto sign-in

When a wallet connects and there's no existing session, the context automatically initiates sign-in. A ref guard prevents double-firing:

```typescript
useEffect(() => {
  if (hasCheckedSession && address && !user && !isLoading && !signedOut.current
      && autoSignInAttempted.current !== address) {
    autoSignInAttempted.current = address
    signInRef.current()
  }
}, [hasCheckedSession, address, chainId, user, isLoading])
```

### Sign-out

Signing out destroys the server session _and_ disconnects the wallet. A `signedOut` ref prevents auto sign-in from re-triggering immediately.

## ENS Resolution

**`hooks/useEnsIdentity.ts`** — resolves an address to its ENS name and avatar using wagmi's built-in hooks. Always queries mainnet regardless of the user's connected chain.

## Components

The UI is split into small components in `components/`:

- **`SiweAuth.tsx`** — shows the "Sign in with Ethereum" button when connected but not authenticated, or the `UserCard` when authenticated
- **`UserCard.tsx`** — displays ENS name/avatar (or truncated address) and a sign-out button
- **`Nav.tsx`** — navigation bar that shows a Dashboard link only when authenticated

## Protected Dashboard

The dashboard at `app/dashboard/` is protected by two layers:

1. **Server-side** (`app/dashboard/layout.tsx`) — checks the session and redirects to `/` if unauthenticated
2. **Client-side** (`app/dashboard/page.tsx`) — a `useEffect` fallback that redirects if the auth context has no user

## Next Steps

- [Backend](backend) — the API routes that handle nonce, verification, and sessions
- [TypeScript Library Reference](/libraries/typescript) — full API documentation
- [Security Considerations](/security-considerations) — production security best practices
