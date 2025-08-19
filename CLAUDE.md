# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the documentation site for **Sign in with Ethereum (SIWE)**, built with Docusaurus 3.8.1. The site provides comprehensive documentation for implementing SIWE authentication, libraries, integrations, and guides for connecting Web3 identity with onchain data.

## Development Commands

- `npm start` - Start development server (hot reload)
- `npm run build` - Build production site
- `npm run serve` - Serve built site locally  
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run Jest tests for validation engine
- `npm run test:watch` - Run tests in watch mode
- `npm run clear` - Clear Docusaurus cache
- `npm run deploy` - Deploy to hosting

## Architecture

### Content Structure
- `docs/` - All documentation content in Markdown/MDX format
  - `index.md` - Homepage/landing page
  - `quickstart/` - Step-by-step implementation guides
  - `libraries/` - Language-specific library documentation (TypeScript, Rust, Python, Ruby, Go, Elixir)
  - `integrations/` - Third-party service integrations (NextAuth.js, Auth0, Discourse)
  - `oidc-provider/` - OpenID Connect provider documentation
  - `security-considerations.md` - Security best practices

### Site Configuration
- `docusaurus.config.ts` - Main Docusaurus configuration with navbar, footer, Algolia search, and theme settings
- `sidebars.ts` - Navigation sidebar structure definition
- `src/components/` - Custom React components including PageActions for AI integration
- `static/img/` - Static assets and images

### Key Features
- **SIWE Validator Tool** (`src/components/SiweValidator/`) - Interactive message validation and linting tool with comprehensive EIP-4361 compliance checking, security analysis, and auto-fix capabilities
- **PageActions Component** (`src/components/PageActions.tsx`) - Provides AI integration buttons (ChatGPT, Claude) and markdown viewing for each documentation page
- **Algolia Search** - Configured for site-wide documentation search
- **Multi-language Code Examples** - Syntax highlighting for Solidity, Rust, Ruby, Elixir
- **External Links** - Integration with GitHub, npm packages, and EIP-4361 specification

### MDX vs Markdown
- Most library docs use `.mdx` extension for enhanced React component support
- Integration docs also use `.mdx` for interactive elements
- General documentation uses `.md`

## Development Notes

- Documentation follows the Sign in with Ethereum standard (EIP-4361)
- Content emphasizes security, self-sovereign identity, and onchain data integration
- Site is deployed to `https://docs.siwe.xyz`
- TypeScript configuration extends Docusaurus defaults
- No custom CSS preprocessing - uses Docusaurus theming system