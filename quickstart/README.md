# Quickstart Guide

This comprehensive quickstart guide will walk you through implementing Sign in with Ethereum (SIWE) authentication from scratch. By the end of this tutorial, you'll have a complete authentication system that allows users to sign in using their Ethereum wallets.

## What You'll Build

In this tutorial series, you'll create:

- **SIWE Message Generation**: Learn to create properly formatted authentication messages
- **Frontend Wallet Integration**: Connect to user wallets and request signatures  
- **Backend Verification Server**: Validate signatures and manage user sessions
- **Complete Auth Flow**: Connect frontend and backend for seamless authentication
- **Session Management**: Maintain user sessions across requests
- **ENS Integration**: Resolve Ethereum Name Service profiles
- **NFT Verification**: Check user NFT ownership for access control

## Prerequisites

Before starting this tutorial, you should have:

### Technical Knowledge
- **JavaScript/TypeScript**: Intermediate familiarity with ES6+ features
- **Node.js**: Experience with Node.js and npm/yarn package management  
- **Web Development**: Basic understanding of HTTP, APIs, and browser technologies
- **Blockchain Basics**: Basic understanding of Ethereum addresses and transactions

### Development Environment
- **Node.js**: Version 16 or higher
- **Package Manager**: npm or yarn installed
- **Code Editor**: VS Code or similar IDE
- **Web Browser**: Chrome, Firefox, or Edge with Web3 wallet extension

### Optional Wallet Setup
- **MetaMask**: Browser extension for testing (or any Web3 wallet)
- **Test ETH**: Small amount on testnets for transaction fees (not required for authentication)

## Tutorial Structure

This quickstart is divided into 7 progressive lessons:

### 1. [Creating a SIWE Message](1-creating-messages.md)
Learn the fundamentals of SIWE message creation using the official library. You'll understand the message format, required fields, and security considerations.

**Estimated Time**: 15 minutes  
**What You'll Learn**: Message formatting, nonce generation, security best practices

### 2. [Frontend Setup](2-frontend-setup.md)  
Build a React frontend that connects to user wallets and requests message signatures. Covers wallet connection, address detection, and signature requests.

**Estimated Time**: 25 minutes  
**What You'll Learn**: Wallet integration, ethers.js usage, React implementation

### 3. [Backend Verification](3-backend-verification.md)
Create an Express.js server that verifies SIWE signatures and manages nonces. Includes API endpoints for nonce generation and signature verification.

**Estimated Time**: 20 minutes  
**What You'll Learn**: Signature verification, API design, nonce management

### 4. [Connecting Frontend & Backend](4-connecting-frontend-backend.md)
Connect your frontend and backend to create a complete authentication flow. Implement proper error handling and user feedback.

**Estimated Time**: 15 minutes  
**What You'll Learn**: API integration, error handling, user experience

### 5. [Session Management](5-session-management.md)
Add session management to maintain user authentication state across requests. Implement login/logout functionality and protected routes.

**Estimated Time**: 20 minutes  
**What You'll Learn**: Session handling, authentication middleware, security

### 6. [ENS Profile Resolution](6-ens-resolution.md)
Enhance your application by resolving user ENS names and avatar images. Learn to display rich user profiles from Ethereum Name Service.

**Estimated Time**: 25 minutes  
**What You'll Learn**: ENS integration, profile resolution, metadata handling

### 7. [NFT Integration](7-nft-integration.md)
Implement NFT-based access control by verifying user token ownership. Learn to query NFT balances and create gated content.

**Estimated Time**: 30 minutes  
**What You'll Learn**: NFT verification, OpenSea API, access control

## Alternative Paths

Depending on your needs, you can follow different paths through this tutorial:

### 🚀 **Basic Authentication** (Parts 1-4)
Perfect for simple Web3 authentication needs. Covers core SIWE implementation with message signing and verification.

### 🔐 **Production Ready** (Parts 1-5)  
Adds session management for production applications. Recommended for most real-world use cases.

### 🎨 **Enhanced Experience** (Parts 1-6)
Includes ENS integration for rich user profiles. Great for social and identity-focused applications.

### 🎯 **Token Gated** (Full Series)
Complete implementation with NFT-based access control. Ideal for exclusive communities and premium content.

## Code Repository

All tutorial code is available in our GitHub repository:

```bash
# Clone the tutorial repository
git clone https://github.com/spruceid/siwe-quickstart
cd siwe-quickstart

# Install dependencies
npm install

# Start the development environment
npm run dev
```

Each tutorial part has its own branch with the completed code for that section.

## Getting Help

If you run into issues during the tutorial:

- **Documentation**: Check our comprehensive [Library Documentation](../libraries/README.md)
- **Community**: Join our Discord server for real-time help
- **Issues**: Report bugs or request clarifications on GitHub
- **Examples**: Browse working implementations in our [Community Showcase](../community/showcase.md)

## Next Steps

Ready to start building? Begin with [Part 1: Creating a SIWE Message](1-creating-messages.md) to learn the fundamentals of SIWE message creation.

After completing this tutorial, explore:

- [Security Best Practices](../advanced/security-best-practices.md) for production deployment
- [Integration Guides](../integrations/README.md) for popular frameworks  
- [Advanced Topics](../advanced/oidc-provider.md) for enterprise features

---

*Let's build the future of Web3 authentication together! Start with [Creating a SIWE Message](1-creating-messages.md).*