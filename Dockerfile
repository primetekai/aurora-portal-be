# Use Ubuntu 20.04 LTS as a base image
FROM ubuntu:20.04

# Avoid interactive dialogue
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary tools and libraries
RUN apt-get update && apt-get install -y \
  wget curl gnupg xorg xserver-xorg xvfb libx11-dev libxext-dev \
  libnss3 libatk1.0-0 libcups2 libxcomposite1 libxrandr2 libxdamage1 libxi6 \
  libxtst6 libpangocairo-1.0-0 libx11-xcb1 libxss1 libxkbcommon0 libgbm1 libgtk-3-0 libasound2 \
  fonts-liberation xfonts-base ffmpeg \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js and npm from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs

# Set environment variable for the display
ENV DISPLAY=:99

# Start Xvfb for virtual framebuffer
RUN Xvfb :99 -screen 0 1920x1080x24 &

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Puppeteer which includes Chromium
RUN npm install puppeteer

# Install other npm dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Build your application
RUN npm run build

# Set the path to Puppeteer's Chromium executable to use by Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH="$(npm root)/puppeteer/.local-chromium/linux-*/chrome-linux/chrome"

# Expose port 4000 for your application
EXPOSE 4000

# Command to run your Node.js application
CMD ["node", "--max-old-space-size=8192", "dist/main"]
