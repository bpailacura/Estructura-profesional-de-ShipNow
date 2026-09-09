# ShipNow API — Arquitectura por Capas

Refactor de la API base de ShipNow a arquitectura **Controller → Service → Repository**, con configuración de entorno validada al arranque y constantes de dominio centralizadas.

## Estructura del proyecto

```
src/
  config/          # Lectura/validación de env vars, configuración del logger (Winston), Multer y Swagger
  constants/        # Valores fijos del dominio: roles, estados, prioridades, tipos de documento, límites de upload (Object.freeze)
  models/           # Esquemas de Mongoose, sin lógica de negocio (User, Product, Order, Delivery)
  repositories/     # Único lugar que conoce Mongoose/MongoDB
  services/         # Lógica de negocio (validaciones, reglas, orquestación)
  controllers/      # Manejo de req/res, delega todo al Service
  routes/           # Conectan path + método HTTP con el Controller
  docs/             # Anotaciones @swagger (OpenAPI) por módulo — NO contienen lógica, solo documentación
  errors/           # Errores personalizados del dominio + diccionario de errores
  middlewares/       # Middleware global que transforma errores en respuestas HTTP uniformes (y los loguea)
  mocks/            # Módulo de mocking: factories de datos + servicio de generación/carga
    factories/       # Construyen objetos simulados con forma de los modelos reales
    mock.service.js  # Orquesta preview (sin guardar) y seed (inserta en Mongo)
  app.js            # Configuración de Express
server.js           # Punto de entrada: conecta DB y levanta el server
logs/               # Archivos de log generados por Winston (ignorados por Git, ver más abajo)
uploads/            # Documentos de usuario y comprobantes de entrega subidos vía Multer (ignorados por Git, ver más abajo)
```

> **Nota sobre el dominio:** el proyecto ya tenía `User` y `Product`. En el módulo anterior (mocking de pedidos, entregas y repartidores) se agregaron los modelos `Order` (pedido) y `Delivery` (entrega), y el rol `DELIVERY_PERSON` (repartidor). Para esta pre-entrega se agregó el CRUD real de `Order` y `Delivery` (antes solo existían como datos simulados dentro de `/api/mocks`), siguiendo la misma arquitectura por capas, y se documentó toda la API con Swagger/OpenAPI.

## Documentación interactiva (Swagger)

[#documentación-interactiva-swagger](#documentación-interactiva-swagger)

Con el servidor corriendo, la documentación interactiva está en:

```
http://localhost:3000/api/docs
```

Desde ahí se puede consultar y **probar en vivo** (botón "Try it out") cada endpoint: método, parámetros, body esperado, respuestas exitosas y errores posibles.

- **Configuración**: `src/config/swagger.config.js` (info general, servers, tags, y de dónde lee las anotaciones). Está separada tanto de `app.js` como de la lógica de rutas — solo arma el spec de OpenAPI con `swagger-jsdoc` y se monta en `app.js` con `swagger-ui-express`.
- **Anotaciones**: viven en `src/docs/*.docs.js`, un archivo por módulo (`users`, `products`, `orders`, `deliveries`, `mocks`, `logger`, más `schemas.docs.js` con los schemas reutilizables). Son archivos que **no tienen lógica**, solo comentarios `@swagger`; nunca se importan desde el código real, `swagger-jsdoc` los lee por ruta.
- **Módulos documentados**: `Users`, `Orders`, `Deliveries`, `Mocks` y `Logger` (pedidos por la consigna), más `Products` como tag extra porque también es parte real de la API.
- **Schemas reutilizables**: `User`, `Product`, `Order`, `OrderItem`, `Delivery`, además de los inputs de cada uno (`UserRegisterInput`, `OrderCreateInput`, etc.), `SuccessResponse` y `ErrorResponse`.
- **Aclaración para probar**: no hay autenticación/JWT implementada todavía (el `.env.example` tiene `JWT_SECRET` reservado para más adelante), así que ningún endpoint pide token — no hay ningún error 401/403 documentado porque la API real no los devuelve. Para probar `POST /orders` o `POST /deliveries` desde Swagger UI primero conviene generar datos con `POST /mocks/seed` y usar los ids (`_id`) de usuarios/pedidos que devuelve en el `sample` de la respuesta.

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
- `GET /` — lista paginada (`?available=true` filtra solo disponibles; `?page`/`?limit` paginan — default `page=1`, `limit=20`, tope `limit=100`)
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

**Usuarios** (`/api/users`)
- `GET /` — lista paginada (`?page`/`?limit` — default `page=1`, `limit=20`, tope `limit=100`)
- `GET /:id`
- `POST /register`
- `PUT /:id`
- `POST /:id/documents` — sube un documento del usuario (`multipart/form-data`, ver [Carga de archivos](#carga-de-archivos-multer))
- `DELETE /:id`

**Pedidos** (`/api/orders`)
- `GET /` — lista paginada (`?status=PENDING|SHIPPED|DELIVERED|CANCELLED` filtra por estado; `?page`/`?limit` paginan)
- `GET /:id`
- `POST /` — body: `{ customer, items: [{ productName, quantity, unitPrice, product? }], priority? }`. `totalAmount` se calcula en el servidor, nunca se recibe del cliente.
- `PUT /:id/status` — body: `{ status }` (debe ser uno de `PENDING|SHIPPED|DELIVERED|CANCELLED`)
- `DELETE /:id`

**Entregas** (`/api/deliveries`)
- `GET /` — lista paginada (`?status=ASSIGNED|IN_TRANSIT|DELIVERED|FAILED` filtra por estado; `?page`/`?limit` paginan)
- `GET /:id`
- `POST /` — body: `{ order, deliveryPerson, address, estimatedDeliveryDate }`. Valida que `order` exista, que `deliveryPerson` sea un usuario con rol `DELIVERY_PERSON`, y que el pedido no tenga ya una entrega asociada (relación 1 a 1).
- `PUT /:id/status` — body: `{ status }` (debe ser uno de `ASSIGNED|IN_TRANSIT|DELIVERED|FAILED`)
- `POST /:id/proof` — sube un comprobante de la entrega (`multipart/form-data`, ver [Carga de archivos](#carga-de-archivos-multer))
- `DELETE /:id`

> **Paginación:** las 4 listas grandes (`products`, `users`, `orders`, `deliveries`) devuelven `{ data, meta }` en vez de un array pelado, con `meta: { page, limit, total, totalPages }`. `limit` se recorta automáticamente a 100 aunque se pida más, para que nadie traiga la colección entera de un tirón (ver `src/utils/pagination.util.js`).

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
- `domainErrors.js` — errores personalizados del dominio, agrupados por familia: `NotFoundError` (404: usuario/producto/pedido/entrega inexistente), `ValidationError` (400: datos inválidos, status inválido en pedidos/entregas, cantidad de mocks inválida), `ConflictError` (409: email duplicado, pedido que ya tiene entrega asociada), `DatabaseError` (502: falla real de Mongo durante el seed de mocks), `FileError` (400: archivo requerido, tipo inválido, archivo demasiado grande, campo inesperado, fallo al persistir el metadata).

Los `services` (`user.service.js`, `product.service.js`, `delivery.service.js`) y el módulo de mocks (`mock.service.js`, apoyado en `mock.validation.js`) lanzan estos errores directamente — nunca arman ellos mismos la respuesta HTTP.

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

# Pedido inexistente -> 404 ORDER_NOT_FOUND
curl "http://localhost:3000/api/orders/64f000000000000000000000"

# Cambiar un pedido a un status que no existe -> 400 INVALID_ORDER_STATUS
curl -X PUT http://localhost:3000/api/orders/<id-de-un-pedido>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"NO_EXISTE"}'

# Entrega inexistente -> 404 DELIVERY_NOT_FOUND
curl "http://localhost:3000/api/deliveries/64f000000000000000000000"

# Cambiar una entrega a un status que no existe -> 400 INVALID_DELIVERY_STATUS
curl -X PUT http://localhost:3000/api/deliveries/<id-de-una-entrega>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"NO_EXISTE"}'

# Crear una entrega para un pedido que ya tiene una -> 409 DELIVERY_ALREADY_EXISTS
```

## Validación de entorno

Si falta `PORT`, `MONGODB_URI` o `NODE_ENV` en el `.env`, la aplicación **no arranca**: `src/config/env.config.js` valida estas variables al cargar el módulo y lanza un error descriptivo antes de que `server.js` intente conectar a la base o levantar Express.

Además de las obligatorias, hay dos variables opcionales (la app arranca igual si faltan, usando su default):
- `JWT_SECRET` — reservada para cuando se implemente login con JWT; hoy ningún endpoint la usa.
- `LOG_LEVEL` — nivel mínimo que loguea el logger (`fatal|error|warning|info|http|debug`). Si no está seteada o el valor no es uno de esos, cae al default por entorno: `debug` en development/test, `info` en production.

ShipNow no consume ninguna API externa en esta versión (no hay pasarela de pago, geolocalización, etc.), por eso no hay variables `*_SERVICE_URL`.

## Testing funcional

[#testing-funcional](#testing-funcional)

### Herramientas

- **[Mocha](https://mochajs.org/)** — organiza y ejecuta la suite (`describe`/`it`).
- **[Chai](https://www.chaijs.com/)** — aserciones legibles (`expect(...).to...`).
- **[Supertest](https://github.com/ladjs/supertest)** — hace las peticiones HTTP contra `src/app.js` directamente (sin levantar el servidor en un puerto real, porque `app.js` está separado de `server.js`).
- **[cross-env](https://github.com/kentcdodds/cross-env)** — fuerza `NODE_ENV=test` de forma multiplataforma antes de correr Mocha.

### Entorno de testing separado del de desarrollo

Los tests **nunca** tocan la base de datos de desarrollo. Usan su propio archivo `.env.test` con:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/shipnow_test
NODE_ENV=test
```

`tests/setup.js` carga `.env.test` **antes** de requerir cualquier otro módulo, se conecta a esa base al arrancar la suite, y por seguridad **corta la ejecución si `MONGODB_URI` no contiene la palabra "test"** — así un `.env.test` mal configurado nunca puede terminar vaciando la base de desarrollo.

> Necesitás un MongoDB accesible en `MONGODB_URI` (local o Atlas) para correr la suite — igual que para correr la app normalmente, pero apuntando a una base distinta.

### Cómo ejecutar los tests

```bash
npm install
# .env.test ya viene en el repo con una base local por defecto;
# editalo si tu Mongo de testing corre en otro host/puerto.
npm test
```

`npm test` corre `cross-env NODE_ENV=test mocha`, que usa la configuración de `.mocharc.json` (carga `tests/setup.js`, apunta a `tests/**/*.test.js`, timeout de 10s).

### Qué se limpia entre tests

`tests/setup.js` define root hooks globales:

- `beforeAll`: conecta una única vez a la base de testing.
- `afterEach`: **borra el contenido de todas las colecciones** después de cada test individual, así ningún test depende de datos dejados por otro ni del orden de ejecución.
- `afterAll`: hace `dropDatabase()` y cierra la conexión.

Los datos de prueba (usuarios, pedidos) se crean **dentro de cada test** a través de la propia API (`tests/helpers/testData.js` expone `createUser` y `validOrderPayload`), nunca insertados a mano ni dependiendo de datos cargados manualmente.

### Módulos cubiertos

| Archivo | Cubre |
|---|---|
| `tests/users.test.js` | `GET /api/users`, `GET /api/users/:id`, `POST /api/users/register`, `PUT /api/users/:id`, `DELETE /api/users/:id` |
| `tests/orders.test.js` | `GET /api/orders` (con filtro por `status`), `GET /api/orders/:id`, `POST /api/orders`, `PUT /api/orders/:id/status`, `DELETE /api/orders/:id` |
| `tests/mocks.test.js` | `GET /api/mocks/users`, `GET /api/mocks/orders`, `GET /api/mocks/deliveries` (preview, no persisten), `POST /api/mocks/seed` (carga real) |
| `tests/misc.test.js` | `GET /api/logger/test`, `GET /api/docs` (Swagger UI), `GET /health`, ruta inexistente (404 genérico) |

> **Pendiente:** el CRUD de `Products` y `Deliveries` todavía no tiene tests funcionales propios en esta pre-entrega — quedan como próximo paso siguiendo el mismo patrón de `orders.test.js` (crear delivery requiere primero un `order` y un `deliveryPerson` con rol `DELIVERY_PERSON`).

Cada test valida no solo el status code, sino la **estructura del body**: presencia de `data`/`error`, el `code` del diccionario de errores (`errorDictionary.js`) cuando corresponde, que nunca se filtre `passwordHash`, y reglas de negocio puntuales (por ejemplo, que el `totalAmount` de un pedido se calcule en el servidor y no se pueda pisar desde el cliente, o que un registro nunca pueda auto-asignarse el rol `ADMIN`).

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

**Dónde se usa:** arranque del servidor y conexión a MongoDB (`server.js`), middleware global de errores (`src/middlewares/error.middleware.js`, que decide `warning` vs `error` según el `statusCode` normalizado), rutas inexistentes (`src/app.js`), el módulo de mocks (`src/mocks/mock.service.js`, al generar/insertar datos de prueba) y operaciones de negocio importantes como registrar un usuario, crear un producto o subir un archivo.

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

## Carga de archivos (Multer)

[#carga-de-archivos-multer](#carga-de-archivos-multer)

Dos endpoints aceptan `multipart/form-data`, ambos con el archivo en el campo **`file`**:

| Método | Endpoint | Asocia el archivo a |
|---|---|---|
| `POST` | `/api/users/:id/documents` | Un usuario (ej: DNI, licencia de conducir) |
| `POST` | `/api/deliveries/:id/proof` | Una entrega (ej: foto de entrega, firma, recibo) |

**Configuración** (`src/config/multer.config.js`, `src/constants/index.js`):
- **Tamaño máximo**: 5 MB por archivo (`UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES`).
- **Tipos permitidos**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` (`UPLOAD_LIMITS.ALLOWED_MIME_TYPES`). Cualquier otro mimetype se rechaza con `400 INVALID_FILE_TYPE`.
- **Un solo archivo por request** (`files: 1`); si se manda más de uno o en un campo distinto a `file`, `400 UNEXPECTED_FILE_FIELD`.
- **`documentType`** (opcional, va en el body junto al archivo): uno de `DNI_FRONT`, `DNI_BACK`, `DRIVER_LICENSE`, `DELIVERY_PROOF`, `OTHER`. Si no se manda en `/deliveries/:id/proof`, se asume `DELIVERY_PROOF` automáticamente. Un valor no reconocido devuelve `400 INVALID_DOCUMENT_TYPE`.

**Guardado en disco:** el archivo se renombra (`timestamp-hexrandom.ext`, nunca el nombre original del cliente — evita colisiones y path traversal) y se guarda en `uploads/users/` o `uploads/deliveries/` según corresponda. El **metadata** (`originalName`, `storedName`, `path`, `mimeType`, `size`, `documentType`) queda persistido en el documento de Mongo del usuario/entrega — el archivo en sí vive solo en el filesystem.

**Errores propios de este módulo:**

| Código | Cuándo |
|---|---|
| `FILE_REQUIRED` | No se mandó ningún archivo en el request |
| `INVALID_FILE_TYPE` | Mimetype fuera de la lista permitida |
| `FILE_TOO_LARGE` | Supera los 5 MB |
| `UNEXPECTED_FILE_FIELD` | El archivo no vino en el campo `file`, o vino más de uno |
| `INVALID_DOCUMENT_TYPE` | `documentType` no es uno de los valores válidos |
| `FILE_UPLOAD_FAILED` | Falla real al persistir el metadata en la base |

**Cómo probarlo:**
```bash
curl -X POST http://localhost:3000/api/users/<id-de-un-usuario>/documents \
  -F "file=@/ruta/a/dni.jpg" \
  -F "documentType=DNI_FRONT"

curl -X POST http://localhost:3000/api/deliveries/<id-de-una-entrega>/proof \
  -F "file=@/ruta/a/comprobante.pdf"
```

## Producción y Docker

[#producción-y-docker](#producción-y-docker)

### Health check

`GET /health` (fuera de `/api`, sin prefijo) devuelve el estado del proceso — pensado para que un orquestador (Docker, Kubernetes, un balanceador) sepa si el contenedor está vivo:

```json
{
  "status": "ok",
  "environment": "production",
  "uptime": 134.821,
  "timestamp": "2026-09-06T20:13:03.140Z"
}
```

No expone nada sensible (ni `MONGODB_URI`, ni `JWT_SECRET`, ni ningún dato de negocio) — es intencional, para poder dejarlo accesible sin autenticación incluso en producción.

### Criterio sobre endpoints internos

`/api/mocks/*`, `/api/logger/test` y `/api/docs` (Swagger UI) son herramientas de desarrollo/QA, no funcionalidad de negocio. El criterio aplicado (`src/middlewares/blockInProduction.middleware.js`) es: **quedan completamente bloqueados cuando `NODE_ENV=production`**, respondiendo el mismo `404` genérico que cualquier ruta inexistente (nunca `403`, para no confirmar siquiera que la ruta existe). En `development` y `test` siguen abiertos como siempre.

### Variables de entorno necesarias

Ver `.env.example`. Resumen — obligatorias (la app no arranca si falta alguna): `PORT`, `MONGODB_URI`, `NODE_ENV`. Opcionales: `JWT_SECRET`, `LOG_LEVEL` (detalle en [Validación de entorno](#validación-de-entorno)).

### Cómo correr la API localmente

Ver [Instalación y ejecución local](#instalación-y-ejecución-local) más arriba (`npm install`, copiar `.env.example` a `.env`, `npm run dev` o `npm start`).

### Cómo correr los tests

Ver [Testing funcional](#testing-funcional) más arriba (`npm test`, requiere un Mongo accesible vía `.env.test`).

### Cómo acceder a Swagger

Con el server arriba en modo `development` (en `production` está bloqueado a propósito, ver arriba): `http://localhost:3000/api/docs`.

### Docker

**Archivos:**
- `Dockerfile` — **multi-stage**: una etapa `deps` instala solo las dependencias de producción (`npm ci --omit=dev`), y la etapa final `runtime` arranca de una imagen limpia y copia únicamente el `node_modules` ya resuelto más el código fuente — así la imagen publicada no carga nada del proceso de instalación. Corre como usuario no-root (`node`), expone el puerto y define un `HEALTHCHECK` que pega contra `/health`.
- `.dockerignore` — evita copiar `node_modules`, `.env`/`.env.test`, `.git`, `logs`, `uploads`, `tests`, `coverage` y archivos temporales a la imagen.
- `docker-compose.yml` — levanta la API junto con una instancia de MongoDB. La API tiene `depends_on: condition: service_healthy` sobre Mongo (que tiene su propio healthcheck vía `mongosh --eval "db.adminCommand('ping')"`), así que nunca arranca antes de que la base esté lista para aceptar conexiones.

**Opción recomendada — levantar todo con Compose:**
```bash
cp .env.example .env
docker-compose up --build
```
Esto construye la imagen de la API, levanta Mongo, espera a que esté healthy, y recién ahí arranca la API. Adentro de Compose, `MONGODB_URI` apunta automáticamente a `mongodb://mongo:27017/shipnow` (el nombre del servicio, no `localhost` — los contenedores se hablan por nombre de servicio dentro de la red de Compose). Los datos de Mongo, los `uploads/` y los `logs/` persisten en volúmenes nombrados aunque se recreen los contenedores.

Probar que levantó bien:
```bash
curl http://localhost:3000/health
```

**Opción manual — solo la imagen de la API (necesitás un Mongo aparte):**
```bash
docker build -t shipnow-api .
docker run --env-file .env -p 3000:3000 shipnow-api
```
Si tu Mongo corre en el host (no en otro contenedor), usá `mongodb://host.docker.internal:27017/shipnow` como `MONGODB_URI` en ese `.env` (en Linux puede hacer falta `--add-host=host.docker.internal:host-gateway` en el `docker run`).

Con el contenedor arriba, podés probar:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/docs        # solo si NODE_ENV != production
curl "http://localhost:3000/api/products"  # algún endpoint principal
```

**Puerto:** la API escucha en el valor de `PORT` (`3000` por defecto en `.env.example`); tanto el Dockerfile como el compose exponen `3000`, y hay que mapearlo con `-p <puerto-host>:<PORT>` acorde a lo que tenga tu `.env` si usás la opción manual.

**Qué archivos no deben subirse al repo:** `node_modules/`, `.env` (nunca — tiene credenciales reales), `logs/*` (se versiona solo `logs/.gitkeep`) y `uploads/*` (se versiona solo `uploads/.gitkeep`). Ver `.gitignore`. `.env.test` sí está versionado a propósito: no tiene secretos reales, solo apunta a una base de testing local.

**Logs y uploads dentro del contenedor:** ambas carpetas se recrean automáticamente al construir la imagen (`mkdir -p uploads logs` en el `Dockerfile`), pero su contenido vive en el filesystem efímero del contenedor — si el contenedor se destruye, se pierde. Si usás `docker-compose up`, esto ya está resuelto con los volúmenes nombrados (`uploads_data`, `logs_data`). Si preferís correr la imagen suelta con `docker run`, montalos manualmente:
```bash
docker run --env-file .env -p 3000:3000 \
  -v shipnow_uploads:/usr/src/app/uploads \
  -v shipnow_logs:/usr/src/app/logs \
  shipnow-api
```
