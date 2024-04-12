# Serve application with Nginx
FROM nginx:latest
WORKDIR /app
COPY ./dist .
COPY nginx/ /etc/nginx/

# Run application with Node.js
FROM node:21-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD [ "npm", "start" ]

