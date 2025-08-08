# Part 1: Creating a SIWE Message

In this first tutorial, you'll learn how to create Sign in with Ethereum (SIWE) messages using the official TypeScript library. This is the foundation of SIWE authentication - generating properly formatted messages that users will sign with their wallets.

## Learning Objectives

By the end of this tutorial, you'll understand:
- How to install and import the SIWE library
- The anatomy of a SIWE message
- How to generate secure nonces
- Best practices for message creation

## Installation

First, let's set up a new Node.js project and install the required dependencies:

```bash
# Create a new project directory
mkdir siwe-tutorial
cd siwe-tutorial

# Initialize a new Node.js project
npm init -y

# Install SIWE library and ethers for Ethereum utilities
npm install siwe ethers

# Install development dependencies
npm install -D typescript @types/node ts-node
```

## Basic Message Creation

Let's start by creating our first SIWE message. Create a new file called `create-message.js`:

```javascript
const { SiweMessage } = require('siwe');

// Basic SIWE message configuration
const domain = 'localhost:3000';
const origin = 'http://localhost:3000';
const address = '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890';

function createBasicMessage() {
    const message = new SiweMessage({
        domain: domain,
        address: address,
        statement: 'Sign in to our awesome Web3 app!',
        uri: origin,
        version: '1',
        chainId: 1, // Ethereum mainnet
    });

    // Generate the formatted message string
    const messageString = message.prepareMessage();
    console.log('Generated SIWE Message:');
    console.log(messageString);
    
    return message;
}

// Run the function
createBasicMessage();
```

Run this script:

```bash
node create-message.js
```

You should see output similar to:

```
Generated SIWE Message:
localhost:3000 wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our awesome Web3 app!

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2023-10-31T16:25:24Z
```

## Understanding Message Components

Let's break down what each part of the message does:

### Required Fields

```javascript
const message = new SiweMessage({
    // The domain requesting the signature
    domain: 'localhost:3000',
    
    // User's Ethereum address (EIP-55 checksum format)
    address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
    
    // The URI being signed (usually your app's login endpoint)
    uri: 'http://localhost:3000',
    
    // SIWE specification version (always "1")
    version: '1',
    
    // Blockchain network (1 = Ethereum mainnet, 5 = Goerli, etc.)
    chainId: 1,
});
```

### Optional Fields

You can enhance messages with additional security and context:

```javascript
const enhancedMessage = new SiweMessage({
    domain: 'localhost:3000',
    address: address,
    uri: origin,
    version: '1',
    chainId: 1,
    
    // Optional human-readable statement
    statement: 'Welcome to our decentralized application. By signing this message, you agree to our terms of service.',
    
    // Custom nonce (if not provided, one is generated automatically)
    nonce: 'custom-nonce-12345',
    
    // Message expiration (1 hour from now)
    expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    
    // Message valid from (current time)
    notBefore: new Date().toISOString(),
    
    // Request identifier for tracking
    requestId: 'auth-request-001',
    
    // Resources the user is requesting access to
    resources: [
        'https://api.example.com/user-data',
        'ipfs://QmHash123...'
    ]
});
```

## Secure Nonce Generation

Nonces prevent replay attacks by ensuring each signature is unique. The SIWE library provides a secure nonce generator:

```javascript
const { SiweMessage, generateNonce } = require('siwe');

function createMessageWithSecureNonce() {
    // Generate a cryptographically secure nonce
    const nonce = generateNonce();
    console.log('Generated nonce:', nonce);
    
    const message = new SiweMessage({
        domain: 'localhost:3000',
        address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
        statement: 'Secure authentication with unique nonce',
        uri: 'http://localhost:3000',
        version: '1',
        chainId: 1,
        nonce: nonce, // Use the generated nonce
    });
    
    return message;
}
```

## TypeScript Implementation

For better type safety, let's create a TypeScript version. Create `create-message.ts`:

```typescript
import { SiweMessage, generateNonce } from 'siwe';

interface MessageOptions {
    domain: string;
    address: string;
    uri: string;
    chainId: number;
    statement?: string;
    expirationTime?: string;
}

function createSiweMessage(options: MessageOptions): SiweMessage {
    const message = new SiweMessage({
        domain: options.domain,
        address: options.address,
        statement: options.statement || 'Sign in with Ethereum to authenticate',
        uri: options.uri,
        version: '1',
        chainId: options.chainId,
        nonce: generateNonce(),
        issuedAt: new Date().toISOString(),
        expirationTime: options.expirationTime,
    });
    
    return message;
}

// Example usage
const messageOptions: MessageOptions = {
    domain: 'myapp.com',
    address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
    uri: 'https://myapp.com/login',
    chainId: 1,
    statement: 'Welcome to MyApp! Sign this message to authenticate.',
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
};

const siweMessage = createSiweMessage(messageOptions);
console.log(siweMessage.prepareMessage());
```

## Production Best Practices

### Server-Side Message Creation

In production applications, **always create SIWE messages on the server**:

```javascript
// ❌ DON'T: Client-side message creation
// This allows clients to manipulate security-critical fields

// ✅ DO: Server-side message creation
function createServerSideMessage(userAddress, clientDomain) {
    // Verify the domain matches your application
    if (clientDomain !== 'myapp.com') {
        throw new Error('Invalid domain');
    }
    
    const message = new SiweMessage({
        domain: 'myapp.com', // Use server-controlled domain
        address: userAddress,
        statement: 'Authenticate with MyApp',
        uri: 'https://myapp.com/auth',
        version: '1',
        chainId: 1,
        nonce: generateNonce(), // Server-generated nonce
        issuedAt: new Date().toISOString(), // Server timestamp
    });
    
    return message;
}
```

### Nonce Management

Store and validate nonces to prevent replay attacks:

```javascript
// Simple in-memory nonce storage (use Redis/database in production)
const usedNonces = new Set();

function createMessageWithNonceTracking(address) {
    const nonce = generateNonce();
    
    // Store nonce as pending
    usedNonces.add(nonce);
    
    const message = new SiweMessage({
        domain: 'localhost:3000',
        address: address,
        uri: 'http://localhost:3000',
        version: '1',
        chainId: 1,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    });
    
    return { message, nonce };
}

function validateNonce(nonce) {
    if (!usedNonces.has(nonce)) {
        throw new Error('Invalid or expired nonce');
    }
    
    // Remove nonce after use to prevent replay
    usedNonces.delete(nonce);
    return true;
}
```

## Error Handling

Always handle potential errors when creating messages:

```javascript
function safeCreateMessage(options) {
    try {
        // Validate required fields
        if (!options.domain || !options.address || !options.uri) {
            throw new Error('Missing required fields');
        }
        
        // Validate Ethereum address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(options.address)) {
            throw new Error('Invalid Ethereum address format');
        }
        
        // Create message
        const message = new SiweMessage({
            domain: options.domain,
            address: options.address,
            statement: options.statement,
            uri: options.uri,
            version: '1',
            chainId: options.chainId || 1,
            nonce: generateNonce(),
            issuedAt: new Date().toISOString(),
        });
        
        return { success: true, message };
        
    } catch (error) {
        console.error('Error creating SIWE message:', error.message);
        return { success: false, error: error.message };
    }
}
```

## Testing Your Implementation

Create a test script to verify your message creation:

```javascript
const { SiweMessage, generateNonce } = require('siwe');

function testMessageCreation() {
    console.log('Testing SIWE message creation...\n');
    
    // Test 1: Basic message
    const basicMessage = new SiweMessage({
        domain: 'test.com',
        address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
        uri: 'http://test.com',
        version: '1',
        chainId: 1,
    });
    
    console.log('✅ Basic message created successfully');
    console.log('Message preview:');
    console.log(basicMessage.prepareMessage().substring(0, 100) + '...\n');
    
    // Test 2: Enhanced message with all optional fields
    const enhancedMessage = new SiweMessage({
        domain: 'test.com',
        address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
        statement: 'Test authentication message',
        uri: 'http://test.com/auth',
        version: '1',
        chainId: 1,
        nonce: generateNonce(),
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        resources: ['https://api.test.com/data']
    });
    
    console.log('✅ Enhanced message created successfully');
    console.log('Nonce:', enhancedMessage.nonce);
    console.log('Issued at:', enhancedMessage.issuedAt);
    console.log('Expires at:', enhancedMessage.expirationTime);
}

testMessageCreation();
```

## Next Steps

Congratulations! You've learned how to create SIWE messages. Key takeaways:

- **Messages follow EIP-4361 specification** with required and optional fields
- **Nonces provide replay protection** and should be cryptographically secure
- **Server-side creation is critical** for security in production applications
- **Proper validation prevents common errors** and security vulnerabilities

In the next tutorial, [Part 2: Frontend Setup](2-frontend-setup.md), you'll learn how to integrate SIWE messages with a React frontend and connect to user wallets for signature requests.

## Resources

- [SIWE TypeScript Library Documentation](../libraries/typescript.md)
- [EIP-4361 Specification](../general-information/eip-4361-specification.md)
- [Security Best Practices](../advanced/security-best-practices.md)

---

*Ready to connect to user wallets? Continue to [Part 2: Frontend Setup](2-frontend-setup.md) to build the frontend integration.*