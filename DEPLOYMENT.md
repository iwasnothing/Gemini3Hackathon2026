# Deployment Guide

## Build Output Location

The build output is located in the `.next` directory after running `npm run build`.

## Deployment Options

### Option 1: Vercel (Recommended for Next.js Apps)

Vercel is the recommended platform for Next.js applications as it handles both frontend and API routes seamlessly.

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to deploy

Or deploy via GitHub:
- Push your code to GitHub
- Import the repository at [vercel.com](https://vercel.com)
- Vercel will auto-detect Next.js and deploy

### Option 2: Static Export (CDN Deployment - Frontend Only)

⚠️ **Note**: Static export will NOT include API routes. This means `/api/*` endpoints won't work.

**To enable static export:**

1. Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
```

2. Build static files:
```bash
npm run build
```

3. The output will be in the `out/` directory

4. Upload the entire `out/` directory to your CDN:
   - AWS CloudFront + S3
   - Cloudflare Pages
   - Netlify
   - Any static file hosting service

### Option 3: Docker + Server Deployment

For self-hosting with API routes:

1. Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

2. Update `next.config.js` for standalone output:
```javascript
const nextConfig = {
  output: 'standalone',
}
```

3. Build and run with Docker:
```bash
docker build -t insight-canvas .
docker run -p 3000:3000 insight-canvas
```

### Option 4: Hybrid Approach

If you need API routes but want to use a CDN:

1. Deploy API routes to a serverless platform (Vercel, AWS Lambda, etc.)
2. Deploy frontend as static files to CDN
3. Update API endpoints in the frontend to point to the serverless functions

## Current Build Structure

After `npm run build`, the output structure is:
```
.next/
├── server/        # Server-side code (for API routes)
├── static/        # Static assets (JS, CSS, images)
└── [other files]  # Build metadata and manifests
```

## Important Notes

- **API Routes**: If your app uses `/api/*` routes, you need a Node.js server or serverless functions
- **Static Export**: Only works if you don't use API routes, server-side features, or dynamic routes
- **CDN Deployment**: Pure static CDN deployment won't support API routes - you'll need a backend service
