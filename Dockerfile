# Use official Node image
FROM node:20-bullseye-slim

# Install dependencies including Chrome
RUN apt-get update \
 && apt-get install -y wget gnupg ca-certificates \
 && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update \
 && apt-get install -y google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Expose port
ENV PORT=3000
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
