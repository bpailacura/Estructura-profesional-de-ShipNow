# ShipNow API — Arquitectura por Capas

Refactor de la API base de ShipNow a arquitectura **Controller → Service → Repository**, con configuración de entorno validada al arranque y constantes de dominio centralizadas.

## Estructura del proyecto

```
src/
  config/          # Lectura/validación de env vars y configuración centralizada del logger (Winston)
  constants/        # Valores fijos del dominio: roles, estados, prioridades (Object.freeze)
  models/           # Esquemas de Mongoose, sin lógica de negocio (User, Product, Order, Delivery)
  repositories/     # Único lugar que conoce Mongoose/MongoDB
  services/         # Lógica de negocio (validaciones, reglas, orquestación)
  controllers/      # Manejo de req/res, delega todo al Service
  routes/           # Conectan path + método HTTP con el Controller
  errors/           # Errores personalizados del dominio + diccionario de errores
  middlewares/       # Middleware global que transforma errores en respuestas HTTP uniformes (y los loguea)
  mocks/            # Módulo de mocking: factories de datos + servicio de generación/carga
    factories/       # Construyen objetos simulados con forma de los modelos reales
    mock.service.js  # Orquesta preview (sin guardar) y seed (inserta en Mongo)
  app.js            # Configuración de Express
server.js           # Punto de entrada: conecta DB y levanta el server
logs/               # Archivos de log generados por Winston (ignorados por Git, ver más abajo)
```

> **Nota sobre el dominio:** el proyecto ya tenía `User` y `Product`. Para esta pre-entrega (mocking de pedidos, entregas y repartidores) se agregaron los modelos `Order` (pedido) y `Delivery` (entrega), y el rol `DELIVERY_PERSON` (repartidor), siguiendo la misma arquitectura por capas del módulo anterior.

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

**Mocking** (`/api/mocks`)

Módulo para generar datos de prueba (usuarios, repartidores, pedidos y entregas) sin cargarlos a mano. Usa [`@faker-js/faker`](https://fakerjs.dev/) para generar valores realistas y las constantes de `src/constants` para roles, estados y prioridades (nunca strings sueltos).

| Método | Endpoint | Qué hace |
|---|---|---|
| `GET` | `/api/mocks/users?count=10&role=DELIVERY_PERSON` | Devuelve `count` usuarios simulados. **No los guarda.** `role` es opcional (`ADMIN`, `USER`, `DELIVERY_PERSON`); si no se manda, se sortea con una distribución realista. |
| `GET` | `/api/mocks/orders?count=10` | Devuelve `count` pedidos simulados con `items`, `status` y `priority` válidos. **No los guarda.** Las relaciones (`customer`) apuntan a ids simulados, solo para mostrar la forma del dato. |
| `GET` | `/api/mocks/deliveries?count=10` | Devuelve `count` entregas simuladas, con `status` coherente respecto al pedido. **No las guarda.** |
| `POST` | `/api/mocks/seed` | Genera **e inserta en MongoDB** un set de datos relacionado de punta a punta: usuarios (con al menos un cliente y un repartidor), pedidos asociados a esos clientes y entregas asociadas a esos pedidos y repartidores. |

Body opcional para `POST /api/mocks/seed` (todos los campos son opcionales, se limitan entre 1 y 50 para evitar cargas descontroladas):
```json
{
  "usersCount": 15,
  "ordersCount": 10,
  "deliveriesCount": 8
}
```
Respuesta: un resumen (`summary`) con las cantidades creadas y una muestra (`sample`) de un documento de cada tipo insertado.

**Logging** (`/api/logger`)

| Método | Endpoint | Qué hace |
|---|---|---|
| `GET` | `/api/logger/test` | Endpoint interno (no es funcionalidad de negocio): dispara un log de prueba en cada uno de los 6 niveles configurados, para verificar rápido que el logger está bien seteado. |

**Cómo probarlo rápido (con el server corriendo):**
```bash
curl "http://localhost:3000/api/mocks/users?count=3"
curl "http://localhost:3000/api/mocks/orders?count=2"
curl "http://localhost:3000/api/mocks/deliveries?count=2"
curl -X POST http://localhost:3000/api/mocks/seed \
  -H "Content-Type: application/json" \
  -d '{"usersCount": 15, "ordersCount": 10, "deliveriesCount": 8}'
```

> Los usuarios mockeados se crean con la contraseña de prueba `Mock1234!` (hasheada con bcrypt, costo bajo a propósito porque no son credenciales reales). Nunca se devuelve el `passwordHash`, ni siquiera en las respuestas de preview.

## ¿Por qué separar lógica entre Service y Repository?

El **Repository** es la única capa que sabe que la base de datos es MongoDB/Mongoose. Su responsabilidad es exclusivamente **buscar y guardar datos** — incluyendo filtros y proyecciones por defecto (por ejemplo, nunca devolver el `passwordHash` de un usuario). Si mañana cambiamos de motor de base de datos, solo se toca esta capa.

El **Service** es donde vive la inteligencia del negocio: qué significa que un producto se quede "sin stock", qué reglas aplican al registrar un usuario, y qué error de dominio corresponde lanzar en cada caso (el *statusCode* HTTP asociado vive en el diccionario de errores, no en el Service — ver sección siguiente). El Service llama al Repository, pero nunca sabe cómo está armada la query por dentro.

Esta separación evita el problema clásico del "repository pasamanos" (un método que solo hace `return Model.find()` sin aportar nada) y, sobre todo, evita mezclar reglas de negocio con acceso a datos — lo que haría casi imposible testear la lógica de forma aislada o reutilizarla fuera del contexto HTTP (por ejemplo, desde un script o una cola de mensajes).

## Manejo de errores centralizado

Ninguna ruta ni controller arma respuestas de error a mano. Todos hacen `next(error)` en el `catch`, y quien decide el `statusCode` y la forma de la respuesta es un único middleware global (`src/middlewares/error.middleware.js`, montado al final de `app.js`).

**Capa de errores (`src/errors/`):**

- `errorDictionary.js` — diccionario que mapea un código de error (ej. `USER_NOT_FOUND`) a su `statusCode` y mensaje por defecto. Es el único lugar donde se decide "este tipo de error responde con tal código".
- `AppError.js` — clase base: se instancia con una clave del diccionario y busca ahí el `statusCode`/mensaje, permitiendo overridear el mensaje o agregar `details` puntuales (ej. qué campo falló).
- `domainErrors.js` — errores personalizados del dominio, agrupados por familia: `NotFoundError` (404: usuario/producto/pedido inexistente), `ValidationError` (400: datos inválidos, cantidad de mocks inválida), `ConflictError` (409: email duplicado), `DatabaseError` (502: falla real de Mongo durante el seed de mocks).

Los `services` (`user.service.js`, `product.service.js`) y el módulo de mocks (`mock.service.js`, apoyado en `mock.validation.js`) lanzan estos errores directamente — nunca arman ellos mismos la respuesta HTTP.

**Middleware global (`error.middleware.js`):** recibe cualquier error que llegue por `next(error)`, lo normaliza (si ya es un `AppError` lo usa tal cual; si es un error de Mongoose/Mongo —`CastError`, `ValidationError` de schema, clave duplicada `11000`— lo traduce a un `AppError` equivalente; cualquier otra cosa cae en un `INTERNAL_ERROR` genérico) y responde siempre con la misma forma:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuario no encontrado",
    "details": { "opcional": "solo si aplica" }
  }
}
```

El stack completo del error solo se loguea en el server (nunca se manda al cliente), y únicamente cuando el `statusCode` es 5xx.

### Validaciones del módulo de mocks

`mock.service.js` ya no clampea cantidades inválidas en silencio: `mock.validation.js` exporta `parseCount`, que valida que el valor recibido sea un entero dentro de rango (1 a 50) y, si no lo es (no numérico, negativo, decimal, o fuera de rango), lanza un `ValidationError` con código `INVALID_MOCK_COUNT` explicando qué campo falló y qué valor llegó. Esto aplica tanto a los endpoints de preview (`count`) como al `seed` (`usersCount`, `ordersCount`, `deliveriesCount`).

Si durante el `seed` ocurre una falla real contra MongoDB (por ejemplo, se corta la conexión a mitad de la inserción), se atrapa y se relanza como `DatabaseError` (`MOCK_SEED_FAILURE`, 502), en vez de dejar pasar el stack crudo de Mongoose.

### Cómo probar los casos inválidos

Con el server corriendo (`npm run dev`):

```bash
# Usuario inexistente -> 404 USER_NOT_FOUND
curl "http://localhost:3000/api/users/64f000000000000000000000"

# Email inválido al registrar -> 400 VALIDATION_ERROR
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"no-es-un-email","password":"123456"}'

# Producto con precio negativo -> 400 VALIDATION_ERROR
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":-10}'

# Id con formato inválido (no ObjectId) -> 400 VALIDATION_ERROR (CastError normalizado)
curl "http://localhost:3000/api/products/no-es-un-id"

# Mocks: cantidad no numérica -> 400 INVALID_MOCK_COUNT
curl "http://localhost:3000/api/mocks/users?count=abc"

# Mocks: cantidad negativa -> 400 INVALID_MOCK_COUNT
curl "http://localhost:3000/api/mocks/orders?count=-5"

# Mocks: cantidad fuera de rango -> 400 INVALID_MOCK_COUNT
curl "http://localhost:3000/api/mocks/deliveries?count=9999"

# Mocks: seed con cantidad inválida -> 400 INVALID_MOCK_COUNT
curl -X POST http://localhost:3000/api/mocks/seed \
  -H "Content-Type: application/json" \
  -d '{"usersCount": -3}'
```

## Validación de entorno

Si falta `PORT`, `MONGODB_URI` o `NODE_ENV` en el `.env`, la aplicación **no arranca**: `src/config/env.config.js` valida estas variables al cargar el módulo y lanza un error descriptivo antes de que `server.js` intente conectar a la base o levantar Express.

## Logging y monitoreo

Toda la app loguea a través de un único módulo centralizado (`src/config/logger.config.js`), construido con [Winston](https://github.com/winstonjs/winston) + [`winston-daily-rotate-file`](https://github.com/winstonjs/winston-daily-rotate-file). No queda ningún `console.log`/`console.error` suelto: cada archivo que necesita loguear importa `logger` desde ese módulo.

**Niveles** (de más a menos grave):

| Nivel | Cuándo se usa |
|---|---|
| `fatal` | Fallas críticas que impiden que la app siga funcionando (ej: no se pudo conectar a MongoDB al arrancar). |
| `error` | Errores inesperados del servidor (5xx): excepciones no controladas, fallas reales contra la base. |
| `warning` | Errores esperados/de negocio (4xx): validaciones, recursos no encontrados, conflictos, rutas inexistentes. |
| `info` | Eventos relevantes del ciclo de vida normal: server arriba, conexión a Mongo, usuario registrado, producto creado, datos de prueba generados. |
| `http` | Trazabilidad de requests puntuales (usado por el endpoint de prueba). |
| `debug` | Detalle fino solo útil en desarrollo. |

**Dónde se usa:** arranque del servidor y conexión a MongoDB (`server.js`), middleware global de errores (`src/middlewares/error.middleware.js`, que decide `warning` vs `error` según el `statusCode` normalizado), rutas inexistentes (`src/app.js`), el módulo de mocks (`src/mocks/mock.service.js`, al generar/insertar datos de prueba) y operaciones de negocio importantes como registrar un usuario o crear un producto.

**Cómo probar el endpoint del logger:**
```bash
curl http://localhost:3000/api/logger/test
```
Esto dispara un mensaje en cada uno de los 6 niveles. Deberías verlos en la consola (coloreados) y, según el nivel, en los archivos de `logs/`.

**Dónde se guardan los archivos:** en la carpeta `logs/` (creada en la raíz del proyecto), con rotación diaria vía `winston-daily-rotate-file`:
- `logs/error-YYYY-MM-DD.log` — **solo** niveles `error` y `fatal`. Se conserva 14 días de historial (`maxFiles: '14d'`) y hasta 10 MB por archivo antes de rotar.
- `logs/combined-YYYY-MM-DD.log` — historial general con todos los niveles habilitados para el entorno actual. Se conserva 7 días.

**Qué se ignora en Git:** la carpeta `logs/` queda documentada y versionada (vía `logs/.gitkeep`), pero los archivos que la app genera dentro (`*.log`, `*-audit.json`) están en `.gitignore` (`logs/*` + `!logs/.gitkeep`) para no subir logs reales al repo.

**Comportamiento según el entorno** (usa `NODE_ENV`, leído por `src/config/env.config.js`):
- **Desarrollo** (`NODE_ENV=development`): el logger deja pasar desde `debug` hacia arriba — se ve todo, incluida la consola coloreada por nivel.
- **Producción** (`NODE_ENV=production`): el logger solo registra desde `info` hacia arriba (`info`, `warning`, `error`, `fatal`); `debug` y `http` quedan silenciados para no ensuciar los logs con detalle de diagnóstico.

En ambos casos, `logs/error-*.log` se comporta igual: solo `error` y `fatal`, sin importar el entorno.
