# Frontend

This guide sets up a Next.js app with wallet connection and SIWE message signing using wagmi, viem, and RainbowKit.

## Project Setup

```bash
npx create-next-app@latest siwe-app --typescript --app
cd siwe-app
npm install @signinwithethereum/siwe wagmi viem @tanstack/react-query @rainbow-me/rainbowkit
```

Here's what each package does:

| Package | Why |
|---------|-----|
| `@signinwithethereum/siwe` | Creates and parses [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) messages |
| `wagmi` | React hooks for wallet connection, signing, and chain/account state |
| `viem` | Low-level Ethereum library that wagmi is built on — handles RPC calls and signature encoding |
| `@tanstack/react-query` | Caching layer that wagmi requires for managing async wallet state |
| `@rainbow-me/rainbowkit` | Pre-built wallet connection modal UI — handles wallet detection, QR codes, and account switching so you don't have to |

## Wagmi Configuration

Create `lib/wagmi.ts`:

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
	appName: 'SIWE App',
	projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
	chains: [mainnet, sepolia],
})
```

:::tip
Get a free WalletConnect project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com). Add it to `.env.local`:

```
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id
```
:::

## Providers

Create `app/providers.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	)
}
```

Wrap your app in `app/layout.tsx`:

```typescript
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
```

## SIWE Sign-In Component

Create `components/SiweAuth.tsx`:

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'
import { SiweMessage } from '@signinwithethereum/siwe'
import { useAccount, useSignMessage } from 'wagmi'

export function SiweAuth() {
	const { address, chainId, isConnected } = useAccount()
	const { signMessageAsync } = useSignMessage()
	const [user, setUser] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	// Check if already authenticated
	useEffect(() => {
		fetch('/api/me')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => data && setUser(data.address))
	}, [])

	const signIn = useCallback(async () => {
		if (!address || !chainId) return
		setIsLoading(true)

		try {
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
			}
		} finally {
			setIsLoading(false)
		}
	}, [address, chainId, signMessageAsync])

	const signOut = useCallback(async () => {
		await fetch('/api/logout', { method: 'POST' })
		setUser(null)
	}, [])

	if (!isConnected) return null

	if (user) {
		return (
			<div>
				<p>Signed in as {user}</p>
				<button onClick={signOut}>Sign out</button>
			</div>
		)
	}

	return (
		<button onClick={signIn} disabled={isLoading}>
			{isLoading ? 'Signing in…' : 'Sign in with Ethereum'}
		</button>
	)
}
```

## Home Page

Update `app/page.tsx`:

```typescript
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SiweAuth } from '@/components/SiweAuth'

export default function Home() {
	return (
		<main>
			<h1>SIWE Demo</h1>
			<ConnectButton />
			<SiweAuth />
		</main>
	)
}
```

## Next Steps

- [Backend](backend) — set up the API routes that handle nonce generation, verification, and sessions
- [TypeScript Library Reference](/libraries/typescript) — full API documentation
- [Security Considerations](/security-considerations) — production security best practices
