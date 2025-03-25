FROM node:18

ENV DEBIAN_FRONTEND=noninteractive
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Cài đầy đủ lib hỗ trợ WebGL + Chromium headless
RUN apt-get update && apt-get install -y --no-install-recommends \
  wget curl gnupg ca-certificates \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxss1 libnss3 \
  libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 \
  libasound2 libxshmfence1 libxext6 libxi6 libxtst6 libxkbcommon0 \
  libpangocairo-1.0-0 libglu1-mesa mesa-utils \
  fonts-liberation chromium ffmpeg \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Nếu bạn dùng Google Earth Pro Desktop thay vì Web (ít khả năng)
# Bạn cần thêm: libgstreamer*, libproxy*, libsm6, libfontconfig1, libsqlite3-0, ...

# Làm việc tại thư mục app
WORKDIR /app

# Cài dependencies
COPY package*.json ./
RUN npm install

# Copy source code và build
COPY . .
RUN npm run build

# Expose cổng mặc định của app
EXPOSE 4000

# Chạy app với nhiều RAM
CMD ["node", "--max-old-space-size=8192", "dist/main"]
