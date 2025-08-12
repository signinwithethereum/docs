# Integrations

Sign in with Ethereum (SIWE) can be integrated with various platforms and frameworks to provide seamless authentication experiences. This section covers popular integration options.

## Available Integrations

### Discussion Platforms

-   **[Discourse](/integrations/discourse)**: Add SIWE authentication to your Discourse community forums

### Authentication Libraries

-   **[NextAuth.js](/integrations/nextauth.js)**: Integrate SIWE with NextAuth.js for Next.js applications
-   **[Auth0](/integrations/auth0)**: Use SIWE with Auth0's enterprise authentication platform

## Integration Benefits

-   **Decentralized Authentication**: Users authenticate with their Ethereum wallets
-   **No Passwords**: Eliminates the need for traditional password-based authentication
-   **ENS Support**: Automatic username resolution from ENS names
-   **Cross-Platform**: Works across web, mobile, and desktop applications

## Common Integration Patterns

### Frontend Integration

Most integrations follow a similar pattern:

1. Connect to user's wallet
2. Create SIWE message
3. Request signature from user
4. Send signed message to backend for verification
5. Establish authenticated session

### Backend Verification

Backend integrations typically:

1. Receive signed SIWE message
2. Verify signature cryptographically
3. Validate message parameters (domain, nonce, expiration)
4. Create user session or JWT token

## Getting Started

Choose the integration that best fits your technology stack:

-   For Next.js applications, start with [NextAuth.js](/integrations/nextauth.js)
-   For community platforms, see [Discourse](/integrations/discourse)
-   For enterprise applications, explore [Auth0](/integrations/auth0)

## Custom Integrations

If you don't see your platform listed, you can build custom integrations using the SIWE libraries:

-   [TypeScript/JavaScript](/languages/typescript)
-   [Python](/languages/python)
-   [Ruby](/languages/ruby)
-   [Go](/languages/go)
-   [Rust](/languages/rust)
-   [Elixir](/languages/elixir)

## Community Contributions

The SIWE ecosystem welcomes community contributions. If you've built an integration for a platform not listed here, consider sharing it with the community.
