# Quickstart Guide

This comprehensive quickstart guide will walk you through implementing Sign in with Ethereum (SIWE) authentication from scratch. By the end of this tutorial, you'll have a complete authentication system that allows users to sign in using their Ethereum wallets.

## What You'll Build

In this tutorial series, you'll create:

- **SIWE Message Generation**: Learn to create properly formatted authentication messages
- **Frontend Wallet Integration**: Connect to user wallets and request signatures  
- **Backend Verification Server**: Validate signatures and manage user sessions
- **Complete Auth Flow**: Connect frontend and backend for seamless authentication
- **Session Management**: Maintain user sessions across requests

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

### 1. [Creating a SIWE Message](creating-messages)
Learn the fundamentals of SIWE message creation using the official library. You'll understand the message format, required fields, and security considerations.

**Estimated Time**: 15 minutes  
**What You'll Learn**: Message formatting, nonce generation, security best practices

### 2. [Frontend Setup](frontend-setup)  
Build a React frontend that connects to user wallets and requests message signatures. Covers wallet connection, address detection, and signature requests.

**Estimated Time**: 25 minutes  
**What You'll Learn**: Wallet integration, ethers.js usage, React implementation

### 3. [Backend Verification](backend-verification)
Create an Express.js server that verifies SIWE signatures and manages nonces. Includes API endpoints for nonce generation and signature verification.

**Estimated Time**: 20 minutes  
**What You'll Learn**: Signature verification, API design, nonce management

### 4. [Connecting Frontend & Backend](connect-the-frontend.md)
Connect your frontend and backend to create a complete authentication flow. Implement proper error handling and user feedback.

**Estimated Time**: 15 minutes  
**What You'll Learn**: API integration, error handling, user experience

### 5. [Session Management](implement-sessions.md)
Add session management to maintain user authentication state across requests. Implement login/logout functionality and protected routes.

**Estimated Time**: 20 minutes  
**What You'll Learn**: Session handling, authentication middleware, security

### 6. [ENS Profile Resolution](resolve-ens-profiles.mdx)
Enhance your application by resolving user ENS names and avatar images. Learn to display rich user profiles from Ethereum Name Service.

**Estimated Time**: 25 minutes  
**What You'll Learn**: ENS integration, profile resolution, metadata handling

## Alternative Paths

Depending on your needs, you can follow different paths through this tutorial:

## Code Repository

All tutorial code is available in our GitHub repository:

```bash
# Clone the tutorial repository
git clone https://github.com/signinwithethereum/siwe-quickstart
cd siwe-quickstart

# Install dependencies
npm install

# Start the development environment
npm run dev
```

Each tutorial part has its own branch with the completed code for that section.

## Getting Help

If you run into issues during the tutorial:

- **Documentation**: Check our comprehensive [Library Documentation](../libraries/index.md)
- **Issues**: Report bugs or request clarifications on [GitHub](https://github.com/signinwithethereum/siwe)
- **Examples**: Browse working implementations in our [Integrations](../integrations/index.md)

