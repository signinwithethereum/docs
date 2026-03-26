# API Reference

## OIDC Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/openid-configuration` | GET | OIDC discovery document |
| `/auth` | POST | Authorization endpoint |
| `/token` | POST | Token exchange |
| `/jwks` | GET | JSON Web Key Set |
| `/me` | GET | UserInfo endpoint |
| `/reg` | POST | Dynamic client registration |
| `/token/introspection` | POST | Token introspection |
| `/token/revocation` | POST | Token revocation |
| `/session/end` | POST | RP-Initiated Logout |
| `/interaction/{uid}` | GET | Get interaction details (nonce, client metadata) |
| `/interaction/{uid}` | POST | Submit SIWE signature for verification |

## Scopes

| Scope | Description |
|-------|-------------|
| `openid` | Required. Returns `sub` claim with the user's Ethereum identity |
| `profile` | Returns ENS name (`preferred_username`) and avatar (`picture`) |
| `siwe` | Returns the raw SIWE message and signature used for authentication |

## Identity Claims

| Claim | Source | Scope |
|-------|--------|-------|
| `sub` | `eip155:{chainId}:{checksumAddress}` | `openid` |
| `preferred_username` | ENS name (if set) or Ethereum address | `profile` |
| `picture` | ENS avatar URL (if set) | `profile` |
| `siwe_message` | Original SIWE message text | `siwe` |
| `siwe_signature` | Hex-encoded cryptographic signature | `siwe` |

The `sub` claim uses the [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md) account ID format: `eip155:{chainId}:{checksumAddress}`. For example: `eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95`.

## Dynamic Client Registration

Register a new client by sending a POST request to `/reg`:

```bash
curl -X POST http://localhost:3000/reg \
  -H 'Content-Type: application/json' \
  -d '{"redirect_uris": ["https://myapp.com/callback"]}'
```

Response:

```json
{
  "client_id": "5e06b7ec-4202-4eea-86f9-9aeed30a460d",
  "registration_access_token": "sEC5pfNmh...",
  "registration_client_uri": "http://localhost:3000/reg/5e06b7ec-4202-4eea-86f9-9aeed30a460d",
  "redirect_uris": ["https://myapp.com/callback"]
}

```

You can include optional metadata in the registration request:

```json
{
  "redirect_uris": ["https://myapp.com/callback"],
  "client_name": "My App",
  "logo_uri": "https://myapp.com/logo.png",
  "client_uri": "https://myapp.com",
  "policy_uri": "https://myapp.com/privacy",
  "tos_uri": "https://myapp.com/terms"
}
```

Alternatively, pre-register clients via the `NUXT_OIDC_DEFAULT_CLIENTS` environment variable (see [Deployment Guide](deployment-guide#default-clients)).

## Token TTLs

| Token Type | TTL |
|------------|-----|
| Authorization Code | 60 seconds |
| Access Token | 1 hour |
| ID Token | 1 hour |
| Session | 24 hours |
| Grant | 24 hours |
| Interaction | 10 minutes |

## Interaction Flow

The provider uses a web-based interaction flow for SIWE authentication:

1. **Authorization request** — client redirects user to `/auth` with standard OIDC parameters
2. **Interaction page** — provider creates an interaction session and renders a wallet-connect UI
3. **SIWE signing** — the user connects their wallet and signs a SIWE message. The interaction UID is hex-encoded and used as the SIWE nonce (to stay EIP-4361 compliant with the alphanumeric requirement)
4. **Signature verification** — provider verifies the SIWE signature using `@signinwithethereum/siwe` v4, supporting EOA, EIP-1271, and EIP-6492 signatures
5. **Token issuance** — on success, the provider creates an account ID (`eip155:{chainId}:{address}`), resolves ENS data, and redirects back to the client with an authorization code

## Supported OIDC Features

- Authorization Code flow with PKCE (S256)
- Dynamic Client Registration ([RFC 7591](https://tools.ietf.org/html/rfc7591))
- Token Introspection ([RFC 7662](https://tools.ietf.org/html/rfc7662))
- Token Revocation ([RFC 7009](https://tools.ietf.org/html/rfc7009))
- RP-Initiated Logout ([OpenID Connect RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html))
- UserInfo endpoint
- RS256 signing algorithm
