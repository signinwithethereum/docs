# 🖥️ Hosted OIDC Provider

The Sign in with Ethereum project offers a **hosted OpenID Connect (OIDC) Provider** that provides enterprise-grade SIWE authentication without the complexity of self-hosting. This service is supported by the ENS DAO under EP-10 and offers a production-ready solution for developers.

## Service Overview

### 🌐 **Hosted Service URL**

```
https://oidc.signinwithethereum.org
```

### 🏢 **Enterprise Features**

-   **High Availability**: 99.9% uptime SLA
-   **Global Distribution**: Multi-region deployment
-   **Automatic Scaling**: Handles traffic spikes seamlessly
-   **Security Monitoring**: 24/7 security monitoring and updates
-   **Compliance**: SOC 2 and security best practices

### 💰 **Cost**

The hosted OIDC provider is currently **free to use** for all developers, supported by the ENS DAO grant.

## Quick Start

### 1. Discover Provider Configuration

Retrieve the OpenID Connect configuration:

```bash
curl https://oidc.signinwithethereum.org/.well-known/openid-configuration
```

**Response:**

```json
{
	"issuer": "https://oidc.signinwithethereum.org",
	"authorization_endpoint": "https://oidc.signinwithethereum.org/auth",
	"token_endpoint": "https://oidc.signinwithethereum.org/token",
	"userinfo_endpoint": "https://oidc.signinwithethereum.org/userinfo",
	"jwks_uri": "https://oidc.signinwithethereum.org/.well-known/jwks.json",
	"registration_endpoint": "https://oidc.signinwithethereum.org/register",
	"scopes_supported": ["openid", "profile"],
	"response_types_supported": ["code", "id_token", "token id_token"],
	"subject_types_supported": ["public"],
	"id_token_signing_alg_values_supported": ["RS256"],
	"token_endpoint_auth_methods_supported": [
		"client_secret_basic",
		"client_secret_post",
		"private_key_jwt"
	]
}
```

### 2. Register Your Client

Register your application with the OIDC provider:

```bash
curl -X POST https://oidc.signinwithethereum.org/register \
  -H 'Content-Type: application/json' \
  -d '{
    "redirect_uris": ["https://yourapp.com/callback"],
    "client_name": "Your Application Name",
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

**Response:**

```json
{
	"client_id": "generated-client-id",
	"client_secret": "generated-client-secret",
	"client_name": "Your Application Name",
	"redirect_uris": ["https://yourapp.com/callback"],
	"token_endpoint_auth_method": "client_secret_basic",
	"registration_access_token": "access-token-for-updates",
	"registration_client_uri": "https://oidc.signinwithethereum.org/register/client-id"
}
```

**⚠️ Important**: Save the `client_secret` and `registration_access_token` securely - they cannot be retrieved later.

## Client Registration

### Registration Options

#### Basic Registration

```json
{
	"redirect_uris": ["https://yourapp.com/callback"],
	"client_name": "My SIWE App"
}
```

#### Advanced Registration

```json
{
	"redirect_uris": [
		"https://yourapp.com/callback",
		"https://yourapp.com/silent-callback"
	],
	"client_name": "My SIWE App",
	"client_uri": "https://yourapp.com",
	"logo_uri": "https://yourapp.com/logo.png",
	"policy_uri": "https://yourapp.com/privacy",
	"tos_uri": "https://yourapp.com/terms",
	"token_endpoint_auth_method": "client_secret_basic",
	"response_types": ["code"],
	"grant_types": ["authorization_code"],
	"scope": "openid profile"
}
```

### Client Management

#### Update Client Configuration

```bash
curl -X PUT https://oidc.signinwithethereum.org/register/YOUR_CLIENT_ID \
  -H 'Authorization: Bearer YOUR_REGISTRATION_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Updated App Name",
    "redirect_uris": ["https://yourapp.com/new-callback"]
  }'
```

#### Retrieve Client Information

```bash
curl https://oidc.signinwithethereum.org/register/YOUR_CLIENT_ID \
  -H 'Authorization: Bearer YOUR_REGISTRATION_ACCESS_TOKEN'
```

## Authentication Flow

### 1. Authorization Request

Redirect users to the authorization endpoint:

```javascript
const params = new URLSearchParams({
	response_type: 'code',
	client_id: 'your-client-id',
	redirect_uri: 'https://yourapp.com/callback',
	scope: 'openid profile',
	state: 'random-state-value',
})

window.location.href = `https://oidc.signinwithethereum.org/auth?${params}`
```

### 2. SIWE Authentication

Users will be presented with the SIWE authentication flow:

1. **Connect Wallet**: User connects their Ethereum wallet
2. **Generate Message**: System creates SIWE message
3. **Sign Message**: User signs with their wallet
4. **Verify Signature**: System verifies the signature

### 3. Authorization Callback

After successful authentication, users are redirected back with an authorization code:

```
https://yourapp.com/callback?code=AUTH_CODE&state=random-state-value
```

### 4. Token Exchange

Exchange the authorization code for tokens:

```javascript
const response = await fetch('https://oidc.signinwithethereum.org/token', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
	},
	body: new URLSearchParams({
		grant_type: 'authorization_code',
		code: 'AUTH_CODE',
		redirect_uri: 'https://yourapp.com/callback',
	}),
})

const tokens = await response.json()
```

**Response:**

```json
{
	"access_token": "access-token",
	"token_type": "Bearer",
	"expires_in": 3600,
	"id_token": "eyJ0eXAiOiJKV1Q...",
	"scope": "openid profile"
}
```

### 5. Extract User Information

Decode the ID token to get user information:

```javascript
// Decode JWT (use a proper JWT library in production)
const idToken = tokens.id_token
const payload = JSON.parse(atob(idToken.split('.')[1]))

console.log('Ethereum Address:', payload.sub)
console.log('Issued At:', new Date(payload.iat * 1000))
```

**ID Token Payload:**

```json
{
	"iss": "https://oidc.signinwithethereum.org",
	"sub": "0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890",
	"aud": "your-client-id",
	"exp": 1635696324,
	"iat": 1635692724,
	"auth_time": 1635692724
}
```

## Supported Features

### 🔐 **Scopes**

-   `openid` - Required for OIDC authentication
-   `profile` - Access to profile information (Ethereum address)

### 🔄 **Response Types**

-   `code` - Authorization code flow (recommended)
-   `id_token` - Implicit flow with ID token
-   `token id_token` - Implicit flow with access and ID tokens

### 🛡️ **Authentication Methods**

-   `client_secret_basic` - Credentials in Authorization header
-   `client_secret_post` - Credentials in request body
-   `private_key_jwt` - JWT assertion with private key

### ✅ **Grant Types**

-   `authorization_code` - Standard authorization code flow
-   `refresh_token` - Token refresh (if enabled)

### 🔑 **Signing Algorithms**

-   `RS256` - RSA signature with SHA-256

## Integration Examples

### JavaScript/Node.js

```javascript
const { Issuer, Client } = require('openid-client')

// Discover OIDC provider
const issuer = await Issuer.discover('https://oidc.signinwithethereum.org')

// Create client
const client = new issuer.Client({
	client_id: 'your-client-id',
	client_secret: 'your-client-secret',
	redirect_uris: ['https://yourapp.com/callback'],
	response_types: ['code'],
})

// Generate authorization URL
const authUrl = client.authorizationUrl({
	scope: 'openid profile',
	state: 'random-state-value',
})

// Handle callback
const tokenSet = await client.callback('https://yourapp.com/callback', {
	code: 'authorization-code',
	state: 'random-state-value',
})

console.log('Ethereum Address:', tokenSet.claims().sub)
```

### Python

```python
from authlib.integrations.flask_client import OAuth
from flask import Flask

app = Flask(__name__)
oauth = OAuth(app)

# Configure SIWE OIDC
siwe = oauth.register(
    name='siwe',
    client_id='your-client-id',
    client_secret='your-client-secret',
    server_metadata_url='https://oidc.signinwithethereum.org/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid profile'
    }
)

@app.route('/login')
def login():
    redirect_uri = url_for('callback', _external=True)
    return siwe.authorize_redirect(redirect_uri)

@app.route('/callback')
def callback():
    token = siwe.authorize_access_token()
    user_info = token['userinfo']
    ethereum_address = user_info['sub']
    return f'Welcome {ethereum_address}!'
```

## Service Limitations

### Rate Limits

-   **Registration**: 10 requests per minute per IP
-   **Authorization**: 60 requests per minute per IP
-   **Token Exchange**: 30 requests per minute per client

### Client Restrictions

-   Maximum 10 redirect URIs per client
-   Redirect URIs must use HTTPS (except localhost for development)
-   Client names must be under 100 characters

### Token Lifetimes

-   **Access Tokens**: 1 hour
-   **ID Tokens**: 1 hour
-   **Refresh Tokens**: 30 days (if enabled)

## Security Considerations

### 🔒 **Best Practices**

1. **Use Authorization Code Flow**: More secure than implicit flow
2. **Validate State Parameter**: Prevent CSRF attacks
3. **Verify ID Token**: Always validate JWT signatures
4. **Secure Client Secrets**: Never expose in client-side code
5. **Use HTTPS Only**: All redirect URIs must use HTTPS

### 🛡️ **Domain Requirements**

For security, the OIDC provider enforces same-origin policies:

✅ **Allowed**: `app.yourdomain.com` redirecting to `oidc.signinwithethereum.org`  
❌ **Blocked**: Cross-origin requests without proper CORS headers

### 🔐 **JWT Validation**

Always validate ID tokens:

```javascript
const jwt = require('jsonwebtoken')
const jwks = require('jwks-client')

const client = jwks({
	jwksUri: 'https://oidc.signinwithethereum.org/.well-known/jwks.json',
})

function getKey(header, callback) {
	client.getSigningKey(header.kid, (err, key) => {
		const signingKey = key.publicKey || key.rsaPublicKey
		callback(null, signingKey)
	})
}

// Verify token
jwt.verify(
	idToken,
	getKey,
	{
		issuer: 'https://oidc.signinwithethereum.org',
		audience: 'your-client-id',
	},
	(err, decoded) => {
		if (err) {
			console.error('Token validation failed:', err)
		} else {
			console.log('Valid token:', decoded)
		}
	}
)
```

## Support and SLA

### 📞 **Support Channels**

-   **Documentation**: This guide and API documentation
-   **GitHub Issues**: [siwe-oidc repository](https://github.com/spruceid/siwe-oidc/issues)
-   **Discord**: SIWE community Discord server

### 📊 **Service Level Agreement**

-   **Uptime**: 99.9% availability target
-   **Response Time**: < 200ms average for auth endpoints
-   **Support**: Community support via GitHub and Discord

### 🔔 **Status Updates**

-   Monitor service status at [status.signinwithethereum.org](https://status.signinwithethereum.org)
-   Subscribe to maintenance notifications

## Migration from Self-Hosted

If you're currently self-hosting and want to migrate:

### 1. Update Configuration

```javascript
// Old self-hosted configuration
const issuer = 'https://oidc.yourdomain.com'

// New hosted configuration
const issuer = 'https://oidc.signinwithethereum.org'
```

### 2. Re-register Clients

Client IDs from self-hosted instances won't work with the hosted service. You'll need to:

1. Register new clients with the hosted service
2. Update your application configurations
3. Migrate user sessions gradually

### 3. Update Redirect URIs

Ensure your redirect URIs are properly configured with the hosted service.

## Frequently Asked Questions

### Q: Is there a cost for using the hosted service?

A: The hosted OIDC provider is currently free for all users, supported by the ENS DAO grant.

### Q: Can I use this for production applications?

A: Yes, the hosted service is designed for production use with enterprise-grade reliability and security.

### Q: What happens to my data?

A: The service only stores minimal client registration data. User authentication is stateless - we don't store user data beyond the session duration.

### Q: Can I customize the authentication UI?

A: Currently, the authentication UI is standardized. For custom UI needs, consider [self-hosting](deployment-guide) the OIDC provider.

### Q: How do I report security issues?

A: Please report security issues privately to [security@spruceid.com](mailto:security@spruceid.com).

---

_Ready to integrate SIWE authentication? Start by [registering your client](#2-register-your-client) or explore our [integration examples](../../integrations)._
