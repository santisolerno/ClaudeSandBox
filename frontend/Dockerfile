# syntax=docker/dockerfile:1

# ---------- Stage: deps ----------
# Instala dependencias. Cacheable cuando no cambia package.json.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ---------- Stage: dev ----------
# Usado por docker-compose en local. Vite dev server con HMR.
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---------- Stage: build ----------
# Compila el bundle de producción.
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage: prod ----------
# Imagen final que se despliega en DO App Platform.
# Sirve los estáticos con nginx.
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
