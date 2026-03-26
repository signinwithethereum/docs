# Deployment Guide

## Prerequisites

- **Node.js** 22+
- **Redis** instance
- **pnpm** package manager

## Local Development

```bash
git clone https://github.com/signinwithethereum/oidc-provider
cd oidc-provider
pnpm install
cp .env.example .env
pnpm dev
```

The provider starts at `http://localhost:3000`.

## Docker Compose

The simplest way to deploy the provider with Redis:

```yaml
services:
  siwe-oidc:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NUXT_OIDC_BASE_URL=${NUXT_OIDC_BASE_URL:-http://localhost:3000}
      - NUXT_OIDC_REDIS_URL=${NUXT_OIDC_REDIS_URL:-redis://redis:6379}
      - NUXT_OIDC_COOKIE_KEYS=${NUXT_OIDC_COOKIE_KEYS:-}
      - NUXT_OIDC_RSA_PEM=${NUXT_OIDC_RSA_PEM:-}
      - NUXT_OIDC_REQUIRE_SECRET=${NUXT_OIDC_REQUIRE_SECRET:-false}
      - NUXT_OIDC_ETH_PROVIDER=${NUXT_OIDC_ETH_PROVIDER:-}
      - NUXT_OIDC_DEFAULT_CLIENTS=${NUXT_OIDC_DEFAULT_CLIENTS:-}
      - NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID=${NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID:-}
      - NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS=${NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS:-}
    depends_on:
      redis:
        condition: service_healthy

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5
```

```bash
docker compose up
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NUXT_OIDC_BASE_URL` | Public issuer URL (must match the `iss` claim in tokens) | `http://localhost:3000` |
| `NUXT_OIDC_REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `NUXT_OIDC_COOKIE_KEYS` | Cookie signing keys (comma-separated, at least one required) | _required_ |
| `NUXT_OIDC_RSA_PEM` | RSA private key in PEM format for JWT signing | auto-generated |
| `NUXT_OIDC_REQUIRE_SECRET` | Enforce `client_secret_basic` for the token endpoint | `false` |
| `NUXT_OIDC_ETH_PROVIDER` | Ethereum RPC URL for ENS resolution. Can be a plain URL for mainnet or a JSON map of `chainId → URL` for multi-chain | public default |
| `NUXT_OIDC_DEFAULT_CLIENTS` | Pre-configured clients as JSON (see below) | `{}` |
| `NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID for the login page | — |
| `NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS` | Ethereum mainnet RPC URLs | — |

## Default Clients

Pre-register clients so they don't need to call `/reg`:

```bash
# Simple: client_id → redirect_uri
NUXT_OIDC_DEFAULT_CLIENTS='{"my-app": "https://myapp.com/callback"}'

# Rich: with display metadata shown on the login page
NUXT_OIDC_DEFAULT_CLIENTS='{
  "my-app": {
    "redirect_uri": "https://myapp.com/callback",
    "client_name": "My App",
    "logo_uri": "https://myapp.com/logo.png",
    "client_uri": "https://myapp.com",
    "policy_uri": "https://myapp.com/privacy",
    "tos_uri": "https://myapp.com/terms"
  }
}'
```

## Multi-Chain ENS Resolution

To resolve ENS on a specific chain or support multiple chains:

```bash
# Single chain (mainnet)
NUXT_OIDC_ETH_PROVIDER=https://eth.llamarpc.com

# Multi-chain (JSON map)
NUXT_OIDC_ETH_PROVIDER='{"1": "https://eth.llamarpc.com", "10": "https://optimism-rpc.com"}'
```

## Custom RSA Signing Key

By default, the provider auto-generates an RSA key and stores it in Redis (shared safely across workers). For production, you can provide your own:

```bash
# Generate RSA private key
openssl genrsa -out private.pem 2048

# Use in deployment
export NUXT_OIDC_RSA_PEM=$(cat private.pem)
```

## Production Checklist

- [ ] **HTTPS**: Set `NUXT_OIDC_BASE_URL` to an `https://` URL
- [ ] **Cookie keys**: Set strong, unique `NUXT_OIDC_COOKIE_KEYS`
- [ ] **RSA key**: Provide a persistent `NUXT_OIDC_RSA_PEM` (or ensure Redis data persists across restarts)
- [ ] **Redis persistence**: Enable Redis AOF or RDB for session durability
- [ ] **WalletConnect**: Set `NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID` for mobile wallet support
- [ ] **ENS**: Configure `NUXT_OIDC_ETH_PROVIDER` with a reliable RPC endpoint
- [ ] **Monitoring**: Health-check `/.well-known/openid-configuration` returns 200

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm typecheck    # Type check
pnpm format       # Format with Prettier
pnpm build        # Production build
```
