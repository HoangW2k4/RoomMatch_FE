# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ARG BUILD_CONFIGURATION=development
RUN npm run build -- --configuration ${BUILD_CONFIGURATION}

FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist/roommatch-fe ./dist/roommatch-fe

EXPOSE 8080
CMD ["serve", "-s", "dist/roommatch-fe", "-l", "8080"]
#docker build -t ghcr.io/hoangw2k4/roommatch_fe:uat .
# docker push ghcr.io/hoangw2k4/roommatch_fe:uat