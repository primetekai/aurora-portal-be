# Sử dụng Node + Chromium + GPU NVIDIA
FROM nvidia/cuda:12.7.0-runtime-ubuntu24.04

# Cài đặt các thư viện cần thiết
RUN apt-get update && apt-get install -y \
  wget curl gnupg2 lsb-release mesa-utils \
  libgl1-mesa-glx libgl1-mesa-dri libgbm1 \
  xserver-xorg-video-dummy xvfb virtualgl \
  google-chrome-stable

# Tải và cài đặt Puppeteer và các thư viện Node.js
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Cấu hình Puppeteer để dùng GPU NVIDIA
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV DISPLAY=:99
ENV NVIDIA_DRIVER_CAPABILITIES=compute,graphics,utility,video
ENV VGL_DISPLAY=:99

# Mở cổng dịch vụ
EXPOSE 4000

# Chạy Xvfb + Puppeteer trong container
CMD Xvfb :99 -screen 0 1920x1080x24 & \
  export DISPLAY=:99 && \
  vglrun node --max-old-space-size=8192 dist/main
