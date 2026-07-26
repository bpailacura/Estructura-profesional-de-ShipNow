# ShipNow API — Arquitectura por Capas

Refactor de la API base de ShipNow a arquitectura **Controller → Service → Repository**, con configuración de entorno validada al arranque y constantes de dominio centralizadas.

## Estructura del proyecto

```
src/
  config/          # Lectura y validación de variables de entorno (único lugar que toca process.env)
  constants/        # Valores fijos del dominio: roles, estados, prioridades (Object.freeze)
  models/           # Esquemas de Mongoose, sin lógica de negocio (User, Product, Order, Delivery)
  repositories/     # Único lugar que conoce Mongoose/MongoDB
  services/         # Lógica de negocio (validaciones, reglas, orquestación)
  controllers/      # Manejo de req/res, delega todo al Service
  routes/           # Conectan path + método HTTP con el Controller
  middlewares/       # Manejo centralizado de errores
  mocks/            # Módulo de mocking: factories de datos + servicio de generación/carga
    factories/       # Construyen objetos simulados con forma de los modelos reales
    mock.service.js  # Orquesta preview (sin guardar) y seed (inserta en Mongo)
  app.js            # Configuración de Express
server.js           # Punto de entrada: conecta DB y levanta el server
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

El **Service** es donde vive la inteligencia del negocio: qué significa que un producto se quede "sin stock", qué reglas aplican al registrar un usuario, qué status code corresponde ante cada error. El Service llama al Repository, pero nunca sabe cómo está armada la query por dentro.

Esta separación evita el problema clásico del "repository pasamanos" (un método que solo hace `return Model.find()` sin aportar nada) y, sobre todo, evita mezclar reglas de negocio con acceso a datos — lo que haría casi imposible testear la lógica de forma aislada o reutilizarla fuera del contexto HTTP (por ejemplo, desde un script o una cola de mensajes).

## Validación de entorno

Si falta `PORT`, `MONGODB_URI` o `NODE_ENV` en el `.env`, la aplicación **no arranca**: `src/config/env.config.js` valida estas variables al cargar el módulo y lanza un error descriptivo antes de que `server.js` intente conectar a la base o levantar Express.
