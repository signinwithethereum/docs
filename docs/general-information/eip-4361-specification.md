# 📜 EIP-4361 Specification

EIP-4361 defines the core specification for Sign in with Ethereum, establishing a standardized message format for Ethereum-based authentication. This specification enables users to authenticate with Web3 applications using their Ethereum accounts in a secure, standardized manner.

## Overview

EIP-4361 introduces a human-readable message format that users sign with their Ethereum wallets to authenticate with applications. The specification ensures consistency across implementations while providing strong security guarantees through cryptographic signatures.

## Message Format

The SIWE message follows a strict format consisting of a human-readable statement followed by structured metadata:

```
${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chain-id}
Nonce: ${nonce}
Issued At: ${issued-at}
Expiration Time: ${expiration-time}
Not Before: ${not-before}
Request ID: ${request-id}
Resources:
- ${resource-1}
- ${resource-2}
- ...
```

### Example Message

Here's an example of a complete SIWE message:

```
example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Welcome to Example App! Sign this message to authenticate securely.

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2023-10-31T16:25:24Z
Expiration Time: 2023-10-31T17:25:24Z
Not Before: 2023-10-31T16:20:24Z
Request ID: request-123
Resources:
- https://example.com/profile
- https://api.example.com/user-data
```

## Required Fields

These fields **must** be present in every SIWE message:

### `domain`

-   **Type**: String
-   **Description**: The domain that is requesting the signing
-   **Format**: RFC 3986 authority (domain name or IP address with optional port)
-   **Example**: `example.com`, `localhost:3000`, `192.168.1.1:8080`

### `address`

-   **Type**: String
-   **Description**: The Ethereum address performing the signing
-   **Format**: Ethereum address in [EIP-55](https://eips.ethereum.org/EIPS/eip-55) mixed-case checksum format
-   **Example**: `0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890`

### `uri`

-   **Type**: String
-   **Description**: RFC 3986 URI referring to the resource that is the subject of the signing
-   **Format**: Complete URI including scheme
-   **Example**: `https://example.com/login`, `http://localhost:3000/auth`

### `version`

-   **Type**: String
-   **Description**: Current version of the message format
-   **Value**: Must be `"1"` for EIP-4361 compliance
-   **Example**: `1`

### `chain-id`

-   **Type**: String
-   **Description**: [EIP-155](https://eips.ethereum.org/EIPS/eip-155) Chain ID to which the session is bound
-   **Format**: Decimal string representation
-   **Example**: `1` (Ethereum Mainnet), `5` (Goerli), `137` (Polygon)

### `nonce`

-   **Type**: String
-   **Description**: Randomized token to prevent replay attacks
-   **Requirements**: Minimum 8 alphanumeric characters with sufficient entropy
-   **Example**: `32891756`, `a1b2c3d4e5f6g7h8`

### `issued-at`

-   **Type**: String
-   **Description**: ISO 8601 datetime string when the message was generated
-   **Format**: ISO 8601 UTC timestamp
-   **Example**: `2023-10-31T16:25:24Z`

## Optional Fields

These fields can be included for additional functionality:

### `statement`

-   **Type**: String
-   **Description**: Human-readable ASCII assertion that the user will sign
-   **Purpose**: Provide context about what the user is signing
-   **Example**: `"Welcome to Example App! Sign this message to authenticate securely."`

### `expiration-time`

-   **Type**: String
-   **Description**: ISO 8601 datetime when the signed authentication message is no longer valid
-   **Format**: ISO 8601 UTC timestamp
-   **Example**: `2023-10-31T17:25:24Z`

### `not-before`

-   **Type**: String
-   **Description**: ISO 8601 datetime when the signed authentication message will become valid
-   **Format**: ISO 8601 UTC timestamp
-   **Example**: `2023-10-31T16:20:24Z`

### `request-id`

-   **Type**: String
-   **Description**: System-specific identifier for the sign-in request
-   **Purpose**: Enable correlation with backend systems
-   **Example**: `request-123`, `uuid-4b3c2a1d-9e8f-7g6h-5i4j-3k2l1m0n`

### `resources`

-   **Type**: List of strings
-   **Description**: List of information or references to information the user wishes to have resolved
-   **Format**: Each resource on a separate line prefixed with `"- "`
-   **Example**:
    ```
    Resources:
    - https://example.com/profile
    - ipfs://QmHash123...
    - did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH
    ```

## Security Considerations

### Nonce Generation

-   Nonces **must** have sufficient entropy to prevent guessing attacks
-   Consider using cryptographically secure random number generators
-   Recommend minimum 8 characters using alphanumeric characters
-   Server should verify nonce matches expected value and hasn't been reused

### Domain Binding

-   The `domain` field binds the signature to a specific application
-   Applications **must** verify the domain matches their expected value
-   Prevents signatures from being replayed across different applications

### Time Constraints

-   Use `expiration-time` to limit the validity period of authentication messages
-   Implement `not-before` for delayed validity if needed
-   Verify timestamps are within acceptable bounds during validation

### Chain ID Verification

-   Always verify `chain-id` matches the expected blockchain network
-   Prevents cross-chain replay attacks
-   Ensures user is authenticating on the intended network

## Message Generation

When generating SIWE messages:

1. **Server-side Generation**: Create the entire message on the backend for security
2. **Nonce Management**: Generate and track nonces server-side
3. **Timestamp Accuracy**: Use server timestamps to prevent client manipulation
4. **Validation Ready**: Ensure all required fields are present and properly formatted

## Message Validation

When validating SIWE messages:

1. **Format Compliance**: Verify message structure matches EIP-4361 specification
2. **Required Fields**: Confirm all mandatory fields are present and valid
3. **Signature Verification**: Cryptographically verify the signature matches the message and address
4. **Security Checks**: Validate nonce, timestamps, domain, and chain ID
5. **Business Logic**: Apply application-specific authorization rules

## Standards Compatibility

EIP-4361 is designed to work with existing Ethereum standards:

-   **[EIP-191](https://eips.ethereum.org/EIPS/eip-191)**: Signed Data Standard for message signing
-   **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)**: Ethereum typed structured data hashing and signing
-   **[EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)**: Standard Signature Validation Method for Smart Contracts
-   **[EIP-155](https://eips.ethereum.org/EIPS/eip-155)**: Simple replay attack protection for chain ID binding

## Implementation Notes

### Message Encoding

-   Messages should be UTF-8 encoded
-   Line endings should be consistent (prefer `\n`)
-   Whitespace handling should follow the exact specification format

### Address Format

-   Use [EIP-55](https://eips.ethereum.org/EIPS/eip-55) mixed-case checksum format for addresses
-   Validate address checksum during message validation
-   Support both externally owned accounts (EOA) and contract accounts

### Timestamp Handling

-   All timestamps must be in UTC timezone
-   Use ISO 8601 format with 'Z' suffix for UTC
-   Implement reasonable clock skew tolerance in validation

---

_For implementation examples and code samples, see our [Library Implementations](../libraries/index.md) or [Quickstart Guide](../quickstart/index.md)._
