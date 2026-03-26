# Quickstart Guide

Build a complete Sign in with Ethereum (SIWE) authentication flow in a single Next.js app — wallet connection, message signing, server-side verification, and session management.

## What You'll Build

A Next.js application where users can:

- **Connect their wallet** using RainbowKit
- **Sign a SIWE message** to prove they own an Ethereum address
- **Authenticate** via server-side signature verification
- **Maintain a session** across requests using iron-session

## Stack

| Layer | Library |
|-------|---------|
| SIWE | [`@signinwithethereum/siwe`](https://github.com/signinwithethereum/siwe) v4 |
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Wallet hooks | [wagmi](https://wagmi.sh) + [viem](https://viem.sh) |
| Wallet UI | [RainbowKit](https://www.rainbowkit.com) |
| Sessions | [iron-session](https://github.com/vvo/iron-session) |

## Prerequisites

- **Node.js** 18+
- **Browser wallet** — MetaMask or any Ethereum wallet extension
- **TypeScript** — basic familiarity

## Tutorial

### 1. [Frontend](frontend)

Set up the Next.js project with wagmi and RainbowKit. Create a SIWE sign-in component that constructs messages and requests wallet signatures.

### 2. [Backend](backend)

Add Next.js API route handlers for nonce generation, signature verification, and session management — all in the same project.

## Code Repository

All tutorial code is available on GitHub:

```bash
git clone https://github.com/signinwithethereum/siwe-quickstart
cd siwe-quickstart
npm install
npm run dev
```

## Getting Help

- **Documentation**: [TypeScript Library](/libraries/typescript)
- **Issues**: [GitHub](https://github.com/signinwithethereum/siwe)
- **Integrations**: [NextAuth.js, Auth0, Discourse](../integrations/index.md)
