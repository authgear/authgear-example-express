# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal example showing how to add user authentication to an Express app using **Authgear** as the OIDC/OAuth 2.0 identity provider. The entire app lives in `app.js`. There are no tests, no build step, and no framework beyond Express.

## Commands

```bash
npm install        # install dependencies
npm run dev        # run with nodemon (auto-reload) — primary dev command
npm start          # run once with node
```

`npm test` is a placeholder and exits with an error — there are no tests.

## Configuration

Runtime config comes entirely from environment variables loaded via `dotenv`. Copy `.env_template` to `.env` and fill in values from the Authgear Portal:

- `AUTHGEAR_CLIENT_ID`, `AUTHGEAR_CLIENT_SECRET` — OAuth client credentials
- `AUTHGEAR_ENDPOINT` — base URL of the Authgear project (all OAuth URLs are built relative to this via `new URL(path, AUTHGEAR_ENDPOINT)`)
- `AUTHGEAR_REDIRECT_URL` — must match the `/auth-redirect` route and be registered in the portal (default `http://localhost:3000/auth-redirect`)

## Architecture

The OAuth Authorization Code flow is implemented by hand against Authgear's OIDC endpoints — there is no Authgear SDK. The four routes in `app.js` are the whole flow:

- `GET /` — if a session access token exists, refreshes it if expired then calls `/oauth2/userinfo` and renders user info; otherwise renders a login link. HTML is returned as inline template strings (no view engine).
- `GET /login` — builds the `/oauth2/authorize` URL (scopes `openid offline_access`, `response_type=code`) and redirects to Authgear.
- `GET /auth-redirect` — the redirect URI; exchanges `?code` for tokens at `/oauth2/token` and stores `access_token`, `refresh_token`, and `expire_at` in the session.
- `GET /logout` — destroys the session and redirects to Authgear's `/oauth2/end_session`.

Tokens are kept server-side in `express-session` (in-memory store). `refreshAccessTokenIfExpired()` compares `req.session.expire_at` (epoch ms) against now and silently performs a `refresh_token` grant when needed. `axios` is used for all HTTP calls to Authgear.

## Known rough edges (this is demo code)

- The session secret is hardcoded in `app.js` rather than read from env.
- Session cookie options are empty (no `secure`/`maxAge`); the default memory store is not production-grade.
- No CSRF/`state` parameter is used in the OAuth flow, and no PKCE.
