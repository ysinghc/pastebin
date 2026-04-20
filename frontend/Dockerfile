# Multi-stage build for frontend production deployment
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tailwind.config.js postcss.config.js vite.config.js ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src
COPY public ./public
COPY index.html ./

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
