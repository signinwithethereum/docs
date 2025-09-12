# 🔒 Hosted OIDC Provider
Using the hosted SIWE OIDC Provider

## Overview
We provide a deployed instance of the OpenID Connect Provider (OP) with SIWE support hosted under oidc.siwe.xyz. 

Developers will be able to use a standard OIDC client to connect to the hosted OP. Please see our OIDF Conformance Test Report for more information about supported OIDC features. 

To use the hosted OP, developers are typically interested in the following steps:

- Retrieving the OP configuration.
- Registering the OIDC client with the OP.
- Using the OP configuration to configure the OIDC client.

## OpenID Connect Provider Configuration
The OP supports the OpenID Connect Provider Configuration specification as per OpenID Connect Discovery . To fetch the OP configuration which is required for configuring OIDC clients, developers can make a GET HTTPS request to the following endpoint as follows:

```bash
curl https://oidc.siwe.xyz/.well-known/openid-configuration
```

This will result in the latest OP configuration object that provides information about supported OIDC flows, endpoints, public keys, signing algorithm, client authentication types, etc. as follows:

```json
{
  "issuer": "https://oidc.siwe.xyz/",
  "authorization_endpoint": "https://oidc.siwe.xyz/authorize",
  "token_endpoint": "https://oidc.siwe.xyz/token",
  "userinfo_endpoint": "https://oidc.siwe.xyz/userinfo",
  "jwks_uri": "https://oidc.siwe.xyz/jwk",
  "registration_endpoint": "https://oidc.siwe.xyz/register",
  "scopes_supported": [
    "openid",
    "profile"
  ],
  "response_types_supported": [
    "code",
    "id_token",
    "token id_token"
  ],
  "subject_types_supported": [
    "pairwise"
  ],
  "id_token_signing_alg_values_supported": [
    "RS256"
  ],
  "userinfo_signing_alg_values_supported": [
    "RS256"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "private_key_jwt"
  ],
  "claims_supported": [
    "sub",
    "aud",
    "exp",
    "iat",
    "iss",
    "preferred_username",
    "picture"
  ],
  "op_policy_uri": "https://oidc.siwe.xyz/legal/privacy-policy.pdf",
  "op_tos_uri": "https://oidc.siwe.xyz/legal/terms-of-use.pdf"
}
```

## OpenID Connect Client Registration
To use the hosted OIDC server it is required to register the application as an OIDC client using the OIDC client registration of oidc.siwe.xyz. Currently, no user interface for OIDC client registration is supported. For that reason, developers will need to use the REST API.

To register a new OIDC client, the following request has to be adapted:

```bash
curl -X POST https://oidc.siwe.xyz/register \
   -H 'Content-Type: application/json' \
   -d '{"redirect_uris": ["https://<your.domain>/callback"]}'
```

The OIDC server needs to know whether the user is allowed to be redirected to the URI in the OIDC request after authentication for the specific OIDC client. This must be configured through the redirect_uris parameter.

The response will be a OIDC client metadata object that contains the client_id and client_secret that have to be used to retrieve the OIDC tokens from the token endpoint. Developers have to make sure that those parameters have to be kept secret.

The following is an example response:

```json
{
    "client_id": "5e06b7ec-4202-4eea-86f9-9aeed30a460d",
    "client_secret": "rOzAWw...",
    "registration_access_token": "sEC5pfNmh...",
    "registration_client_uri": "https://oidc.siwe.xyz/client/5e06b7ec-4202-4eea-86f9-9aeed30a460d",
    "redirect_uris": ["https://<your.domain>/callback"]
}
```
A client can then be updated or deleted using the registration_client_uri with the registration_access_token as a Bearer token. 

A variety of metadata options are available. In particular, we make use of the following:
- client_name;
- logo_uri; and
- client_uri.