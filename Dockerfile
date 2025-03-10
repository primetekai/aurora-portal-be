# Sử dụng Node 18 với Chromium
FROM node:18

# Cập nhật và cài đặt các thư viện cần thiết
RUN apt-get update && apt-get install -y \
  wget gnupg libnss3 libatk1.0-0 libcups2 libxcomposite1 libxrandr2 libxdamage1 libxi6 \
  libxtst6 libpangocairo-1.0-0 libx11-xcb1 libxss1 libxkbcommon0 libgbm1 libgtk-3-0 libasound2 \
  fonts-liberation xfonts-base ffmpeg mesa-utils xvfb \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Cài đặt Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' && \
  apt-get update && apt-get install -y google-chrome-stable && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Cài đặt NestJS CLI trước khi build
RUN npm install -g @nestjs/cli

# Cài đặt các gói npm
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn
COPY . .

# Build ứng dụng
RUN npm run build

# Thiết lập đường dẫn Puppeteer để sử dụng Chrome cài đặt sẵn
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV DISPLAY=:99

# Expose port nếu cần API
EXPOSE 4000

# Chạy Xvfb để hỗ trợ WebGL trong Docker
CMD Xvfb :99 -screen 0 1920x1080x24 & node --max-old-space-size=8192 dist/main
