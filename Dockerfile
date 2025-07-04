# Use the official Node.js 20 image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
