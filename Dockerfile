FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/HoangW2k4/RoomMatch_FE"
LABEL org.opencontainers.image.description="RoomMatch Angular frontend"
LABEL org.opencontainers.image.licenses="UNLICENSED"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/roommatch-fe/browser /usr/share/nginx/html
COPY docker-entrypoint.sh /roommatch-entrypoint.sh
RUN chmod +x /roommatch-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/roommatch-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
