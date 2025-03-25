FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Cài Chrome Stable và các dependency cần thiết
RUN apt-get update && apt-get install -y \
  wget \
  curl \
  gnupg \
  xorg \
  xvfb \
  fonts-liberation \
  libx11-dev \
  libxext-dev \
  libnss3 \
  libatk1.0-0 \
  libcups2 \
  libxcomposite1 \
  libxrandr2 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libpangocairo-1.0-0 \
  libx11-xcb1 \
  libxss1 \
  libxkbcommon0 \
  libgbm1 \
  libgtk-3-0 \
  libasound2 \
  xfonts-base \
  ffmpeg \
  --no-install-recommends && \
  curl -sSL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Cài Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
  apt-get install -y nodejs

# Cài yarn
RUN npm install --global yarn

# Thiết lập môi trường hiển thị
ENV DISPLAY=:99

WORKDIR /app

# Copy và cài đặt các dependency
COPY package*.json ./
RUN npm install

# Copy mã nguồn còn lại và build app
COPY . .
RUN npm run build

# Expose cổng ứng dụng
EXPOSE 4000

# Chạy ứng dụng
CMD ["node", "--max-old-space-size=8192", "dist/main"]
