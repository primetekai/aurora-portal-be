FROM node:18

# Update and install dependencies, including FFmpeg
RUN apt-get update && apt-get install -y \
  wget gnupg libnss3 libatk1.0-0 libcups2 libxcomposite1 libxrandr2 libxdamage1 libxi6 \
  libxtst6 libpangocairo-1.0-0 libx11-xcb1 libxss1 libxkbcommon0 libgbm1 libgtk-3-0 libasound2 \
  fonts-liberation xfonts-base xvfb chromium ffmpeg \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Start the virtual frame buffer
RUN Xvfb :99 -screen 0 1920x1080x24 &
ENV DISPLAY=:99

WORKDIR /app

# Copy and install Node packages
COPY package*.json ./
RUN npm install

# Copy the rest of your application
COPY . .

# Build your Node application
RUN npm run build

# Set path to Chromium executable for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 4000

CMD ["node", "--max-old-space-size=8192", "dist/main"]
