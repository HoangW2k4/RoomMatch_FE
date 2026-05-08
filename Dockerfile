# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist/roommatch-fe ./dist/roommatch-fe

EXPOSE 8080
CMD ["serve", "-s", "dist/roommatch-fe", "-l", "8080"]
