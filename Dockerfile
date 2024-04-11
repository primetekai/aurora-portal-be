FROM nginx:latest

WORKDIR /app

COPY ./dist .

# COPY nginx/ /etc/nginx/

# RUN npm sequelize-cli db:migrate

# RUN docker compose -p node-apps up -d

