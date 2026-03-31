# Quickstart

Clone the [siwe-quickstart](https://github.com/signinwithethereum/siwe-quickstart) repo and run it locally to see Sign in with Ethereum in action — wallet connection, message signing, server-side verification, and session management in a single Next.js app.

## Get Started

```bash
git clone https://github.com/signinwithethereum/siwe-quickstart
cd siwe-quickstart
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect a wallet, and sign in.

### Environment Variables

The only required variable is `SESSION_SECRET` (at least 32 characters). The defaults work out of the box for local development:

| Variable | Required | Purpose |
|----------|----------|---------|
| `SESSION_SECRET` | Yes | Encrypts session cookies |
| `NEXT_PUBLIC_WC_PROJECT_ID` | No | Enables WalletConnect (get one free at [cloud.walletconnect.com](https://cloud.walletconnect.com)) |
| `ETH_RPC_URL` | No | Server-side RPC for signature verification and ENS resolution (defaults to a public RPC) |
| `NEXT_PUBLIC_DOMAIN` | No | Explicit domain for SIWE verification when behind a reverse proxy |

## How It Works

The app follows a standard SIWE authentication flow:

1. User connects their wallet (MetaMask, WalletConnect, etc.)
2. Frontend requests a **nonce** from the server
3. Frontend constructs a [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) message and asks the wallet to sign it
4. Frontend sends the message + signature to the server
5. Server **verifies** the signature, checks the nonce, and creates an encrypted session
6. User is authenticated — their Ethereum address is the identity

The next two pages walk through how this is implemented:

- **[Frontend](frontend)** — wagmi setup, the authentication context, and the sign-in flow
- **[Backend](backend)** — API routes for nonce, verification, sessions, and how `verify()` works under the hood

## Stack

| Layer | Library |
|-------|---------|
| SIWE | [`@signinwithethereum/siwe`](https://github.com/signinwithethereum/siwe) v4 |
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Wallet hooks | [wagmi](https://wagmi.sh) + [viem](https://viem.sh) |
| Wallet connectors | Injected (MetaMask, etc.) + [WalletConnect](https://walletconnect.com) |
| Sessions | [iron-session](https://github.com/vvo/iron-session) |

## Getting Help

- **Documentation**: [TypeScript Library](/libraries/typescript)
- **Issues**: [GitHub](https://github.com/signinwithethereum/siwe)
- **Integrations**: [NextAuth.js, Auth0, Discourse](../integrations/index.md)
