# Etapa 1: Compilar la aplicación con Node.js
FROM node:18-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias e instalarlos
COPY package*.json ./
RUN npm install

# Copiar todo el código del proyecto y compilarlo para producción
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Copiar los archivos compilados desde la etapa 'build' a la carpeta pública de Nginx
# ¡Ojo aquí! Cambia 'nombre-de-tu-proyecto' por el nombre real de tu carpeta en Angular
COPY --from=build /app/dist/nombre-de-tu-proyecto/browser /usr/share/nginx/html/

# Exponer el puerto 80 que usa Nginx por defecto internamente
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
