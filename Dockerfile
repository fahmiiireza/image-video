FROM node:20-alpine

WORKDIR /app

# Add CA certs so HTTPS (like Gemini or Caddy) works
RUN apk add --no-cache ca-certificates

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3123
CMD ["node", "server.js"]
