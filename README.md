# ShipNow API — Arquitectura por Capas

Refactor de la API base de ShipNow a arquitectura **Controller → Service → Repository**, con configuración de entorno validada al arranque y constantes de dominio centralizadas.

## Estructura del proyecto

```
src/
  config/          # Lectura y validación de variables de entorno (único lugar que toca process.env)
  constants/        # Valores fijos del dominio: roles, estados (Object.freeze)
  models/           # Esquemas de Mongoose, sin lógica de negocio
  repositories/     # Único lugar que conoce Mongoose/MongoDB
  services/         # Lógica de negocio (validaciones, reglas, orquestación)
  controllers/      # Manejo de req/res, delega todo al Service
  routes/           # Conectan path + método HTTP con el Controller
  middlewares/       # Manejo centralizado de errores
  app.js            # Configuración de Express
server.js           # Punto de entrada: conecta DB y levanta el server
```

## Instalación y ejecución local

1. Cloná el repositorio y entrá a la carpeta:
   ```bash
   git clone <url-del-repo>
   cd shipnow
   ```

2. Instalá las dependencias:
   ```bash
   npm install
   ```

3. Copiá el archivo de ejemplo y completá tus valores:
   ```bash
   cp .env.example .env
   ```
   Editá `.env` con tu URI real de MongoDB (local o Atlas).

4. Corré el proyecto en modo desarrollo (con recarga automática):
   ```bash
   npm run dev
   ```
   O en modo normal:
   ```bash
   npm start
   ```

5. Probá que esté vivo:
   ```
   GET http://localhost:3000/health
   ```

### Endpoints disponibles

**Productos** (`/api/products`)
- `GET /` — lista todos (`?available=true` filtra solo disponibles)
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

**Usuarios** (`/api/users`)
- `GET /`
- `GET /:id`
- `POST /register`
- `PUT /:id`
- `DELETE /:id`

## ¿Por qué separar lógica entre Service y Repository?

El **Repository** es la única capa que sabe que la base de datos es MongoDB/Mongoose. Su responsabilidad es exclusivamente **buscar y guardar datos** — incluyendo filtros y proyecciones por defecto (por ejemplo, nunca devolver el `passwordHash` de un usuario). Si mañana cambiamos de motor de base de datos, solo se toca esta capa.

El **Service** es donde vive la inteligencia del negocio: qué significa que un producto se quede "sin stock", qué reglas aplican al registrar un usuario, qué status code corresponde ante cada error. El Service llama al Repository, pero nunca sabe cómo está armada la query por dentro.

Esta separación evita el problema clásico del "repository pasamanos" (un método que solo hace `return Model.find()` sin aportar nada) y, sobre todo, evita mezclar reglas de negocio con acceso a datos — lo que haría casi imposible testear la lógica de forma aislada o reutilizarla fuera del contexto HTTP (por ejemplo, desde un script o una cola de mensajes).

## Validación de entorno

Si falta `PORT`, `MONGODB_URI` o `NODE_ENV` en el `.env`, la aplicación **no arranca**: `src/config/env.config.js` valida estas variables al cargar el módulo y lanza un error descriptivo antes de que `server.js` intente conectar a la base o levantar Express.
