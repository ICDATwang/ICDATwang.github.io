# Homepage likes API

This Cloudflare Worker stores the academic homepage's global like count in D1.

## Cloudflare resources

- Worker: `weiwang-homepage-likes-api`
- D1 database: `weiwang-homepage-likes`
- D1 binding: `DB`

## Maintenance

Run commands from this directory:

```powershell
pnpm dlx wrangler@latest d1 migrations apply weiwang-homepage-likes --remote
pnpm dlx wrangler@latest deploy
```

The API allows requests from the production GitHub Pages origin and the local
development server. Add future custom domains to `ALLOWED_ORIGINS` before
switching the homepage to a custom domain.
