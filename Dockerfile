# Etapa 1: Compilar la aplicación con Node.js
FROM node:20-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# CONFIGURACIÓN ANTIBLOQUEO
RUN npm config set strict-ssl false
RUN npm config set registry http://registry.npmjs.org/

# Instalar dependencias
RUN npm install

# Instalar Angular CLI de forma global
RUN npm install -g @angular/cli

# Copiar todo el código del proyecto y compilarlo para producción
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine

# 🔥 RUTA CORREGIDA: Copiar TODO lo que esté dentro de dist/taller-frontend
COPY --from=build /app/dist/taller-frontend /usr/share/nginx/html/

# Exponer el puerto 80 que usa Nginx por defecto internamente
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
