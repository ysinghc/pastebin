# Multi-stage build for serving the frontend from nginx.
# Production runs on Cloudflare Workers (see wrangler.jsonc); this image is for
# self-hosting.
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY vite.config.js wrangler.jsonc index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Paste links such as /aB3x_9kLm2Q.py are client-side routes, so anything that
# is not a file falls back to the app.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
