# Multi-stage build for mc-web-console-front (Echo version)
# Stage 1: Node build (webpack bundling)
FROM node:18-alpine AS node-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install || yarn install

# Copy source files and build with webpack
COPY webpack.config.js .babelrc postcss.config.js ./
COPY assets ./assets
RUN npm run build

# Stage 2: Go build
FROM golang:1.25.0-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Copy webpack-built assets from node-builder
COPY --from=node-builder /app/public ./public

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o front cmd/app/main.go

# Stage 2: Runtime
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/front .

# Copy embedded assets (templates, public, locales)
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/public ./public
COPY --from=builder /app/locales ./locales

# Environment variables (can be overridden)
ENV FRONT_ADDR=0.0.0.0
ENV FRONT_PORT=3001
ENV API_ADDR=localhost
ENV API_PORT=3000

# Expose port
EXPOSE 3001

# Run the application
CMD ["./front"]
