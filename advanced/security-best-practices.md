# Security Best Practices

Implementing SIWE securely requires careful attention to multiple aspects of the authentication flow. This guide covers essential security practices to protect both users and applications from common attack vectors and vulnerabilities.

## Message Creation Security

### Server-Side Message Generation

**Always create SIWE messages on the server-side** to prevent client manipulation of security-critical fields.

```javascript
// ❌ NEVER: Client-side message creation
function createClientMessage(userAddress) {
    // Clients can manipulate domain, expiration, and other critical fields
    return new SiweMessage({
        domain: window.location.host, // Client-controlled
        address: userAddress,
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce: Math.random().toString(), // Weak entropy
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Client-controlled
    });
}

// ✅ CORRECT: Server-side message creation
function createServerMessage(userAddress, clientDomain) {
    // Validate client domain against whitelist
    const allowedDomains = ['myapp.com', 'www.myapp.com'];
    if (!allowedDomains.includes(clientDomain)) {
        throw new Error('Invalid domain');
    }
    
    return new SiweMessage({
        domain: 'myapp.com', // Server-controlled
        address: userAddress,
        statement: 'Sign in to MyApp',
        uri: 'https://myapp.com/auth',
        version: '1',
        chainId: 1,
        nonce: generateSecureNonce(), // Cryptographically secure
        issuedAt: new Date().toISOString(), // Server timestamp
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes max
    });
}
```

### Domain Validation

**Strictly validate the domain** field to prevent cross-site message abuse.

```javascript
class DomainValidator {
    constructor(allowedDomains) {
        this.allowedDomains = new Set(allowedDomains);
    }
    
    validate(domain) {
        // Exact match validation
        if (this.allowedDomains.has(domain)) {
            return true;
        }
        
        // Subdomain validation (optional)
        for (const allowedDomain of this.allowedDomains) {
            if (domain.endsWith('.' + allowedDomain)) {
                return true;
            }
        }
        
        throw new Error(`Domain '${domain}' not allowed`);
    }
}

// Usage
const validator = new DomainValidator(['example.com', 'staging.example.com']);
validator.validate(siweMessage.domain); // Throws on invalid domain
```

### Address Format Validation

**Validate Ethereum address format and checksum** to prevent malformed addresses.

```javascript
function validateEthereumAddress(address) {
    // Basic format check
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error('Invalid address format');
    }
    
    // EIP-55 checksum validation
    const checksumAddress = ethers.utils.getAddress(address);
    if (address !== checksumAddress) {
        throw new Error('Invalid address checksum');
    }
    
    return checksumAddress;
}

// Always validate addresses before creating messages
const validAddress = validateEthereumAddress(userProvidedAddress);
const message = new SiweMessage({
    // ... other fields
    address: validAddress
});
```

## Nonce Management

### Secure Nonce Generation

**Use cryptographically secure random nonce generation** with sufficient entropy.

```javascript
const crypto = require('crypto');

class NonceManager {
    generateNonce() {
        // Generate 32 bytes of random data and encode as base64
        return crypto.randomBytes(32).toString('base64url');
    }
    
    // Alternative: Use SIWE's built-in generator
    generateSiweNonce() {
        return generateNonce(); // From siwe library
    }
}
```

### Nonce Storage and Validation

**Implement secure nonce storage with automatic cleanup** to prevent replay attacks.

```javascript
class SecureNonceManager {
    constructor(maxAge = 10 * 60 * 1000) { // 10 minutes default
        this.nonces = new Map();
        this.maxAge = maxAge;
        
        // Cleanup expired nonces every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }
    
    generateNonce() {
        const nonce = crypto.randomBytes(32).toString('base64url');
        const timestamp = Date.now();
        
        this.nonces.set(nonce, {
            timestamp,
            used: false,
            attempts: 0
        });
        
        return nonce;
    }
    
    validateAndConsume(nonce) {
        const nonceData = this.nonces.get(nonce);
        
        if (!nonceData) {
            throw new Error('Invalid nonce');
        }
        
        // Check if already used
        if (nonceData.used) {
            // Log potential replay attack
            console.warn(`Replay attempt with nonce: ${nonce}`);
            throw new Error('Nonce already used');
        }
        
        // Check expiration
        if (Date.now() - nonceData.timestamp > this.maxAge) {
            this.nonces.delete(nonce);
            throw new Error('Nonce expired');
        }
        
        // Rate limit validation attempts
        nonceData.attempts++;
        if (nonceData.attempts > 3) {
            this.nonces.delete(nonce);
            throw new Error('Too many validation attempts');
        }
        
        // Mark as used
        nonceData.used = true;
        return true;
    }
    
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [nonce, data] of this.nonces.entries()) {
            if (now - data.timestamp > this.maxAge) {
                this.nonces.delete(nonce);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired nonces`);
        }
    }
}
```

### Production Nonce Storage

**Use persistent storage for nonces in production** environments.

```javascript
// Redis-based nonce manager
class RedisNonceManager {
    constructor(redisClient) {
        this.redis = redisClient;
        this.keyPrefix = 'siwe:nonce:';
        this.maxAge = 10 * 60; // 10 minutes in seconds
    }
    
    async generateNonce() {
        const nonce = crypto.randomBytes(32).toString('base64url');
        const key = this.keyPrefix + nonce;
        
        // Store with automatic expiration
        await this.redis.setex(key, this.maxAge, JSON.stringify({
            timestamp: Date.now(),
            used: false,
            attempts: 0
        }));
        
        return nonce;
    }
    
    async validateAndConsume(nonce) {
        const key = this.keyPrefix + nonce;
        const data = await this.redis.get(key);
        
        if (!data) {
            throw new Error('Invalid or expired nonce');
        }
        
        const nonceData = JSON.parse(data);
        
        if (nonceData.used) {
            throw new Error('Nonce already used');
        }
        
        // Update attempts counter
        nonceData.attempts++;
        if (nonceData.attempts > 3) {
            await this.redis.del(key);
            throw new Error('Too many validation attempts');
        }
        
        // Mark as used
        nonceData.used = true;
        await this.redis.setex(key, this.maxAge, JSON.stringify(nonceData));
        
        return true;
    }
}
```

## Signature Verification Security

### Comprehensive Verification Process

**Implement thorough signature verification** with multiple security checks.

```javascript
class SecureSiweVerifier {
    constructor(config) {
        this.allowedDomains = new Set(config.allowedDomains);
        this.allowedChainIds = new Set(config.allowedChainIds);
        this.maxMessageAge = config.maxMessageAge || 10 * 60 * 1000;
        this.nonceManager = config.nonceManager;
    }
    
    async verify(messageString, signature) {
        try {
            // Step 1: Parse message
            const message = new SiweMessage(messageString);
            
            // Step 2: Validate message structure
            await this.validateMessage(message);
            
            // Step 3: Validate and consume nonce
            await this.nonceManager.validateAndConsume(message.nonce);
            
            // Step 4: Verify cryptographic signature
            const result = await message.verify({ signature });
            
            if (!result.success) {
                throw new Error('Invalid signature');
            }
            
            // Step 5: Additional validation
            await this.performAdditionalValidation(message);
            
            return {
                success: true,
                address: message.address,
                chainId: message.chainId,
                domain: message.domain
            };
            
        } catch (error) {
            // Log security events
            console.warn('SIWE verification failed:', {
                error: error.message,
                timestamp: new Date().toISOString(),
                signature: signature.substring(0, 10) + '...'
            });
            
            throw error;
        }
    }
    
    validateMessage(message) {
        // Domain validation
        if (!this.allowedDomains.has(message.domain)) {
            throw new Error(`Domain '${message.domain}' not allowed`);
        }
        
        // Chain ID validation
        if (!this.allowedChainIds.has(message.chainId)) {
            throw new Error(`Chain ID '${message.chainId}' not allowed`);
        }
        
        // Message age validation
        const issuedAt = new Date(message.issuedAt);
        const age = Date.now() - issuedAt.getTime();
        
        if (age > this.maxMessageAge) {
            throw new Error('Message too old');
        }
        
        if (age < -30000) { // Allow 30 seconds clock skew
            throw new Error('Message from future');
        }
        
        // Expiration validation
        if (message.expirationTime) {
            const expiration = new Date(message.expirationTime);
            if (Date.now() > expiration.getTime()) {
                throw new Error('Message expired');
            }
        }
        
        // Not before validation
        if (message.notBefore) {
            const notBefore = new Date(message.notBefore);
            if (Date.now() < notBefore.getTime()) {
                throw new Error('Message not yet valid');
            }
        }
    }
    
    async performAdditionalValidation(message) {
        // Custom validation logic
        // e.g., blacklist checks, rate limiting, etc.
    }
}
```

### EIP-1271 Smart Contract Support

**Properly handle smart contract wallet signatures** using EIP-1271.

```javascript
async function verifySignature(message, signature, provider) {
    const siweMessage = new SiweMessage(message);
    
    // Check if address is a contract
    const code = await provider.getCode(siweMessage.address);
    const isContract = code !== '0x';
    
    if (isContract) {
        // Use EIP-1271 verification for contracts
        const result = await siweMessage.verify({ 
            signature, 
            provider // Required for EIP-1271
        });
        
        if (!result.success) {
            throw new Error('EIP-1271 verification failed');
        }
    } else {
        // Standard EOA verification
        const result = await siweMessage.verify({ signature });
        
        if (!result.success) {
            throw new Error('EOA signature verification failed');
        }
    }
}
```

## Time-based Security

### Message Expiration

**Implement reasonable message expiration times** to limit attack windows.

```javascript
function createTimeBoundMessage(userAddress) {
    const now = new Date();
    const expiration = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    
    return new SiweMessage({
        domain: 'myapp.com',
        address: userAddress,
        statement: 'Sign in to MyApp',
        uri: 'https://myapp.com/auth',
        version: '1',
        chainId: 1,
        nonce: generateNonce(),
        issuedAt: now.toISOString(),
        expirationTime: expiration.toISOString()
    });
}
```

### Clock Skew Handling

**Account for clock differences** between client and server.

```javascript
function validateTimestamp(issuedAt, allowedSkew = 30000) { // 30 seconds
    const messageTime = new Date(issuedAt).getTime();
    const now = Date.now();
    const diff = Math.abs(now - messageTime);
    
    if (diff > allowedSkew) {
        throw new Error(`Message timestamp too far from current time: ${diff}ms`);
    }
}
```

## Rate Limiting

### Authentication Rate Limiting

**Implement strict rate limiting** for authentication endpoints.

```javascript
const rateLimit = require('express-rate-limit');

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: 'Too many authentication attempts',
    standardHeaders: true,
    legacyHeaders: false,
    // Store in Redis for production
    store: new RedisStore({
        // Redis configuration
    })
});

// Apply to auth routes
app.post('/auth/verify', authLimiter, async (req, res) => {
    // Verification logic
});
```

### Per-Address Rate Limiting

**Implement per-address rate limiting** to prevent abuse.

```javascript
class AddressRateLimiter {
    constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }
    
    checkLimit(address) {
        const now = Date.now();
        const addressAttempts = this.attempts.get(address) || [];
        
        // Remove expired attempts
        const validAttempts = addressAttempts.filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        if (validAttempts.length >= this.maxAttempts) {
            throw new Error(`Rate limit exceeded for address ${address}`);
        }
        
        // Record new attempt
        validAttempts.push(now);
        this.attempts.set(address, validAttempts);
    }
}
```

## Input Validation and Sanitization

### Message Content Validation

**Validate all message fields** to prevent injection attacks.

```javascript
function validateMessageContent(message) {
    // Length limits
    if (message.statement && message.statement.length > 1000) {
        throw new Error('Statement too long');
    }
    
    if (message.requestId && message.requestId.length > 100) {
        throw new Error('Request ID too long');
    }
    
    // Character validation
    if (message.statement && !/^[\x20-\x7E]*$/.test(message.statement)) {
        throw new Error('Statement contains invalid characters');
    }
    
    // URL validation for resources
    if (message.resources) {
        message.resources.forEach(resource => {
            try {
                new URL(resource);
            } catch {
                throw new Error(`Invalid resource URL: ${resource}`);
            }
        });
    }
}
```

### Request Payload Validation

**Validate and limit request payloads** to prevent DoS attacks.

```javascript
const express = require('express');

app.use(express.json({
    limit: '50kb', // Limit payload size
    verify: (req, res, buf, encoding) => {
        // Additional payload validation
        if (buf.length === 0) {
            throw new Error('Empty payload');
        }
    }
}));

// Request validation middleware
function validateAuthRequest(req, res, next) {
    const { message, signature } = req.body;
    
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid message' });
    }
    
    if (!signature || typeof signature !== 'string') {
        return res.status(400).json({ error: 'Invalid signature' });
    }
    
    if (message.length > 10000) {
        return res.status(400).json({ error: 'Message too long' });
    }
    
    if (signature.length > 200) {
        return res.status(400).json({ error: 'Signature too long' });
    }
    
    next();
}
```

## Session Management Security

### Secure Session Creation

**Create secure sessions after successful authentication.**

```javascript
const jwt = require('jsonwebtoken');

function createSecureSession(userAddress, chainId) {
    const payload = {
        address: userAddress,
        chainId: chainId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        jti: crypto.randomUUID() // Unique token ID
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        issuer: 'myapp.com',
        audience: 'myapp.com'
    });
    
    return token;
}
```

### Session Validation

**Implement secure session validation middleware.**

```javascript
function validateSession(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'myapp.com',
            audience: 'myapp.com'
        });
        
        req.user = {
            address: payload.address,
            chainId: payload.chainId
        };
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
```

## Monitoring and Alerting

### Security Event Logging

**Implement comprehensive security logging.**

```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'security.log' }),
        new winston.transports.Console()
    ]
});

function logSecurityEvent(event, details) {
    securityLogger.warn('Security Event', {
        event,
        details,
        timestamp: new Date().toISOString()
    });
}

// Usage
logSecurityEvent('INVALID_SIGNATURE', {
    address: message.address,
    domain: message.domain,
    ip: req.ip
});
```

### Anomaly Detection

**Monitor for suspicious authentication patterns.**

```javascript
class AnomalyDetector {
    constructor() {
        this.recentAttempts = new Map();
        this.suspiciousAddresses = new Set();
    }
    
    analyzeAttempt(address, success, ip) {
        const key = `${address}:${ip}`;
        const attempts = this.recentAttempts.get(key) || [];
        
        attempts.push({
            timestamp: Date.now(),
            success,
            ip
        });
        
        // Keep only last 100 attempts
        if (attempts.length > 100) {
            attempts.shift();
        }
        
        this.recentAttempts.set(key, attempts);
        
        // Analyze patterns
        const recentFailures = attempts.filter(a => 
            !a.success && Date.now() - a.timestamp < 60000
        ).length;
        
        if (recentFailures > 10) {
            this.suspiciousAddresses.add(address);
            logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                address,
                ip,
                recentFailures
            });
        }
    }
    
    isSuspicious(address) {
        return this.suspiciousAddresses.has(address);
    }
}
```

## Common Vulnerabilities and Mitigations

### Replay Attacks
- **Mitigation**: Use unique nonces and validate expiration times
- **Implementation**: Secure nonce management with proper storage and cleanup

### Domain Spoofing
- **Mitigation**: Strict domain validation and whitelisting
- **Implementation**: Server-side domain verification against allowed domains list

### Message Manipulation
- **Mitigation**: Server-side message creation and validation
- **Implementation**: Never trust client-provided security parameters

### Signature Malleability
- **Mitigation**: Use standardized signature formats and validation
- **Implementation**: Proper signature parsing and ECDSA validation

### Clock Attacks
- **Mitigation**: Implement reasonable time windows and clock skew tolerance
- **Implementation**: Time-based validation with configurable tolerances

---

*For implementation examples, see our [Quickstart Guide](../quickstart/README.md) or [Library Documentation](../libraries/README.md).*