FROM node:18

WORKDIR /app

COPY package*.json ./

COPY ./dist .

EXPOSE 3000

CMD [ "node", "dist/main" ]