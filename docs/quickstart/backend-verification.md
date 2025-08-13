# Backend Verification

In this tutorial, you'll build an Express.js backend server that securely validates SIWE signatures and manages user authentication. This is where the real security happens - never trust client-side signature verification in production!

## Learning Objectives

By the end of this tutorial, you'll understand:

-   How to verify SIWE signatures on the server
-   Secure nonce generation and management
-   Creating authentication APIs with proper error handling
-   Best practices for backend SIWE implementation

## Project Setup

Let's create a new Node.js backend project:

```bash
# Create backend directory
mkdir siwe-backend
cd siwe-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express siwe ethers cors helmet express-rate-limit
npm install -D nodemon

# Create basic project structure
mkdir src routes middleware utils
touch src/server.js routes/auth.js middleware/auth.js utils/nonce.js
```

Update `package.json` to add scripts:

```json
{
	"scripts": {
		"start": "node src/server.js",
		"dev": "nodemon src/server.js",
		"test": "echo \"Error: no test specified\" && exit 1"
	}
}
```

## Basic Express Server

Create `src/server.js`:

```javascript
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// Import routes
const authRoutes = require('../routes/auth')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
})
app.use(limiter)

// CORS configuration
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	})
)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		message: 'SIWE Backend is running',
	})
})

// Authentication routes
app.use('/auth', authRoutes)

// Global error handler
app.use((err, req, res, next) => {
	console.error('Global error handler:', err)

	res.status(err.status || 500).json({
		success: false,
		error: {
			message: err.message || 'Internal server error',
			...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
		},
	})
})

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		error: {
			message: 'Route not found',
		},
	})
})

app.listen(PORT, () => {
	console.log(`🚀 SIWE Backend server running on port ${PORT}`)
	console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

module.exports = app
```

## Nonce Management

Create `utils/nonce.js`:

```javascript
const { generateNonce } = require('siwe')

// In-memory storage for demo (use Redis/database in production)
class NonceManager {
	constructor() {
		this.nonces = new Map() // Map<nonce, { timestamp, used }>
		this.cleanupInterval = 5 * 60 * 1000 // 5 minutes
		this.maxAge = 10 * 60 * 1000 // 10 minutes

		// Start cleanup interval
		setInterval(() => this.cleanup(), this.cleanupInterval)
	}

	/**
	 * Generate a new nonce and store it
	 */
	generateNonce() {
		const nonce = generateNonce()
		const timestamp = Date.now()

		this.nonces.set(nonce, {
			timestamp,
			used: false,
		})

		console.log(`Generated nonce: ${nonce}`)
		return nonce
	}

	/**
	 * Validate and consume a nonce
	 */
	validateNonce(nonce) {
		const nonceData = this.nonces.get(nonce)

		if (!nonceData) {
			throw new Error('Invalid nonce: not found')
		}

		if (nonceData.used) {
			throw new Error('Invalid nonce: already used')
		}

		// Check if nonce is expired
		const now = Date.now()
		if (now - nonceData.timestamp > this.maxAge) {
			this.nonces.delete(nonce)
			throw new Error('Invalid nonce: expired')
		}

		// Mark as used
		nonceData.used = true
		this.nonces.set(nonce, nonceData)

		console.log(`Validated and consumed nonce: ${nonce}`)
		return true
	}

	/**
	 * Clean up expired nonces
	 */
	cleanup() {
		const now = Date.now()
		let cleaned = 0

		for (const [nonce, data] of this.nonces.entries()) {
			if (now - data.timestamp > this.maxAge) {
				this.nonces.delete(nonce)
				cleaned++
			}
		}

		if (cleaned > 0) {
			console.log(`Cleaned up ${cleaned} expired nonces`)
		}
	}

	/**
	 * Get statistics about nonce usage
	 */
	getStats() {
		const total = this.nonces.size
		let used = 0
		let expired = 0
		const now = Date.now()

		for (const [nonce, data] of this.nonces.entries()) {
			if (data.used) used++
			if (now - data.timestamp > this.maxAge) expired++
		}

		return {
			total,
			used,
			available: total - used - expired,
			expired,
		}
	}
}

// Export singleton instance
module.exports = new NonceManager()
```

## Authentication Routes

Create `routes/auth.js`:

```javascript
const express = require('express')
const { SiweMessage } = require('siwe')
const nonceManager = require('../utils/nonce')

const router = express.Router()

/**
 * GET /auth/nonce
 * Generate a new nonce for SIWE authentication
 */
router.get('/nonce', (req, res) => {
	try {
		const nonce = nonceManager.generateNonce()

		res.status(200).json({
			success: true,
			nonce,
		})
	} catch (error) {
		console.error('Error generating nonce:', error)
		res.status(500).json({
			success: false,
			error: {
				message: 'Failed to generate nonce',
			},
		})
	}
})

/**
 * POST /auth/verify
 * Verify a SIWE message and signature
 */
router.post('/verify', async (req, res) => {
	try {
		const { message, signature } = req.body

		// Validate input
		if (!message || !signature) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Message and signature are required',
				},
			})
		}

		console.log('Verifying SIWE message:', message)
		console.log('Signature:', signature)

		// Parse the SIWE message
		const siweMessage = new SiweMessage(message)

		// Validate nonce
		try {
			nonceManager.validateNonce(siweMessage.nonce)
		} catch (nonceError) {
			return res.status(400).json({
				success: false,
				error: {
					message: nonceError.message,
				},
			})
		}

		// Validate domain (security critical!)
		const allowedDomains = [
			'localhost:3000',
			'localhost:3001',
			process.env.FRONTEND_DOMAIN,
		].filter(Boolean)

		if (!allowedDomains.includes(siweMessage.domain)) {
			return res.status(400).json({
				success: false,
				error: {
					message: `Invalid domain: ${siweMessage.domain}`,
				},
			})
		}

		// Validate expiration
		if (siweMessage.expirationTime) {
			const expirationTime = new Date(siweMessage.expirationTime)
			if (new Date() > expirationTime) {
				return res.status(400).json({
					success: false,
					error: {
						message: 'Message has expired',
					},
				})
			}
		}

		// Validate not before
		if (siweMessage.notBefore) {
			const notBefore = new Date(siweMessage.notBefore)
			if (new Date() < notBefore) {
				return res.status(400).json({
					success: false,
					error: {
						message: 'Message is not yet valid',
					},
				})
			}
		}

		// Verify the signature
		const verificationResult = await siweMessage.verify({ signature })

		if (!verificationResult.success) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid signature',
					details: verificationResult.error,
				},
			})
		}

		// Success! Return user info
		res.status(200).json({
			success: true,
			user: {
				address: siweMessage.address,
				domain: siweMessage.domain,
				chainId: siweMessage.chainId,
				issuedAt: siweMessage.issuedAt,
				expirationTime: siweMessage.expirationTime,
			},
			message: 'Authentication successful',
		})

		console.log(
			`✅ Successfully authenticated user: ${siweMessage.address}`
		)
	} catch (error) {
		console.error('Error verifying SIWE message:', error)

		// Handle specific SIWE errors
		if (error.type === 'SIWE_INVALID_SIGNATURE') {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid signature',
				},
			})
		}

		if (error.type === 'SIWE_EXPIRED') {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Message has expired',
				},
			})
		}

		// Generic error
		res.status(500).json({
			success: false,
			error: {
				message: 'Verification failed',
				details: error.message,
			},
		})
	}
})

/**
 * POST /auth/logout
 * Logout user (invalidate session)
 */
router.post('/logout', (req, res) => {
	// In a real application, you would:
	// 1. Invalidate the user's session/JWT token
	// 2. Clear any stored user data
	// 3. Log the logout event

	res.status(200).json({
		success: true,
		message: 'Logged out successfully',
	})
})

/**
 * GET /auth/stats
 * Get nonce manager statistics (development only)
 */
router.get('/stats', (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(404).json({
			success: false,
			error: { message: 'Not found' },
		})
	}

	const stats = nonceManager.getStats()
	res.status(200).json({
		success: true,
		stats,
	})
})

module.exports = router
```

## Authentication Middleware

Create `middleware/auth.js` for protecting routes:

```javascript
/**
 * Middleware to protect routes that require authentication
 * In a real app, this would verify JWT tokens or sessions
 */
function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization

	if (!authHeader) {
		return res.status(401).json({
			success: false,
			error: {
				message: 'Authorization header required',
			},
		})
	}

	// In a real implementation, verify JWT token here
	// For demo purposes, we'll just check for a valid format
	const token = authHeader.replace('Bearer ', '')

	if (!token || token.length < 10) {
		return res.status(401).json({
			success: false,
			error: {
				message: 'Invalid authorization token',
			},
		})
	}

	// Add user info to request (would come from JWT payload)
	req.user = {
		address: '0x...', // Would be extracted from verified JWT
	}

	next()
}

/**
 * Middleware to validate Ethereum address format
 */
function validateAddress(addressField = 'address') {
	return (req, res, next) => {
		const address = req.body[addressField] || req.params[addressField]

		if (!address) {
			return res.status(400).json({
				success: false,
				error: {
					message: `${addressField} is required`,
				},
			})
		}

		// Validate Ethereum address format
		if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Invalid Ethereum address format',
				},
			})
		}

		next()
	}
}

module.exports = {
	requireAuth,
	validateAddress,
}
```

## Enhanced Verification with Security Checks

Create `utils/verification.js`:

```javascript
const { SiweMessage } = require('siwe')

/**
 * Enhanced SIWE verification with additional security checks
 */
class SiweVerifier {
	constructor(config = {}) {
		this.config = {
			maxMessageAge: config.maxMessageAge || 10 * 60 * 1000, // 10 minutes
			allowedDomains: config.allowedDomains || ['localhost:3000'],
			allowedChainIds: config.allowedChainIds || [1, 5], // mainnet, goerli
			requireStatement: config.requireStatement || false,
			...config,
		}
	}

	/**
	 * Verify SIWE message with comprehensive validation
	 */
	async verify(message, signature, additionalChecks = {}) {
		try {
			// Parse message
			const siweMessage = new SiweMessage(message)

			// Run all validation checks
			await this.validateMessage(siweMessage, additionalChecks)

			// Verify cryptographic signature
			const verificationResult = await siweMessage.verify({ signature })

			if (!verificationResult.success) {
				throw new Error('Cryptographic signature verification failed')
			}

			return {
				success: true,
				user: {
					address: siweMessage.address,
					chainId: siweMessage.chainId,
					domain: siweMessage.domain,
					issuedAt: siweMessage.issuedAt,
					expirationTime: siweMessage.expirationTime,
					statement: siweMessage.statement,
					resources: siweMessage.resources,
				},
				verificationResult,
			}
		} catch (error) {
			return {
				success: false,
				error: error.message,
			}
		}
	}

	/**
	 * Validate SIWE message structure and content
	 */
	async validateMessage(siweMessage, additionalChecks = {}) {
		// Check domain whitelist
		if (!this.config.allowedDomains.includes(siweMessage.domain)) {
			throw new Error(`Domain '${siweMessage.domain}' not allowed`)
		}

		// Check chain ID whitelist
		if (!this.config.allowedChainIds.includes(siweMessage.chainId)) {
			throw new Error(`Chain ID '${siweMessage.chainId}' not allowed`)
		}

		// Check message age
		const issuedAt = new Date(siweMessage.issuedAt)
		const now = new Date()
		const messageAge = now.getTime() - issuedAt.getTime()

		if (messageAge > this.config.maxMessageAge) {
			throw new Error('Message is too old')
		}

		if (messageAge < 0) {
			throw new Error('Message issued in the future')
		}

		// Check expiration
		if (siweMessage.expirationTime) {
			const expirationTime = new Date(siweMessage.expirationTime)
			if (now > expirationTime) {
				throw new Error('Message has expired')
			}
		}

		// Check not before
		if (siweMessage.notBefore) {
			const notBefore = new Date(siweMessage.notBefore)
			if (now < notBefore) {
				throw new Error('Message is not yet valid')
			}
		}

		// Check statement requirement
		if (this.config.requireStatement && !siweMessage.statement) {
			throw new Error('Statement is required')
		}

		// Additional custom checks
		if (
			additionalChecks.requiredAddress &&
			siweMessage.address.toLowerCase() !==
				additionalChecks.requiredAddress.toLowerCase()
		) {
			throw new Error('Address mismatch')
		}

		if (
			additionalChecks.requiredChainId &&
			siweMessage.chainId !== additionalChecks.requiredChainId
		) {
			throw new Error('Chain ID mismatch')
		}
	}
}

module.exports = SiweVerifier
```

## Testing the Backend

Create a simple test script `test-backend.js`:

```javascript
const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

async function testBackend() {
	try {
		console.log('🧪 Testing SIWE Backend API...\n')

		// Test 1: Health check
		console.log('1. Testing health check...')
		const health = await axios.get(`${BASE_URL}/health`)
		console.log('✅ Health check:', health.data.status)

		// Test 2: Generate nonce
		console.log('\n2. Testing nonce generation...')
		const nonceResponse = await axios.get(`${BASE_URL}/auth/nonce`)
		const nonce = nonceResponse.data.nonce
		console.log('✅ Nonce generated:', nonce)

		// Test 3: Try invalid verification
		console.log('\n3. Testing invalid verification...')
		try {
			await axios.post(`${BASE_URL}/auth/verify`, {
				message: 'invalid message',
				signature: 'invalid signature',
			})
		} catch (error) {
			console.log(
				'✅ Invalid verification properly rejected:',
				error.response.status
			)
		}

		// Test 4: Get stats (dev only)
		console.log('\n4. Testing stats endpoint...')
		const stats = await axios.get(`${BASE_URL}/auth/stats`)
		console.log('✅ Stats:', stats.data.stats)

		console.log('\n🎉 All tests passed!')
	} catch (error) {
		console.error('❌ Test failed:', error.message)
		if (error.response) {
			console.error('Response:', error.response.data)
		}
	}
}

// Run tests
testBackend()
```

## Environment Configuration

Create `.env` file:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
FRONTEND_DOMAIN=localhost:3000

# Security settings
MAX_MESSAGE_AGE=600000
ALLOWED_DOMAINS=localhost:3000,localhost:3001
ALLOWED_CHAIN_IDS=1,5,137

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

Update `src/server.js` to use environment variables:

```javascript
require('dotenv').config()

// Use environment variables for CORS
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	})
)
```

## Running the Backend

Start your backend server:

```bash
# Install additional dependencies
npm install dotenv axios

# Run in development mode
npm run dev
```

Test the endpoints:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test nonce generation
curl http://localhost:3001/auth/nonce

# Test stats endpoint
curl http://localhost:3001/auth/stats
```

## Security Best Practices

### 1. Input Validation

Always validate and sanitize inputs:

```javascript
const validator = require('validator')

function validateMessage(message) {
	if (!message || typeof message !== 'string') {
		throw new Error('Invalid message format')
	}

	if (message.length > 10000) {
		throw new Error('Message too long')
	}

	// Additional validation...
}
```

### 2. Rate Limiting

Implement strict rate limits:

```javascript
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per window
	message: 'Too many authentication attempts',
})

router.post('/verify', authLimiter, async (req, res) => {
	// Verification logic
})
```

### 3. Logging and Monitoring

Add comprehensive logging:

```javascript
const winston = require('winston')

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' }),
	],
})

// Log authentication attempts
logger.info('Authentication attempt', {
	address: siweMessage.address,
	domain: siweMessage.domain,
	timestamp: new Date().toISOString(),
})
```
