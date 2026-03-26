# Client Setup

## Reference Client

The [`@signinwithethereum/oidc-client`](https://github.com/signinwithethereum/oidc-client) is a reference Nuxt 4 application that demonstrates the complete OIDC flow with the SIWE provider.

## Quick Start

Start the [OIDC provider](deployment-guide) first (port 3000), then:

```bash
git clone https://github.com/signinwithethereum/oidc-client
cd oidc-client
pnpm install
cp .env.example .env
pnpm dev
```

The client runs at `http://localhost:3001`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NUXT_SESSION_SECRET` | Encryption key for session cookies (min 32 chars) | _required_ |
| `NUXT_OIDC_ISSUER` | URL of the OIDC provider | `http://localhost:3000` |
| `NUXT_OIDC_REDIRECT_URI` | OAuth callback URL | `http://localhost:3001/api/auth/callback` |
| `NUXT_OIDC_SCOPE` | Requested OIDC scopes | `openid profile` |
| `NUXT_OIDC_CLIENT_NAME` | Display name shown on the provider's login page | `Example OIDC Client` |
| `NUXT_OIDC_CLIENT_URI` | Client homepage URL | `http://localhost:3001` |
| `NUXT_OIDC_LOGO_URI` | Client logo URL | `http://localhost:3001/client-logo.png` |
| `NUXT_OIDC_POLICY_URI` | Privacy policy URL | — |
| `NUXT_OIDC_TOS_URI` | Terms of service URL | — |
| `NUXT_OIDC_CONTACTS` | Admin contact emails (comma-separated) | — |

`NUXT_OIDC_CLIENT_ID` and `NUXT_OIDC_CLIENT_SECRET` are optional — the client registers itself automatically via the provider's `/reg` endpoint on first use.

## Auto-Registration

The reference client uses [dynamic client registration](https://openid.net/specs/openid-connect-registration-1_0.html) to automatically register itself with the provider. On the first request:

1. The client fetches the provider's discovery document from `{issuer}/.well-known/openid-configuration`
2. It sends a registration request to the provider's `/reg` endpoint with `redirect_uris`, `client_name`, `logo_uri`, etc.
3. The provider returns a `client_id` (no `client_secret` needed — the client is a public client)
4. Subsequent requests reuse the registered `client_id`

## Auth Composable

The client provides a `useAuth()` composable for Vue components:

```typescript
const { user, login, logout, fetchUser } = useAuth()

// user.value contains:
// {
//   sub: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95',
//   preferredUsername: 'vitalik.eth',  // ENS name or address
//   picture: 'https://...'            // ENS avatar URL
// }
```

| Method | Description |
|--------|-------------|
| `login()` | Redirects to `/api/auth/login` which initiates the OIDC flow |
| `logout()` | Redirects to `/api/auth/logout` which clears the session and calls the provider's end-session endpoint |
| `fetchUser()` | Calls `/api/auth/me` to get the current user from the session |

## Server Routes

| Route | Description |
|-------|-------------|
| `GET /api/auth/login` | Generates state + PKCE verifier, stores in session, redirects to provider's `/auth` |
| `GET /api/auth/callback` | Handles the provider redirect: validates state, exchanges auth code for tokens, creates session |
| `GET /api/auth/me` | Returns the current authenticated user from the session |
| `GET /api/auth/logout` | Clears the session and redirects to the provider's `end_session_endpoint` |

## Security

- **PKCE** (S256) for the authorization code exchange
- **State parameter** for CSRF protection
- **Encrypted sessions** via `NUXT_SESSION_SECRET`
- **Public client** (`token_endpoint_auth_method: none`) — no client secret stored or transmitted

## Building Your Own Client

Any standard OIDC client library works with the SIWE OIDC provider. Configure your client with:

| Setting | Value |
|---------|-------|
| Issuer / Discovery URL | `{provider_url}/.well-known/openid-configuration` |
| Authorization Endpoint | `{provider_url}/auth` |
| Token Endpoint | `{provider_url}/token` |
| UserInfo Endpoint | `{provider_url}/me` |
| Registration Endpoint | `{provider_url}/reg` (for dynamic registration) |
| Scopes | `openid profile` (optionally `siwe` for raw signature data) |
| Response Type | `code` |
| Token Auth Method | `none` (public client) or `client_secret_basic` |

Popular OIDC client libraries:

- **Node.js**: [openid-client](https://github.com/panva/node-openid-client)
- **Python**: [Authlib](https://authlib.org/)
- **Go**: [coreos/go-oidc](https://github.com/coreos/go-oidc)
- **Ruby**: [omniauth_openid_connect](https://github.com/omniauth/omniauth_openid_connect)

## Production

```bash
pnpm build
node .output/server/index.mjs
```
