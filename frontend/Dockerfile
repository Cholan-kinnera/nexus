FROM node:20-alpine AS build

WORKDIR /app

# Declare build-time arguments for Vite environment
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Serve stage
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
