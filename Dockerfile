# Sử dụng CUDA 12.8 với Ubuntu 22.04 (hỗ trợ NVIDIA tốt nhất)
FROM nvidia/cuda:12.8.0-runtime-ubuntu22.04

# Thiết lập môi trường
ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các thư viện hệ thống cần thiết
RUN apt-get update && apt-get install -y \
  wget curl gnupg2 lsb-release mesa-utils \
  libgl1-mesa-glx libgl1-mesa-dri libgbm1 \
  xserver-xorg-video-dummy xvfb \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
  libgbm-dev libasound2 libatk1.0-0 libcups2 \
  libnss3 libxss1 libxkbcommon0 libpango-1.0-0 \
  libatk-bridge2.0-0 libgtk-3-0 libpulse0 && \
  rm -rf /var/lib/apt/lists/*

# Cài đặt VirtualGL (Nếu bị lỗi, thay thế bằng PPA hoặc Source)
RUN wget https://sourceforge.net/projects/virtualgl/files/3.1/virtualgl_3.1_amd64.deb -O /tmp/virtualgl.deb && \
  dpkg -i /tmp/virtualgl.deb || apt-get -f install -y && \
  rm /tmp/virtualgl.deb

# Cài đặt Google Chrome từ repo chính thức
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | tee /usr/share/keyrings/google-chrome.asc && \
  echo "deb [signed-by=/usr/share/keyrings/google-chrome.asc] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list && \
  apt-get update && apt-get install -y google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*

# Cài đặt Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
  apt-get install -y nodejs

# Cấu hình VirtualGL để hoạt động với NVIDIA
RUN ln -s /usr/lib/libvglfaker.so /usr/lib/libvglfaker.so.1

# Thiết lập biến môi trường cho Puppeteer & GPU
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV DISPLAY=:99
ENV VGL_DISPLAY=:99
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=all
ENV __NV_PRIME_RENDER_OFFLOAD=1
ENV __GLX_VENDOR_LIBRARY_NAME=nvidia
ENV __GL_DEFAULTS_PATH=/usr/share/nvidia

# Cài đặt Node.js và Puppeteer
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Mở cổng dịch vụ
EXPOSE 4000

# Chạy Xvfb + Puppeteer trong container
CMD Xvfb :99 -screen 0 1920x1080x24 & \
  export DISPLAY=:99 && \
  sleep 3 && \
  vglrun node --max-old-space-size=8192 dist/main
