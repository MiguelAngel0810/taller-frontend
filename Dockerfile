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


# Copia todo el contenido de la compilación buscando directamente los archivos web
# Esto evita fallos por mayúsculas, minúsculas o subcarpetas sorpresa
COPY --from=build /app/dist/*/* /usr/share/nginx/html/
COPY --from=build /app/dist/*/*/* /usr/share/nginx/html/
COPY --from=build /app/dist/* /usr/share/nginx/html/

# Exponer el puerto 80 que ya tienes configurado en Coolify
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
