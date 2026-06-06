# Etapa 1: Compilar la aplicación con Node.js (Actualizado a Node 20)
FROM node:20-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias e instalarlos
COPY package*.json ./
RUN npm install

# Instalar Angular CLI de forma global para evitar el error 'sh: ng: no encontrado'
RUN npm install -g @angular/cli

# Copiar todo el código del proyecto y compilarlo para producción
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Copiar los archivos compilados usando el nombre REAL de tu proyecto (taller-frontend)
COPY --from=build /app/dist/taller-frontend/browser /usr/share/nginx/html/

# Exponer el puerto 80 que usa Nginx por defecto internamente
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
