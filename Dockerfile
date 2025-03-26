FROM nvidia/opengl:1.2-glvnd-runtime-ubuntu20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apt-get update && \
  apt-get install -y curl gnupg && \
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
  apt-get install -y nodejs


RUN apt-get update && \
  apt-get install -y wget ca-certificates && \
  wget -q -O chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
  apt-get install -y ./chrome.deb && \
  rm chrome.deb


RUN apt-get update && apt-get install -y --no-install-recommends \
  wget ca-certificates \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxss1 libnss3 \
  libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 \
  libasound2 libxshmfence1 libxext6 libxi6 libxtst6 libxkbcommon0 \
  libpangocairo-1.0-0 libglu1-mesa mesa-utils \
  fonts-liberation ffmpeg \
  xvfb \
  && apt-get clean && rm -rf /var/lib/apt/lists/*


WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 4000

CMD ["/start.sh"]
