# 🛤️ Rails

## Overview

Sign-In with Ethereum (SIWE) provides authentication for Rails applications through multiple integration approaches. This documentation covers three primary methods of implementation:

### Requirements

-   Ruby version 2.7.0 or above
-   Rails framework
-   MetaMask wallet

### Gems for Integration

1. `siwe_rails`: Adds local sign-in routes
2. `omniauth-siwe`: Provides OmniAuth strategy for SIWE

## Integration Examples

### 1. Custom Controller Approach

-   Manually add endpoints to generate and verify SIWE messages
-   Handle session-based user logins

### 2. Rails Engine Approach

-   Use `siwe_rails` gem to configure authentication endpoints
-   Simplified setup and configuration

### 3. OmniAuth Integration

-   Utilize `omniauth-siwe` provider
-   Integrate with existing OmniAuth authentication flows

## Setup Steps

### Custom Controller Example

```bash
cd siwe-rails-examples/custom-controller
bundle install
bin/rails db:migrate RAILS_ENV=development
bundle exec rails server
```

### Rails Engine Example

```bash
cd siwe-rails-examples/rails-engine
bundle install
bin/rails db:migrate RAILS_ENV=development
bundle exec rails server
```

### OmniAuth Integration

1. Register as a client with OIDC provider
2. Update configuration with client credentials
3. Start Rails server

## Additional Considerations

-   Supports multiple authentication scenarios
-   Flexible integration options
-   Compatible with Ethereum wallets

## Recommended Resources

-   [SIWE Overview](/general-information/overview)
-   [Security Considerations](/advanced/security-best-practices)
