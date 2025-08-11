# 🔑 Sign in with Ethereum

Welcome to the comprehensive documentation for **Sign in with Ethereum** (SIWE), a revolutionary authentication method that enables users to sign in to Web3 applications using their Ethereum accounts instead of traditional centralized identity providers.

## What is Sign in with Ethereum?

Sign in with Ethereum is a standardized authentication protocol that allows users to:

-   **Self-custody their identity** using Ethereum accounts
-   **Prove ownership** of blockchain identities through cryptographic signatures
-   **Authenticate securely** without relying on centralized providers
-   **Maintain privacy** while accessing decentralized applications

SIWE is built on the foundation of **[EIP-4361](general-information/eip-4361-specification.md)**, which standardizes how Ethereum accounts can be used as first-class identities for authentication and authorization in Web3 applications.

## Key Benefits

### 🔒 **Self-Sovereign Identity**

Users maintain complete control over their identity using Ethereum accounts, eliminating dependency on centralized identity providers like Google, Facebook, or Twitter.

### 🛡️ **Cryptographic Security**

Authentication relies on cryptographic signatures that prove ownership of Ethereum addresses, providing stronger security guarantees than traditional password-based systems.

### 🌐 **Universal Compatibility**

Works across any application that implements the SIWE standard, creating a unified authentication experience across the Web3 ecosystem.

### 🔗 **Blockchain Integration**

Seamlessly connects user identity with on-chain activities, enabling applications to verify user ownership of NFTs, tokens, and other blockchain assets.

## How It Works

SIWE follows a simple authentication flow:

1. **Message Creation**: Application generates a human-readable sign-in message containing domain, address, and security parameters
2. **User Signing**: User signs the message with their Ethereum wallet (MetaMask, WalletConnect, etc.)
3. **Signature Verification**: Application verifies the signature cryptographically to authenticate the user
4. **Session Establishment**: Upon successful verification, a secure session is created for the authenticated user

## Technical Foundation

SIWE is built on established Ethereum standards:

-   **[EIP-4361](general-information/eip-4361-specification.md)**: Core specification for Sign in with Ethereum messages
-   **EIP-191**: Signed Data Standard for message formatting
-   **EIP-712**: Ethereum typed structured data hashing and signing
-   **EIP-1271**: Standard Signature Validation Method for Contracts

## Getting Started

Ready to implement SIWE in your application? Here are some quick paths forward:

### 🚀 **Quick Start**

Follow our [Quickstart Guide](quickstart/index.md) for a step-by-step tutorial on implementing SIWE from scratch.

### 📚 **Choose Your Library**

We provide official libraries for multiple programming languages:

-   [TypeScript/JavaScript](libraries/typescript)
-   [Rust](libraries/rust)
-   [Python](libraries/python)
-   [Ruby](libraries/ruby)
-   [Go](libraries/go)
-   [Elixir](libraries/elixir)

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

-   **OpenID Connect (OIDC) Provider** for standards-compliant integration
-   **Scalable authentication** supporting millions of users
-   **Compliance-friendly** audit trails and security controls
-   **Professional support** and deployment guidance

Learn more about [OpenID Connect Integration](/integrations/auth0).

## Community & Support

SIWE is an open-source project with an active community:

-   **GitHub**: [Contribute to the project and report issues](https://github.com/signinwithethereum/siwe)
-   **Discord**: Join discussions with developers and users
-   **Twitter**: Follow [@Signinwithethereum](https://twitter.com/signinwithethereum) for updates
-   **Documentation**: Comprehensive guides and references

Explore the [Integrations](integrations/index.md) section to see SIWE implementations in production.

## Standards Compliance

SIWE fully complies with:

-   [EIP-4361](general-information/eip-4361-specification.md): Sign in with Ethereum specification
-   OpenID Connect 1.0 for enterprise integration
-   OAuth 2.0 for authorization flows
-   Web3 wallet standards for broad compatibility

---

_Ready to implement decentralized authentication in your application? Start with our [Quickstart Guide](quickstart/index.md) or explore the [EIP-4361 Specification](general-information/eip-4361-specification.md) for technical details._
