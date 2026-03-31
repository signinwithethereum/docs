# Frontend

This guide sets up a Next.js app with wallet connection, SIWE authentication, ENS identity resolution, and a protected dashboard using wagmi and viem.

## Project Setup

```bash
npx create-next-app@latest siwe-app --typescript --app
cd siwe-app
npm install @signinwithethereum/siwe wagmi viem @tanstack/react-query @walletconnect/ethereum-provider iron-session
```

Here's what each package does:

| Package | Why |
|---------|-----|
| `@signinwithethereum/siwe` | Creates and parses [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) messages |
| `wagmi` | React hooks for wallet connection, signing, and chain/account state |
| `viem` | Low-level Ethereum library that wagmi is built on — handles RPC calls and signature encoding |
| `@tanstack/react-query` | Caching layer that wagmi requires for managing async wallet state |
| `@walletconnect/ethereum-provider` | WalletConnect v2 support — enables mobile wallet scanning via QR code |
| `iron-session` | Encrypted cookie-based sessions (used by the [backend](backend) API routes) |

## Environment Variables

Create `.env.local` with the following:

```bash
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
SESSION_SECRET=change-me-to-at-least-32-characters-long
NEXT_PUBLIC_DOMAIN=

# Server-side RPC — used by the SIWE library for signature verification and ENS resolution.
# Never exposed to the browser.
ETH_RPC_URL=https://eth.llamarpc.com

# Client-side RPC — used by wagmi in the browser for wallet interactions.
# When unset, wagmi falls back to the chain's default public RPC (rate-limited).
NEXT_PUBLIC_MAINNET_RPC_URL=
NEXT_PUBLIC_SEPOLIA_RPC_URL=
```

:::tip
Get a free WalletConnect project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com).
:::

## Wagmi Configuration

Create `lib/wagmi.ts`:

```typescript
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

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

This configures two connectors: `injected()` for browser extension wallets (MetaMask, etc.) and `walletConnect()` for mobile wallets via QR code. The WalletConnect connector is only added when a project ID is set.

The `transports` section configures per-chain RPC endpoints for the browser. When the `NEXT_PUBLIC_*` env vars are empty, `http()` falls back to each chain's default public RPC.

## Helper Hooks

### Hydration Safety

Next.js renders on the server first, but wallet state only exists in the browser. This hook prevents hydration mismatches by returning `false` during SSR and `true` after the component mounts.

Create `hooks/useMounted.ts`:

```typescript
import { useSyncExternalStore } from 'react'

export function useMounted(): boolean {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	)
}
```

### ENS Resolution

Resolve an address to its ENS name and avatar. This uses wagmi's built-in ENS hooks, which query mainnet regardless of the user's connected chain.

Create `hooks/useEnsIdentity.ts`:

```typescript
import { useEnsAvatar, useEnsName } from 'wagmi'
import { mainnet } from 'wagmi/chains'

export function useEnsIdentity(address: string | null) {
	const ensAddress = address ? (address as `0x${string}`) : undefined
	const { data: ensName } = useEnsName({
		address: ensAddress,
		chainId: mainnet.id,
	})
	const { data: ensAvatar } = useEnsAvatar({
		name: ensName ?? undefined,
		chainId: mainnet.id,
	})

	return {
		ensName: ensName ?? undefined,
		ensAvatar: ensAvatar ?? undefined,
	}
}
```

## Utilities

Create `lib/format.ts`:

```typescript
export function truncateAddress(address: string): string {
	return `${address.slice(0, 6)}…${address.slice(-4)}`
}
```

## Authentication Context

This is the core of the frontend — a React context that manages the full SIWE authentication lifecycle. It handles session checking, sign-in (with auto sign-in when a wallet connects), error handling, and sign-out.

Create `hooks/useSiweAuth.tsx`:

```typescript
'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import { SiweMessage } from '@signinwithethereum/siwe'
import { useConnection, useDisconnect, useSignMessage } from 'wagmi'

interface SiweAuthState {
	user: string | null
	isLoading: boolean
	error: string | null
	signIn: () => Promise<void>
	signOut: () => Promise<void>
}

const SiweAuthContext = createContext<SiweAuthState | null>(null)

export function SiweAuthProvider({ children }: { children: ReactNode }) {
	const { address, chainId } = useConnection()
	const { mutate: disconnect } = useDisconnect()
	const { mutateAsync: signMessageAsync } = useSignMessage()
	const [user, setUser] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [hasCheckedSession, setHasCheckedSession] = useState(false)
	const autoSignInAttempted = useRef<string | null>(null)
	const signedOut = useRef(false)
	const signInRef = useRef<() => void>(() => {})

	// Check if already authenticated
	useEffect(() => {
		const controller = new AbortController()
		fetch('/api/me', { signal: controller.signal })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) setUser(data.address)
			})
			.catch(() => {})
			.finally(() => setHasCheckedSession(true))
		return () => controller.abort()
	}, [])

	const signIn = useCallback(async () => {
		if (!address || !chainId) return
		setIsLoading(true)

		try {
			setError(null)

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

			const messageString = message.prepareMessage()

			// 3. Request wallet signature
			const signature = await signMessageAsync({ message: messageString })

			// 4. Verify on backend
			const res = await fetch('/api/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageString, signature }),
			})

			if (res.ok) {
				const data = await res.json()
				setUser(data.address)
				signedOut.current = false
			}
		} catch (err) {
			const e = err as { name?: string; code?: number; message?: string }
			const rejected =
				e.name === 'UserRejectedRequestError' ||
				e.code === 4001 ||
				e.message?.includes('reject')
			if (rejected) {
				setError('Signature rejected')
			} else if (e.message) {
				setError(e.message)
			} else {
				setError('Sign-in failed')
			}
		} finally {
			setIsLoading(false)
		}
	}, [address, chainId, signMessageAsync])

	signInRef.current = signIn

	// Reset auto sign-in guard when wallet fully disconnects
	useEffect(() => {
		if (!address) {
			autoSignInAttempted.current = null
			signedOut.current = false
		}
	}, [address])

	// Auto sign-in when wallet connects and no existing session
	useEffect(() => {
		if (
			hasCheckedSession &&
			address &&
			chainId &&
			!user &&
			!isLoading &&
			!signedOut.current &&
			autoSignInAttempted.current !== address
		) {
			autoSignInAttempted.current = address
			signInRef.current()
		}
	}, [hasCheckedSession, address, chainId, user, isLoading])

	const signOut = useCallback(async () => {
		signedOut.current = true
		await fetch('/api/logout', { method: 'POST' })
		setUser(null)
		disconnect()
	}, [disconnect])

	const value: SiweAuthState = { user, isLoading, error, signIn, signOut }

	return (
		<SiweAuthContext.Provider value={value}>
			{children}
		</SiweAuthContext.Provider>
	)
}

export function useSiweAuth(): SiweAuthState {
	const ctx = useContext(SiweAuthContext)
	if (!ctx) throw new Error('useSiweAuth must be used within SiweAuthProvider')
	return ctx
}
```

A few things to note:

- **Auto sign-in** — when a wallet connects and there's no existing session, the provider automatically initiates the SIWE sign-in flow. The `autoSignInAttempted` ref prevents double-firing.
- **User rejection** — if the user rejects the wallet signature prompt (code 4001), a friendly "Signature rejected" message is shown instead of a generic error.
- **Sign-out cleanup** — signing out destroys the server session _and_ disconnects the wallet. The `signedOut` ref prevents auto sign-in from re-triggering immediately.

## Components

### Navigation

Create `components/Nav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSiweAuth } from '@/hooks/useSiweAuth'

export function Nav() {
	const pathname = usePathname()
	const { user } = useSiweAuth()

	return (
		<nav>
			<Link href="/" className={pathname === '/' ? 'active' : ''}>
				Home
			</Link>
			{user && (
				<Link
					href="/dashboard"
					className={pathname === '/dashboard' ? 'active' : ''}
				>
					Dashboard
				</Link>
			)}
		</nav>
	)
}
```

### User Card

Displays the authenticated user's ENS name/avatar (or truncated address as fallback) and a sign-out button.

Create `components/UserCard.tsx`:

```typescript
'use client'

import Image from 'next/image'
import { useEnsIdentity } from '@/hooks/useEnsIdentity'
import { truncateAddress } from '@/lib/format'

export function UserCard({
	address,
	avatarSize = 48,
	onSignOut,
}: {
	address: string
	avatarSize?: number
	onSignOut: () => void
}) {
	const { ensName, ensAvatar } = useEnsIdentity(address)

	return (
		<div className="card">
			{ensAvatar && (
				<Image
					src={ensAvatar}
					alt={ensName ?? address}
					width={avatarSize}
					height={avatarSize}
					unoptimized
					style={{ borderRadius: '50%' }}
				/>
			)}
			<p>
				Signed in as <strong>{ensName ?? truncateAddress(address)}</strong>
			</p>
			<p className="address">{address}</p>
			<button onClick={onSignOut}>Sign out</button>
		</div>
	)
}
```

:::tip
The `unoptimized` prop on `Image` is needed because ENS avatars can come from any domain. Add a wildcard to `next.config.ts` to allow remote images:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [{ protocol: 'https', hostname: '**' }],
	},
}

export default nextConfig
```
:::

### Sign-In UI

A thin wrapper that shows the sign-in button (when connected but not authenticated) or the `UserCard` (when authenticated).

Create `components/SiweAuth.tsx`:

```typescript
'use client'

import { useConnection } from 'wagmi'
import { useMounted } from '@/hooks/useMounted'
import { useSiweAuth } from '@/hooks/useSiweAuth'
import { UserCard } from '@/components/UserCard'

export function SiweAuth() {
	const mounted = useMounted()
	const { isConnected } = useConnection()
	const { user, isLoading, error, signIn, signOut } = useSiweAuth()

	if (!mounted || !isConnected) return null

	if (user) {
		return <UserCard address={user} onSignOut={signOut} />
	}

	return (
		<div className="card">
			<button onClick={signIn} disabled={isLoading}>
				{isLoading ? 'Signing in…' : 'Sign in with Ethereum'}
			</button>
			{error && <p className="error">{error}</p>}
		</div>
	)
}
```

## Wiring It Together

### Providers

Create `app/providers.tsx` — this wraps the app with wagmi, React Query, and the SIWE auth context:

```typescript
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { SiweAuthProvider } from '@/hooks/useSiweAuth'

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient())

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<SiweAuthProvider>{children}</SiweAuthProvider>
			</QueryClientProvider>
		</WagmiProvider>
	)
}
```

### Root Layout

Update `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Providers } from './providers'
import { Nav } from '@/components/Nav'
import './globals.css'

export const metadata: Metadata = {
	title: 'SIWE Quickstart',
	description: 'Sign in with Ethereum demo app',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<Nav />
					{children}
				</Providers>
			</body>
		</html>
	)
}
```

## Pages

### Home

Update `app/page.tsx` — when unauthenticated, shows wallet connectors and the sign-in flow. When authenticated, links to the dashboard:

```typescript
'use client'

import Link from 'next/link'
import { useConnection, useConnect, useConnectors } from 'wagmi'
import { SiweAuth } from '@/components/SiweAuth'
import { useMounted } from '@/hooks/useMounted'
import { useSiweAuth } from '@/hooks/useSiweAuth'

function ConnectWallet() {
	const { isConnected } = useConnection()
	const connectors = useConnectors()
	const { mutate: connect, isPending, variables } = useConnect()
	const mounted = useMounted()

	if (!mounted || isConnected) return null

	return (
		<div className="card">
			<p className="card-label">Connect a wallet</p>
			<div className="connectors">
				{connectors.map((connector) => (
					<button
						key={connector.uid}
						onClick={() => connect({ connector })}
						disabled={isPending}
					>
						{isPending && variables?.connector === connector
							? 'Connecting…'
							: connector.name}
					</button>
				))}
			</div>
		</div>
	)
}

export default function Home() {
	const { user } = useSiweAuth()

	return (
		<main>
			<h1>SIWE Demo</h1>
			{user ? (
				<p>
					Welcome back → <Link href="/dashboard">Dashboard</Link>
				</p>
			) : (
				<>
					<ConnectWallet />
					<SiweAuth />
				</>
			)}
		</main>
	)
}
```

The `ConnectWallet` component renders a button for each available connector (e.g. "MetaMask", "WalletConnect"). Once connected, the `SiweAuth` component takes over and automatically prompts for a signature.

### Protected Dashboard

The dashboard is protected by **two layers**: a server-side layout that redirects unauthenticated users, and a client-side effect as a fallback.

Create `app/dashboard/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getSession()

	if (!session.address) {
		redirect('/')
	}

	return <>{children}</>
}
```

Create `app/dashboard/page.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSiweAuth } from '@/hooks/useSiweAuth'
import { UserCard } from '@/components/UserCard'

export default function Dashboard() {
	const router = useRouter()
	const { user, signOut } = useSiweAuth()

	useEffect(() => {
		if (!user) router.push('/')
	}, [user, router])

	return (
		<main>
			<h1>Secret Dashboard</h1>
			{user && <UserCard address={user} avatarSize={64} onSignOut={signOut} />}
		</main>
	)
}
```

## Styles

Replace `app/globals.css`:

```css
* {
	box-sizing: border-box;
	padding: 0;
	margin: 0;
}

body {
	font-family:
		system-ui,
		-apple-system,
		sans-serif;
	padding: 0;
}

nav {
	display: flex;
	gap: 1rem;
	padding: 1rem 2rem;
	border-bottom: 1px solid #eee;
	margin-bottom: 1rem;
}

nav a {
	text-decoration: none;
	color: #555;
	font-size: 0.875rem;
	font-weight: 500;
	padding: 0.25rem 0;
}

nav a:hover {
	color: #000;
}

nav a.active {
	color: #000;
	border-bottom: 2px solid #000;
}

main {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 1rem;
	max-width: 600px;
	padding: 0 2rem;
}

button {
	cursor: pointer;
	padding: 0.5rem 1rem;
	border: 1px solid #ccc;
	border-radius: 6px;
	background: #fff;
	font-size: 0.875rem;
}

button:hover {
	background: #f5f5f5;
}

button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.error {
	color: #d33;
	font-size: 0.875rem;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	align-items: flex-start;
	border: 1px solid #ccc;
	border-radius: 6px;
	padding: 1rem;
}

.card-label {
	color: #555;
	font-size: 0.875rem;
	font-weight: 500;
}

.connectors {
	display: flex;
	gap: 0.5rem;
}

.address {
	color: #888;
	font-size: 0.75rem;
	font-family: monospace;
	word-break: break-all;
}
```

## Next Steps

- [Backend](backend) — set up the API routes that handle nonce generation, verification, and sessions
- [TypeScript Library Reference](/libraries/typescript) — full API documentation
- [Security Considerations](/security-considerations) — production security best practices
