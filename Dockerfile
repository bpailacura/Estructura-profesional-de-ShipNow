# Imagen base de Node. Alpine: liviana, reduce superficie de ataque y
# tamaño de imagen final. LTS (20) para estabilidad en producción.
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor.
WORKDIR /usr/src/app

# Copiamos primero SOLO los manifests de dependencias. Docker cachea esta
# capa: mientras package*.json no cambien, "npm ci" no se vuelve a correr
# en builds posteriores, aunque cambie el código fuente.
COPY package*.json ./

# --omit=dev: no instala mocha/nodemon/supertest/etc, solo lo que la app
# necesita para correr. npm ci (no npm install): instala exactamente lo
# que dice package-lock.json, sin tocarlo -- reproducible entre builds.
RUN npm ci --omit=dev

# Ahora sí copiamos el resto del código fuente.
COPY . .

# uploads/ y logs/ se montan como volumen en runtime (ver README), pero
# las creamos igual acá por si el contenedor arranca sin volumen montado.
# chown al usuario "node" (no-root, ya viene en la imagen base) para que
# tanto esas carpetas como el resto del código sean escribibles/legibles
# por el proceso que realmente va a correr la app.
RUN mkdir -p uploads logs && chown -R node:node /usr/src/app

# Nunca correr como root dentro del contenedor.
USER node

# Puerto por defecto de la app (ver .env.example). El valor real en
# runtime lo define la variable de entorno PORT que se le pase al `docker run`.
EXPOSE 3000

# Healthcheck propio del contenedor: usa el mismo endpoint /health de la
# app (sin depender de curl/wget, que Alpine no trae instalados por defecto).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Arranca la API (conecta a Mongo y levanta Express -- ver server.js).
CMD ["node", "server.js"]
