# Sign in with Ethereum

**Sign in with Ethereum** (SIWE) is an authentication method for Ethereum accounts. It can be used by any kind of app, whether crypto-related or not.

## Key Benefits

### 🤝 **Complements other elements of the Ethereum Identity Stack**

After the user authenticates, apps may use their onchain **[ENS](https://ens.domains)** username and profile and **[EFP](https://efp.app)** social graph.

### [⛓️ **Enrich your app's UX with onchain data**](./quickstart/retrieve-onchain-data.mdx)

Seamlessly connects user identity with onchain activities, enabling applications to verify user ownership of NFTs, tokens, and other blockchain assets.

### 🛡️ **Self-Sovereign Identity**

Users maintain control over their identity credentials, eliminating dependency on centralized identity providers like Google or Facebook.

### 🖊️ **Single Sign-On**

Works across any application that implements the SIWE standard, creating a unified authentication and account experience.


## How It Works

SIWE follows a simple authentication flow:

1. **Message Creation**: Application generates a human-readable sign-in message containing domain, address, and security parameters, following the [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) standard.
2. **User Signing**: User signs the message with the Ethereum wallet of their choice.
3. **Signature Verification**: Application verifies the signature cryptographically to authenticate the user.
4. **Session Establishment**: Upon successful verification, a secure session is created for the authenticated user.

## Open EIP standard

SIWE is defined by **[EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)** standard.

## Getting Started

Ready to implement SIWE in your application? Here are some quick paths forward:

### 🚀 **Quick Start**

Follow our [Quickstart Guide](quickstart/index.md) for a step-by-step tutorial on implementing SIWE from scratch.

### 📚 **Choose Your Library**

We provide official libraries for multiple programming languages:

-   [TypeScript](libraries/typescript)
-   [Rust](libraries/rust)
-   [Python](libraries/python)
-   [Ruby](libraries/ruby)
-   [Go](libraries/go)
-   [Elixir](libraries/elixir)

### 🪪 **Ethereum Identity Kit component library and API**

We offer the [Ethereum Identity Kit](https://ethidentitykit.com/) component library and API to help you integrate SIWE and the rest of the Ethereum identity stack.

### 🔌 **Pre-built Integrations**

Get started quickly with existing integrations:

-   [NextAuth.js](./integrations/nextauth.js.mdx)
-   [Auth0](./integrations/auth0.mdx)
-   [Discourse](./integrations/discourse)

## Security First

SIWE prioritizes security through:

-   **Nonce-based replay protection** to prevent message reuse attacks
-   **Domain binding** to prevent cross-site message abuse
-   **Expiration timestamps** for time-limited authentication
-   **Best practices guidance** for secure implementation

Learn more about [Security Best Practices](/security-considerations).

## Enterprise Ready

For enterprise applications, SIWE provides:

-   **[OpenID Connect (OIDC) Provider](./oidc-provider/index.mdx)** for standards-compliant integration
-   **Scalable authentication** supporting millions of users
-   **Compliance-friendly** audit trails and security controls
-   **Professional support** and deployment guidance

Learn more about [OpenID Connect Integration](/integrations/auth0).

## Community & Support

SIWE is an open-source project with an active community:

-   **GitHub**: [Contribute to the project and report issues](https://github.com/signinwithethereum/)
-   **Twitter**: Follow [@signinethereum](https://twitter.com/signinethereum) for updates

Explore the [Integrations](integrations/index.md) section to see SIWE implementations in production.

## Standards Compliance

SIWE fully complies with:

-   [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361): Sign in with Ethereum specification
-   [OpenID Connect](oidc-provider/index.mdx) 1.0 for enterprise integration
-   [OAuth 2.0](integrations/auth0.mdx) for authorization flows
-   Web3 wallet standards for broad compatibility
