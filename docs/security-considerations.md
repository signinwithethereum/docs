# 🔒 Security Considerations

## Overview

When using Sign In with Ethereum (SIWE), implementers should aim to mitigate security issues on both the client and server. This is a growing collection of best practices for implementers, but no security checklist can ever be truly complete.

## Message Generation and Validation

### Key Validation Principles

1. **Backend Validation**

    - Process SIWE messages according to [EIP-4361](general-information/eip-4361-specification.md) specifications
    - Create the entire SIWE message on the backend
    - Verify that the signed message is identical to the generated message with a valid signature

2. **Flexible Message Generation Approaches**
    - Some implementers may choose alternative methods:
        - Frontend can request specific field values from the server
        - Agree on a value generation method
        - Backend asserts received signed message matches expected verification parameters

### Critical Field Considerations

#### Nonce

**Purpose**: Prevent replay attacks

**Recommendations**:

-   Select nonce with sufficient entropy
-   Server should assert nonce matches expected value
-   Potential strategies:
    -   Derive nonce from recent block hash
    -   Use system time
    -   Reduce server interaction

**Best Practices**:

-   Use cryptographically secure random generation
-   Ensure nonces are single-use
-   Implement proper nonce cleanup/expiration
-   Store nonces securely on the server

#### Domain

**Purpose**: Prevent phishing attacks

**Wallet Capabilities**:

-   Can check/generate correct domain bindings
-   Verify website serving message matches domain
-   Example: Ensure "example.org" securely serves its SIWE message

**Best Practices**:

-   Always validate domain matches the serving origin
-   Use exact domain matching (no wildcards)
-   Implement proper HTTPS/TLS validation
-   Consider subdomain implications

#### Time-based Fields

**issuedAt**:

-   Should reflect the actual time of message creation
-   Validate against server time with reasonable tolerance
-   Use RFC 3339 (ISO 8601) format consistently

**expirationTime**:

-   Set reasonable expiration windows (5-15 minutes)
-   Always validate expiration on the server
-   Consider clock skew between client and server

**notBefore**:

-   Use when implementing scheduled authentication
-   Validate current time is after notBefore time

#### Chain ID

**Purpose**: Prevent cross-chain replay attacks

**Recommendations**:

-   Always specify the correct chain ID
-   Validate chain ID matches expected network
-   Consider multi-chain implications for your application

## Server-Side Security

### Message Verification

1. **Signature Validation**

    - Use proper cryptographic libraries for signature verification
    - Implement EIP-191 personal message signing validation
    - Support EIP-1271 for contract-based signatures when needed

2. **Parameter Validation**
    - Validate all message parameters against expected values
    - Implement strict parsing of message format
    - Reject malformed or unexpected messages

### Session Management

1. **Session Security**

    - Implement secure session storage
    - Use HTTPOnly and Secure cookie flags
    - Implement proper session expiration
    - Consider using JWTs with proper validation

2. **Rate Limiting**
    - Implement rate limiting for authentication endpoints
    - Prevent brute force attacks
    - Monitor for suspicious authentication patterns

### Database Security

1. **Data Storage**
    - Store minimal necessary user data
    - Hash or encrypt sensitive information
    - Implement proper database access controls
    - Regular security audits of stored data

## Client-Side Security

### Wallet Integration

1. **Wallet Connection**

    - Only connect to trusted wallet providers
    - Validate wallet signatures properly
    - Handle wallet disconnection gracefully
    - Implement proper error handling

2. **Message Presentation**
    - Display message contents clearly to users
    - Ensure users understand what they're signing
    - Implement proper message formatting
    - Avoid misleading or confusing message content

### Frontend Security

1. **HTTPS Requirements**

    - Always serve SIWE applications over HTTPS
    - Implement proper TLS certificate validation
    - Use secure headers (HSTS, CSP, etc.)

2. **Cross-Origin Considerations**
    - Implement proper CORS policies
    - Validate origins for authentication requests
    - Prevent cross-site request forgery (CSRF)

## Common Vulnerabilities

### Replay Attacks

**Risk**: Reusing signed messages for unauthorized access

**Mitigation**:

-   Implement proper nonce validation
-   Use time-based expiration
-   Track used signatures server-side

### Phishing Attacks

**Risk**: Users signing messages on malicious domains

**Mitigation**:

-   Validate domain field matches serving origin
-   Educate users about domain verification
-   Implement visual indicators for trusted domains

### Session Hijacking

**Risk**: Unauthorized access to authenticated sessions

**Mitigation**:

-   Use secure session management
-   Implement session regeneration
-   Monitor for suspicious session activity
-   Provide session termination controls

### Message Tampering

**Risk**: Modification of SIWE message content

**Mitigation**:

-   Generate messages server-side when possible
-   Validate all message parameters
-   Use cryptographic signatures for integrity

## Deployment Security

### Infrastructure Security

1. **Server Configuration**

    - Keep servers and dependencies updated
    - Implement proper firewall rules
    - Use secure authentication for server access
    - Regular security patches and updates

2. **Monitoring and Logging**
    - Log authentication attempts and failures
    - Monitor for unusual patterns
    - Implement alerting for security events
    - Regular security audit reviews

### Third-Party Dependencies

1. **Library Security**

    - Keep SIWE libraries updated
    - Audit third-party dependencies
    - Monitor for security vulnerabilities
    - Use dependency scanning tools

2. **Infrastructure Dependencies**
    - Secure database connections
    - Use trusted Ethereum node providers
    - Implement proper API key management
    - Regular infrastructure security reviews
