FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080
# nginx's default entrypoint auto-renders /etc/nginx/templates/*.template with envsubst
# on the container's env vars (PORT, BACKEND_HOST, AI_HOST) before running the default CMD.
