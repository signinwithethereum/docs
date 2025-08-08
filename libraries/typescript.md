# TypeScript/JavaScript Library

The official TypeScript/JavaScript SIWE library is the most comprehensive and feature-complete implementation, supporting both Node.js backends and browser frontends with full TypeScript definitions and extensive testing.

## Installation

### npm
```bash
npm install siwe ethers
```

### yarn
```bash
yarn add siwe ethers
```

### Browser CDN
```html
<script src="https://unpkg.com/siwe@latest/dist/siwe.min.js"></script>
<script src="https://unpkg.com/ethers@5/dist/ethers.umd.min.js"></script>
```

## Basic Usage

### Creating a SIWE Message

```typescript
import { SiweMessage, generateNonce } from 'siwe';

const message = new SiweMessage({
    domain: 'example.com',
    address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
    statement: 'Sign in with Ethereum to the app.',
    uri: 'https://example.com/login',
    version: '1',
    chainId: 1,
    nonce: generateNonce(),
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
});

// Generate the message string for signing
const messageString = message.prepareMessage();
console.log(messageString);
```

### Verifying a Signature

```typescript
import { SiweMessage } from 'siwe';

async function verifySignature(message: string, signature: string) {
    try {
        const siweMessage = new SiweMessage(message);
        const result = await siweMessage.verify({ signature });
        
        if (result.success) {
            console.log('✅ Valid signature from:', result.data.address);
            return result.data;
        } else {
            console.log('❌ Invalid signature:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Verification error:', error);
        return null;
    }
}
```

## API Reference

### SiweMessage Class

The main class for creating and verifying SIWE messages.

#### Constructor

```typescript
new SiweMessage(params: SiweMessageParams)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | `string` | ✅ | RFC 3986 authority requesting the signing |
| `address` | `string` | ✅ | Ethereum address (EIP-55 checksum format) |
| `uri` | `string` | ✅ | RFC 3986 URI referring to the resource |
| `version` | `string` | ✅ | Must be `"1"` for EIP-4361 compliance |
| `chainId` | `number` | ✅ | EIP-155 Chain ID |
| `statement` | `string` | ❌ | Human-readable ASCII assertion |
| `nonce` | `string` | ❌ | Randomized token (auto-generated if not provided) |
| `issuedAt` | `string` | ❌ | ISO 8601 datetime (defaults to current time) |
| `expirationTime` | `string` | ❌ | ISO 8601 datetime for expiration |
| `notBefore` | `string` | ❌ | ISO 8601 datetime for validity start |
| `requestId` | `string` | ❌ | System-specific identifier |
| `resources` | `string[]` | ❌ | List of URI references |

#### Methods

##### `prepareMessage(): string`

Formats the SIWE message according to EIP-4361 specification.

```typescript
const message = new SiweMessage({ /* params */ });
const formattedMessage = message.prepareMessage();
```

##### `verify(params: VerifyParams): Promise<SiweResponse>`

Verifies the cryptographic signature of the message.

```typescript
interface VerifyParams {
    signature: string;
    domain?: string;    // Override domain check
    nonce?: string;     // Override nonce check  
    time?: string;      // Override time check
}

interface SiweResponse {
    success: boolean;
    data?: {
        address: string;
        chainId: number;
        domain: string;
        expirationTime?: string;
        issuedAt: string;
        nonce: string;
        notBefore?: string;
        requestId?: string;
        resources?: string[];
        statement?: string;
        uri: string;
        version: string;
    };
    error?: SiweError;
}
```

##### `validate(params?: ValidateParams): SiweMessage`

Validates message structure without cryptographic verification.

```typescript
interface ValidateParams {
    domain?: string;
    nonce?: string;
    time?: string;
}
```

### Utility Functions

#### `generateNonce(): string`

Generates a cryptographically secure random nonce.

```typescript
import { generateNonce } from 'siwe';

const nonce = generateNonce();
console.log(nonce); // e.g., "a1b2c3d4e5f6g7h8"
```

#### `parseSiweMessage(message: string): SiweMessage`

Parses a SIWE message string into a SiweMessage object.

```typescript
import { parseSiweMessage } from 'siwe';

const messageString = "example.com wants you to sign in...";
const parsed = parseSiweMessage(messageString);
console.log(parsed.address);
```

## TypeScript Types

### SiweError

```typescript
interface SiweError {
    type: SiweErrorType;
    expected?: string;
    received?: string;
}

enum SiweErrorType {
    INVALID_SIGNATURE = 'Invalid signature.',
    EXPIRED_MESSAGE = 'Expired message.',
    INVALID_DOMAIN = 'Invalid domain.',
    INVALID_NONCE = 'Invalid nonce.',
    INVALID_TIME = 'Invalid time.',
    MALFORMED_SESSION = 'Malformed session.',
}
```

### SiweMessageParams

```typescript
interface SiweMessageParams {
    domain: string;
    address: string;
    statement?: string;
    uri: string;
    version: string;
    chainId: number;
    nonce?: string;
    issuedAt?: string;
    expirationTime?: string;
    notBefore?: string;
    requestId?: string;
    resources?: string[];
}
```

## Frontend Integration

### React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

export function useSiweAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);

    const signIn = useCallback(async (provider: ethers.providers.Web3Provider) => {
        setIsLoading(true);
        try {
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const chainId = await signer.getChainId();

            // Create message
            const message = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in with Ethereum.',
                uri: window.location.origin,
                version: '1',
                chainId,
            });

            const messageString = message.prepareMessage();
            
            // Request signature
            const signature = await signer.signMessage(messageString);
            
            // Send to backend for verification
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageString, signature }),
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Sign in failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(() => {
        setUser(null);
        // Clear backend session
        fetch('/api/auth/logout', { method: 'POST' });
    }, []);

    return { signIn, signOut, isLoading, user };
}
```

### Vue Composition API Example

```typescript
import { ref, computed } from 'vue';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

export function useSiweAuth() {
    const isLoading = ref(false);
    const user = ref(null);
    const isAuthenticated = computed(() => user.value !== null);

    async function signIn() {
        if (!window.ethereum) {
            throw new Error('No Web3 provider found');
        }

        isLoading.value = true;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const chainId = await signer.getChainId();

            const message = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in to Vue app with Ethereum.',
                uri: window.location.origin,
                version: '1',
                chainId,
            });

            const messageString = message.prepareMessage();
            const signature = await signer.signMessage(messageString);

            // Verify with backend
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageString, signature }),
            });

            if (response.ok) {
                user.value = await response.json();
            }
        } finally {
            isLoading.value = false;
        }
    }

    function signOut() {
        user.value = null;
    }

    return {
        signIn,
        signOut,
        isLoading: readonly(isLoading),
        user: readonly(user),
        isAuthenticated,
    };
}
```

## Backend Integration

### Express.js Example

```typescript
import express from 'express';
import { SiweMessage, generateNonce } from 'siwe';

const app = express();
app.use(express.json());

// Store nonces (use Redis in production)
const nonces = new Map<string, number>();

app.get('/api/nonce', (req, res) => {
    const nonce = generateNonce();
    nonces.set(nonce, Date.now());
    
    // Clean up expired nonces
    setTimeout(() => nonces.delete(nonce), 10 * 60 * 1000);
    
    res.json({ nonce });
});

app.post('/api/verify', async (req, res) => {
    try {
        const { message, signature } = req.body;
        
        const siweMessage = new SiweMessage(message);
        
        // Validate nonce
        if (!nonces.has(siweMessage.nonce)) {
            return res.status(400).json({ error: 'Invalid nonce' });
        }
        nonces.delete(siweMessage.nonce);
        
        // Verify signature
        const result = await siweMessage.verify({ signature });
        
        if (result.success) {
            // Create session/JWT here
            res.json({ 
                success: true, 
                user: { 
                    address: result.data.address,
                    chainId: result.data.chainId 
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### Next.js API Routes

```typescript
// pages/api/nonce.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateNonce } from 'siwe';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const nonce = generateNonce();
    res.json({ nonce });
}

// pages/api/verify.ts  
import type { NextApiRequest, NextApiResponse } from 'next';
import { SiweMessage } from 'siwe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);
        
        const result = await siweMessage.verify({ signature });
        
        if (result.success) {
            res.json({ success: true, user: result.data });
        } else {
            res.status(401).json({ error: 'Verification failed' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
```

## Advanced Features

### EIP-1271 Smart Contract Signatures

Verify signatures from smart contracts:

```typescript
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

const message = new SiweMessage(messageParams);
const provider = new ethers.providers.JsonRpcProvider('https://...');

const result = await message.verify({ 
    signature,
    provider // Required for EIP-1271 verification
});
```

### Custom Domain Validation

```typescript
const message = new SiweMessage(messageString);

// Override domain validation
const result = await message.verify({ 
    signature,
    domain: 'custom-domain.com'
});
```

### Time-based Validation

```typescript
// Verify at specific time
const result = await message.verify({ 
    signature,
    time: '2023-10-31T16:30:00Z'
});
```

## Migration Guide

### From v1 to v2

Version 2 introduces breaking changes for better TypeScript support:

#### Message Creation
```typescript
// v1
const message = new SiweMessage({
    domain: 'example.com',
    address: '0x...',
    // ... other fields
});

// v2 - Same API, improved types
const message = new SiweMessage({
    domain: 'example.com',
    address: '0x...',
    // ... other fields  
});
```

#### Verification Response
```typescript
// v1
const result = await message.verify({ signature });
if (result.success) {
    console.log(result.data); // Direct access
}

// v2 - Enhanced error handling
const result = await message.verify({ signature });
if (result.success) {
    console.log(result.data); // Same structure
} else {
    console.error(result.error); // Detailed error info
}
```

## Troubleshooting

### Common Issues

#### "Invalid signature" Error
- Verify the message string exactly matches what was signed
- Check that the address is in EIP-55 checksum format
- Ensure the signature is in the correct format (0x prefixed hex)

#### "Invalid nonce" Error  
- Verify nonces are only used once
- Check nonce expiration/cleanup logic
- Ensure nonce matches between message creation and verification

#### TypeScript Compilation Errors
- Update to latest TypeScript version (4.5+)
- Ensure `strict: true` in tsconfig.json
- Install `@types/node` if using Node.js APIs

### Browser Compatibility

The library supports all modern browsers with ES6+ support:

- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

For older browser support, use the ES5 build:

```html
<script src="https://unpkg.com/siwe@latest/dist/siwe.es5.min.js"></script>
```

## Performance

### Bundle Size
- **Minified**: ~45KB
- **Gzipped**: ~12KB
- **Tree-shaking**: Supports ES modules for optimal bundling

### Verification Performance
- **Message parsing**: ~0.1ms
- **Signature verification**: ~10-50ms (depends on provider)
- **Memory usage**: ~2MB per verification

### Optimization Tips

```typescript
// Reuse provider instances
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// Cache verification results for identical signatures
const verificationCache = new Map();

async function cachedVerify(message: string, signature: string) {
    const key = `${message}-${signature}`;
    if (verificationCache.has(key)) {
        return verificationCache.get(key);
    }
    
    const result = await new SiweMessage(message).verify({ signature });
    verificationCache.set(key, result);
    return result;
}
```

## Resources

- **GitHub**: [https://github.com/spruceid/siwe](https://github.com/spruceid/siwe)
- **npm Package**: [https://www.npmjs.com/package/siwe](https://www.npmjs.com/package/siwe)
- **TypeScript Playground**: [https://siwe-demo.vercel.app](https://siwe-demo.vercel.app)
- **Examples**: [https://github.com/spruceid/siwe-examples](https://github.com/spruceid/siwe-examples)

---

*Need help with integration? Check out our [Quickstart Guide](../quickstart/README.md) or [Integration Examples](../integrations/README.md).*