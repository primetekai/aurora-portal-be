FROM node:18

RUN apt-get update && apt-get install -y \
  wget gnupg libnss3 libatk1.0-0 libcups2 libxcomposite1 libxrandr2 libxdamage1 libxi6 \
  libxtst6 libpangocairo-1.0-0 libx11-xcb1 libxss1 libxkbcommon0 libgbm1 libgtk-3-0 libasound2 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' && \
  apt-get update && apt-get install -y google-chrome-stable && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 4000

CMD ["node", "--max-old-space-size=8192", "dist/main"]
