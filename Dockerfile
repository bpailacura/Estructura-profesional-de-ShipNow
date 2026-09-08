# syntax=docker/dockerfile:1

# ============================================================
# Etapa 1: "deps" — instala SOLO las dependencias de producción.
# Se descarta al final del build; su cache de npm y sus capas
# intermedias nunca llegan a la imagen final.
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

# Copiamos primero SOLO los manifests. Docker cachea esta capa:
# mientras package*.json no cambien, "npm ci" no se vuelve a correr
# en builds posteriores, aunque cambie el código fuente.
COPY package*.json ./

# --omit=dev: no instala mocha/nodemon/supertest/etc, solo lo que la
# app necesita para correr. npm ci (no npm install): instala
# exactamente lo que dice package-lock.json, sin tocarlo -- reproducible.
RUN npm ci --omit=dev


# ============================================================
# Etapa 2: "runtime" — imagen final, liviana. Arranca de una base
# limpia (no hereda nada de la etapa "deps" salvo lo que copiamos
# explícitamente con --from=deps), y es la única que termina
# publicada/ejecutada.
# ============================================================
FROM node:20-alpine AS runtime

WORKDIR /usr/src/app

# Copiamos únicamente node_modules ya resuelto desde la etapa "deps"
# -- nunca corremos npm acá, así la imagen final no necesita nada
# del toolchain de instalación.
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Ahora sí, el código fuente de la app.
COPY . .

# uploads/ y logs/ se montan como volumen en runtime (ver README/
# docker-compose), pero las creamos igual acá por si el contenedor
# arranca sin volumen montado. chown al usuario "node" (no-root, ya
# viene en la imagen base) para que esas carpetas y el resto del
# código sean escribibles/legibles por el proceso que corre la app.
RUN mkdir -p uploads logs && chown -R node:node /usr/src/app

# Nunca correr como root dentro del contenedor.
USER node

# Puerto por defecto de la app (ver .env.example). El valor real en
# runtime lo define la variable de entorno PORT que se le pase al
# `docker run` / `docker-compose`.
EXPOSE 3000

# Healthcheck propio del contenedor: usa el mismo endpoint /health de
# la app (sin depender de curl/wget, que Alpine no trae instalados
# por defecto).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Arranca la API (conecta a Mongo y levanta Express -- ver server.js).
CMD ["node", "server.js"]
