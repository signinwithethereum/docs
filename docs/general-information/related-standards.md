# 🔍 Related Standards

Sign in with Ethereum builds upon several established Ethereum Improvement Proposals (EIPs) and blockchain standards. Understanding these foundational technologies provides insight into SIWE's security guarantees and compatibility with the broader Ethereum ecosystem.

## Core Foundation Standards

### [EIP-4361](eip-4361-specification.md): Sign in with Ethereum

**Status**: Final  
**Purpose**: Core SIWE specification defining message format and verification process

[EIP-4361](eip-4361-specification.md) is the foundational standard that defines the complete SIWE protocol. It establishes:

-   **Message Format**: Human-readable authentication message structure
-   **Required Fields**: Domain, address, URI, version, chain ID, nonce, and timestamp
-   **Optional Fields**: Statement, expiration, not-before, request ID, and resources
-   **Verification Process**: Steps for cryptographic signature validation
-   **Security Considerations**: Guidelines for secure implementation

```
example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our decentralized application.

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2023-10-31T16:25:24Z
Expiration Time: 2023-10-31T17:25:24Z
```

**Key Contributions**:

-   Standardizes Web3 authentication across applications
-   Provides human-readable messages for user transparency
-   Establishes security best practices for implementation
-   Enables interoperability between different SIWE implementations

### EIP-191: Signed Data Standard

**Status**: Final  
**Purpose**: Standard for signing arbitrary data with Ethereum private keys

EIP-191 defines how arbitrary data can be signed using Ethereum private keys, providing the cryptographic foundation for SIWE message signing.

**Message Prefixing**:

```
0x19 <1 byte version> <version specific data> <data to sign>
```

For SIWE, the version byte is `0x45` (Ethereum personal message), resulting in:

```
0x19 0x45 ethereum signed message:\n <message length> <message>
```

**Security Features**:

-   **Replay Protection**: Messages are cryptographically bound to Ethereum's signing standard
-   **Version Control**: Different version bytes prevent cross-version replay attacks
-   **Domain Separation**: Personal message prefix prevents confusion with transaction signatures

**SIWE Implementation**:

```javascript
// SIWE messages are signed using EIP-191 personal message format
const messageHash = ethers.utils.hashMessage(siweMessage.prepareMessage())
const signature = await signer.signMessage(siweMessage.prepareMessage())
```

### EIP-712: Ethereum Typed Structured Data Hashing and Signing

**Status**: Final  
**Purpose**: Standard for hashing and signing typed structured data

While SIWE uses EIP-191 by default, EIP-712 provides enhanced user experience through structured data presentation in wallets.

**Structured Data Format**:

```javascript
const domain = {
	name: 'Sign in with Ethereum',
	version: '1',
	chainId: 1,
	verifyingContract: '0x...',
}

const types = {
	SiweMessage: [
		{ name: 'domain', type: 'string' },
		{ name: 'address', type: 'address' },
		{ name: 'statement', type: 'string' },
		{ name: 'uri', type: 'string' },
		{ name: 'version', type: 'string' },
		{ name: 'chainId', type: 'uint256' },
		{ name: 'nonce', type: 'string' },
		{ name: 'issuedAt', type: 'string' },
	],
}

const value = {
	domain: 'example.com',
	address: '0x742d35...',
	statement: 'Sign in to our app',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
	nonce: '32891756',
	issuedAt: '2023-10-31T16:25:24Z',
}
```

**Benefits for SIWE**:

-   **Better UX**: Wallets can display structured data fields clearly
-   **Type Safety**: Strong typing prevents field interpretation errors
-   **Domain Binding**: EIP-712 domain provides additional security context
-   **Future Compatibility**: Enables advanced wallet features and integrations

### EIP-1271: Standard Signature Validation Method for Contracts

**Status**: Final  
**Purpose**: Standard interface for smart contracts to validate signatures

EIP-1271 enables smart contract wallets (like Gnosis Safe, Argent, etc.) to validate signatures, extending SIWE compatibility beyond externally owned accounts (EOAs).

**Interface Definition**:

```solidity
interface IERC1271 {
    function isValidSignature(
        bytes32 _hash,
        bytes memory _signature
    ) external view returns (bytes4 magicValue);
}
```

**Magic Value**: `0x1626ba7e` indicates a valid signature

**SIWE Integration**:

```javascript
// Check if address is a contract
const code = await provider.getCode(address)
const isContract = code !== '0x'

if (isContract) {
	// Use EIP-1271 verification for contract wallets
	const result = await siweMessage.verify({
		signature,
		provider, // Required for contract verification
	})
} else {
	// Standard EOA verification
	const result = await siweMessage.verify({ signature })
}
```

**Supported Wallet Types**:

-   **Gnosis Safe**: Multi-signature smart contract wallets
-   **Argent**: Social recovery smart contract wallets
-   **Custom Contract Wallets**: Any contract implementing EIP-1271
-   **Account Abstraction Wallets**: ERC-4337 compatible wallets

## Supporting Standards

### EIP-155: Simple Replay Attack Protection

**Status**: Final  
**Purpose**: Prevents transaction replay attacks across different networks

EIP-155 introduces chain ID to prevent transactions from being replayed on different networks. SIWE incorporates this concept for authentication security.

**Chain ID Binding**:

-   **Mainnet**: Chain ID 1
-   **Goerli**: Chain ID 5
-   **Polygon**: Chain ID 137
-   **Arbitrum**: Chain ID 42161

**Security Benefits**:

-   **Network Binding**: Signatures are bound to specific blockchain networks
-   **Replay Prevention**: Messages cannot be replayed across different chains
-   **Multi-chain Support**: Applications can support multiple networks securely

### EIP-2098: Compact Signature Representation

**Status**: Final  
**Purpose**: More efficient signature encoding format

EIP-2098 defines a compact signature format that reduces signature size from 65 to 64 bytes, beneficial for applications with signature storage constraints.

**Standard Format** (65 bytes):

```
r (32 bytes) + s (32 bytes) + v (1 byte)
```

**Compact Format** (64 bytes):

```
r (32 bytes) + yParityAndS (32 bytes)
```

**SIWE Compatibility**:

```javascript
// SIWE libraries handle both formats automatically
const signature65 = '0x1234...' // 65-byte format
const signature64 = '0x5678...' // 64-byte format

// Both work with SIWE verification
const result1 = await message.verify({ signature: signature65 })
const result2 = await message.verify({ signature: signature64 })
```

### EIP-3085: Wallet Add Ethereum Chain RPC Method

**Status**: Final  
**Purpose**: Standard method for wallets to add new Ethereum chains

Enables SIWE applications to prompt users to add custom networks if needed.

```javascript
// Request to add a custom chain
await window.ethereum.request({
	method: 'wallet_addEthereumChain',
	params: [
		{
			chainId: '0x89', // Polygon Mainnet
			chainName: 'Polygon Mainnet',
			nativeCurrency: {
				name: 'MATIC',
				symbol: 'MATIC',
				decimals: 18,
			},
			rpcUrls: ['https://polygon-rpc.com/'],
			blockExplorerUrls: ['https://polygonscan.com/'],
		},
	],
})
```

## Web Standards Integration

### RFC 3986: Uniform Resource Identifier (URI)

SIWE uses RFC 3986 compliant URIs for the `uri` and `resources` fields.

**Valid URI Examples**:

```
https://example.com/login
http://localhost:3000/auth
ipfs://QmHash123...
did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH
```

**Validation Requirements**:

-   Must include scheme (https, http, ipfs, etc.)
-   Domain must match RFC 3986 authority format
-   Path and query parameters are optional but must be valid if present

### RFC 3339: Date and Time Format

SIWE timestamps use RFC 3339 / ISO 8601 format for consistency and parseability.

**Required Format**:

```
YYYY-MM-DDTHH:mm:ssZ
2023-10-31T16:25:24Z
```

**Timezone Requirements**:

-   All timestamps must be in UTC (denoted by 'Z' suffix)
-   Timezone offsets are not supported for consistency
-   Milliseconds are optional but supported

### OpenID Connect Integration

SIWE can integrate with OpenID Connect (OIDC) for enterprise authentication workflows.

**OIDC Claims Mapping**:

```json
{
	"sub": "0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890",
	"iss": "https://oidc.signinwithethereum.org",
	"aud": "your-client-id",
	"exp": 1635696324,
	"iat": 1635692724,
	"auth_time": 1635692724,
	"ethereum_address": "0x742d35...",
	"chain_id": 1,
	"wallet_type": "metamask"
}
```

## Interoperability Standards

### W3C Decentralized Identifiers (DIDs)

SIWE can integrate with DID standards for enhanced identity interoperability.

**DID Document Example**:

```json
{
	"@context": ["https://www.w3.org/ns/did/v1"],
	"id": "did:ethr:0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890",
	"verificationMethod": [
		{
			"id": "did:ethr:0x742d35...#controller",
			"type": "EcdsaSecp256k1RecoveryMethod2020",
			"controller": "did:ethr:0x742d35...",
			"blockchainAccountId": "eip155:1:0x742d35..."
		}
	],
	"authentication": ["did:ethr:0x742d35...#controller"]
}
```

### W3C Verifiable Credentials

SIWE authentication can be used to issue and verify W3C Verifiable Credentials.

**Credential Example**:

```json
{
	"@context": [
		"https://www.w3.org/2018/credentials/v1",
		"https://schema.org"
	],
	"type": ["VerifiableCredential", "EthereumAddressCredential"],
	"issuer": "did:ethr:0x...",
	"issuanceDate": "2023-10-31T16:25:24Z",
	"credentialSubject": {
		"id": "did:ethr:0x742d35...",
		"ethereumAddress": "0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890",
		"chainId": 1
	},
	"proof": {
		"type": "EcdsaSecp256k1Signature2019",
		"created": "2023-10-31T16:25:24Z",
		"verificationMethod": "did:ethr:0x...#controller",
		"proofPurpose": "assertionMethod",
		"jws": "eyJ0eXAi..."
	}
}
```

## Security Standards Compliance

### Common Criteria (ISO 15408)

SIWE implementations can achieve Common Criteria compliance through:

-   **Cryptographic Module Validation**: Use FIPS 140-2 validated cryptographic libraries
-   **Key Management**: Secure private key storage and access controls
-   **Audit Trails**: Comprehensive logging of authentication events
-   **Access Controls**: Role-based access control for administrative functions

### NIST Cybersecurity Framework

SIWE aligns with NIST guidelines through:

-   **Identity and Access Management**: Strong authentication using cryptographic proofs
-   **Risk Assessment**: Regular security audits and vulnerability assessments
-   **Incident Response**: Monitoring and alerting for suspicious authentication patterns
-   **Recovery Planning**: Backup and recovery procedures for authentication infrastructure

## Future Standards

### Emerging Developments

**EIP-6963**: Multi Injected Provider Discovery  
Enables applications to discover and connect to multiple wallet providers simultaneously.

**ERC-4337**: Account Abstraction  
Enables smart contract wallets with advanced features like social recovery and gasless transactions.

**EIP-5792**: Wallet Call API  
Standardizes how applications can request wallets to execute transactions and operations.

### Cross-Chain Standards

**Cosmos IBC**: Inter-Blockchain Communication  
Potential future integration for cross-chain authentication.

**Polkadot XCM**: Cross-Chain Message Passing  
Framework for cross-chain functionality that could extend SIWE capabilities.

**LayerZero**: Omnichain Protocol  
Infrastructure for cross-chain applications that could support multi-chain SIWE authentication.

## Implementation Considerations

### Standards Compliance Checklist

When implementing SIWE, ensure compliance with:

-   ✅ **[EIP-4361](eip-4361-specification.md)**: Message format and verification process
-   ✅ **EIP-191**: Proper message signing with personal message prefix
-   ✅ **EIP-155**: Chain ID validation and binding
-   ✅ **EIP-1271**: Smart contract signature validation support
-   ✅ **RFC 3986**: Valid URI format for domain and resources
-   ✅ **RFC 3339**: ISO 8601 timestamp format
-   ✅ **EIP-55**: Checksum address format validation

### Testing Standards Compliance

```javascript
// Test suite for standards compliance
describe('SIWE Standards Compliance', () => {
    test('[EIP-4361](eip-4361-specification.md) message format', () => {
        const message = new SiweMessage({...});
        expect(message.prepareMessage()).toMatch(/^.+ wants you to sign in/);
    });

    test('EIP-191 signature verification', async () => {
        const signature = await signer.signMessage(messageString);
        const recovered = ethers.utils.verifyMessage(messageString, signature);
        expect(recovered).toBe(expectedAddress);
    });

    test('EIP-155 chain ID validation', () => {
        expect(() => new SiweMessage({ chainId: -1 })).toThrow();
    });

    test('RFC 3986 URI validation', () => {
        expect(() => new SiweMessage({ uri: 'invalid-uri' })).toThrow();
    });
});
```

---

_Understanding these standards provides the foundation for secure and interoperable SIWE implementations. For practical implementation guidance, see our [Quickstart Guide](../quickstart/index.md) and [Security Best Practices](/security-considerations)._
