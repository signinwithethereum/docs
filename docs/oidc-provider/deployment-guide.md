# Deployment Guide

This guide covers deploying the SIWE OIDC Provider in production environments. Choose from multiple deployment options based on your infrastructure needs.

## Deployment Options

The SIWE OIDC Provider can be deployed in three primary modes:

1. **[Railway Template](#railway-template-deployment)** - Preconfigured and easily deployed
2. **[Cloudflare Workers](#cloudflare-workers-deployment)** - Serverless, globally distributed
3. **[Standalone Binary](#standalone-binary-deployment)** - Self-hosted with full control

## Prerequisites

### General Requirements

-   Domain name with HTTPS support
-   Basic knowledge of OIDC flows
-   Client applications that support OpenID Connect

### For Standalone Deployment

-   **Redis** database instance
-   **Docker** or container runtime (recommended)
-   **Reverse proxy** (nginx, Apache, or cloud load balancer)

### For Cloudflare Workers

-   **Cloudflare account** with Workers enabled
-   **Wrangler CLI** installed locally

## Railway Template Deployment

Railway is a platform that allows users to easily deploy and manage services and environments.  

Deploying the SIWE-OIDC template on Railway is the easiest option to deploy the service and is as simple as clicking the button below.  The template is preconfigured and only requires you to create a Railway account if you don't already have one, and enter in a Re-Own (Wallet Connect) project ID.

<a href="https://railway.com/deploy/siwe-oidc?referralCode=98Kre1" target="_blank" rel="noopener noreferrer"><img src="https://railway.com/button.svg" alt="Deploy on Railway" /></a>

## Cloudflare Workers Deployment

Cloudflare Workers provide a serverless, globally distributed deployment option.

### 1. Setup Repository

```bash
# Clone the SIWE OIDC repository
git clone https://github.com/signinwithethereum/siwe-oidc
cd siwe-oidc
```

### 2. Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g @cloudflare/wrangler

# Or install locally in project
npm install --save-dev @cloudflare/wrangler
```

### 3. Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler auth

# Verify authentication
wrangler whoami
```

### 4. Create KV Namespace

KV storage is used for session and client data:

```bash
# Create production KV namespace
wrangler kv:namespace create "SIWE_OIDC_KV"

# Create preview KV namespace for staging
wrangler kv:namespace create "SIWE_OIDC_KV" --preview
```

### 5. Configure wrangler.toml

Update `wrangler.toml` with your account details:

```toml
name = "siwe-oidc-provider"
type = "webpack"
account_id = "your-account-id"
workers_dev = true
route = ""
zone_id = ""

[build]
command = "npm run build"

[build.upload]
format = "service-worker"

[[kv_namespaces]]
binding = "SIWE_OIDC_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

[vars]
SIWEOIDC_BASE_URL = "https://your-worker.your-subdomain.workers.dev"
```

### 6. Deploy to Cloudflare

```bash
# Deploy to production
wrangler publish

# Deploy to preview environment
wrangler publish --env preview
```

### 7. Configure Custom Domain (Optional)

```bash
# Add custom domain
wrangler route add "oidc.yourdomain.com/*" your-zone-id
```

## Standalone Binary Deployment

For self-hosted environments, deploy as a standalone service with Redis.

### 1. Using Docker (Recommended)

#### Quick Start

```bash
# Run with docker-compose (includes Redis)
curl -O https://raw.githubusercontent.com/spruceid/siwe-oidc/main/docker-compose.yml
docker-compose up -d
```

#### Manual Docker Deployment

```bash
# Start Redis container
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Run SIWE OIDC Provider
docker run -d --name siwe-oidc \
  -p 8000:8000 \
  -e SIWEOIDC_ADDRESS="0.0.0.0" \
  -e SIWEOIDC_PORT="8000" \
  -e SIWEOIDC_REDIS_URL="redis://redis:6379" \
  -e SIWEOIDC_BASE_URL="https://oidc.yourdomain.com" \
  --link redis \
  ghcr.io/spruceid/siwe_oidc:latest
```

### 2. Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
    redis:
        image: redis:7-alpine
        restart: unless-stopped
        volumes:
            - redis_data:/data
        healthcheck:
            test: ['CMD', 'redis-cli', 'ping']
            interval: 10s
            timeout: 5s
            retries: 3

    siwe-oidc:
        image: ghcr.io/spruceid/siwe_oidc:latest
        restart: unless-stopped
        ports:
            - '8000:8000'
        environment:
            - SIWEOIDC_ADDRESS=0.0.0.0
            - SIWEOIDC_PORT=8000
            - SIWEOIDC_REDIS_URL=redis://redis:6379
            - SIWEOIDC_BASE_URL=https://oidc.yourdomain.com
            - SIWEOIDC_RSA_PEM=${SIWEOIDC_RSA_PEM:-}
        depends_on:
            - redis
        healthcheck:
            test:
                [
                    'CMD',
                    'curl',
                    '-f',
                    'http://localhost:8000/.well-known/openid-configuration',
                ]
            interval: 30s
            timeout: 10s
            retries: 3

volumes:
    redis_data:
```

Deploy with:

```bash
docker-compose up -d
```

### 3. Binary Installation

For direct binary installation:

```bash
# Download latest release
wget https://github.com/spruceid/siwe-oidc/releases/latest/download/siwe-oidc-linux-x86_64
chmod +x siwe-oidc-linux-x86_64

# Run with environment variables
SIWEOIDC_REDIS_URL=redis://localhost:6379 \
SIWEOIDC_BASE_URL=https://oidc.yourdomain.com \
./siwe-oidc-linux-x86_64
```

## Configuration Options

### Environment Variables

| Variable             | Description                     | Default                  | Required |
| -------------------- | ------------------------------- | ------------------------ | -------- |
| `SIWEOIDC_ADDRESS`   | IP address to bind to           | `127.0.0.1`              | No       |
| `SIWEOIDC_PORT`      | Port to listen on               | `8000`                   | No       |
| `SIWEOIDC_REDIS_URL` | Redis connection URL            | `redis://localhost:6379` | Yes      |
| `SIWEOIDC_BASE_URL`  | Public-facing base URL          | None                     | Yes      |
| `SIWEOIDC_RSA_PEM`   | RSA private key for JWT signing | Auto-generated           | No       |

### Advanced Configuration

#### Custom Signing Key

Generate and use a custom RSA key for JWT signing:

```bash
# Generate RSA private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Use in deployment
export SIWEOIDC_RSA_PEM=$(cat private.pem)
```

#### Redis Configuration

For production, configure Redis with persistence and security:

```bash
# Redis with persistence and password
docker run -d --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  -e REDIS_PASSWORD=your-secure-password \
  redis:7-alpine \
  redis-server --requirepass your-secure-password --appendonly yes
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name oidc.yourdomain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers for OIDC
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName oidc.yourdomain.com

    SSLEngine on
    SSLCertificateFile /path/to/your/cert.pem
    SSLCertificateKeyFile /path/to/your/key.pem

    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://localhost:8000/
    ProxyPassReverse / http://localhost:8000/

    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</VirtualHost>
```

## Local Development

### Development Setup

```bash
# Clone repository
git clone https://github.com/spruceid/siwe-oidc
cd siwe-oidc

# Start development environment with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Edit /etc/hosts for local testing
echo "127.0.0.1 oidc.localhost" >> /etc/hosts
```

### Testing the Deployment

```bash
# Test OIDC configuration endpoint
curl https://oidc.yourdomain.com/.well-known/openid-configuration

# Register a test client
curl -X POST https://oidc.yourdomain.com/register \
  -H 'Content-Type: application/json' \
  -d '{
    "redirect_uris": ["https://yourapp.com/callback"],
    "client_name": "Test Client",
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

## Health Monitoring

### Health Check Endpoints

-   **Status**: `GET /.well-known/openid-configuration` - Returns 200 if service is healthy
-   **Metrics**: Custom monitoring endpoints can be added via environment variables

### Monitoring Setup

```yaml
# docker-compose monitoring addition
services:
    prometheus:
        image: prom/prometheus
        ports:
            - '9090:9090'
        volumes:
            - ./prometheus.yml:/etc/prometheus/prometheus.yml

    grafana:
        image: grafana/grafana
        ports:
            - '3000:3000'
        environment:
            - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Security Considerations

### Production Checklist

-   [ ] **HTTPS Only**: Ensure all traffic uses HTTPS
-   [ ] **Secure Redis**: Use authentication and encryption
-   [ ] **Custom Keys**: Generate and securely store RSA signing keys
-   [ ] **Domain Validation**: Verify redirect URI domains
-   [ ] **Rate Limiting**: Implement request rate limiting
-   [ ] **Monitoring**: Set up logging and alerting
-   [ ] **Backups**: Regular Redis data backups
-   [ ] **Updates**: Keep container images updated

### Important Notes

⚠️ **Frontend-API Domain Requirement**: The frontend application must be served from the same subdomain as the OIDC API endpoint for security reasons.

✅ **Valid**: `app.yourdomain.com` → `oidc.yourdomain.com`  
❌ **Invalid**: `yourapp.com` → `oidc.anotherdomain.com`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure proper CORS headers in reverse proxy
2. **Redis Connection**: Verify Redis is running and accessible
3. **Domain Issues**: Check that frontend and API share subdomain
4. **SSL Issues**: Verify certificate is valid and properly configured

### Debug Mode

Enable debug logging:

```bash
# Add debug environment variable
RUST_LOG=debug \
SIWEOIDC_REDIS_URL=redis://localhost:6379 \
./siwe-oidc
```
