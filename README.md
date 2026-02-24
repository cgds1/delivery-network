# Red de Deliveries

Simulacion de la red interna de una empresa de envios, implementada completamente con Docker. Proyecto de Seguridad Informatica.

## Descripcion

El sistema modela la operacion de un local de empresa de deliveries, donde distintos empleados interactuan con aplicaciones CLI especializadas segun su rol (despacho, mostrador, atencion al cliente, administracion). Un servidor central gestiona los datos de envios respaldado por PostgreSQL, y un servidor OpenLDAP maneja toda la autenticacion y autorizacion de los empleados. El publico puede hacer seguimiento de sus envios a traves de un frontend web expuesto.

## Arquitectura

```
                         ┌─────────────────────────────────────┐
                         │          RED INTERNA (internal)      │
                         │          Sin acceso a internet       │
                         │                                     │
                         │  ┌────────────┐  ┌──────────────┐   │
                         │  │  OpenLDAP   │  │  PostgreSQL   │   │
                         │  │  (auth)     │  │  (datos)      │   │
                         │  └─────┬──────┘  └──────┬───────┘   │
                         │        │                │           │
                         │        └───────┬────────┘           │
                         │                │                    │
  ┌───────────────┐      │  ┌─────────────┴──────────────┐     │
  │   Internet    │      │  │      Servidor Central       │     │
  │  (puerto 8080)│      │  │      (Express API)          │     │
  └──────┬────────┘      │  └─────────────┬──────────────┘     │
         │               │                │                    │
  ┌──────┴────────┐      │  ┌────┬────────┼────────┬────┐     │
  │   Tracking    │      │  │    │        │        │    │     │
  │   Frontend    │      │  │ Desp. │ Mostr. │ Atenc. │ Admin │     │
  │  (Nginx+React)│      │  │  CLI  │  CLI   │  CLI   │  CLI  │     │
  └───────────────┘      │  └────┴────────┴────────┴────┘     │
         DMZ             │                                     │
                         └─────────────────────────────────────┘
```

### Redes Docker

| Red | Tipo | Proposito |
|-----|------|-----------|
| `internal` | Bridge (internal: true) | Red aislada sin acceso a internet. Conecta los hosts, servidor central, PostgreSQL y OpenLDAP |
| `dmz` | Bridge | Zona desmilitarizada. Conecta el tracking frontend y el servidor central. Unico punto de exposicion al exterior (puerto 8080) |

El servidor central es **dual-homed**: conectado a ambas redes, actua como intermediario entre la DMZ y la red interna.

## Componentes

### Hosts (CLI de empleados)

Contenedores que simulan las estaciones de trabajo del personal. Cada uno ejecuta una aplicacion de linea de comandos accesible via `docker attach`. La autenticacion se delega al servidor OpenLDAP a traves del servidor central.

| Host | Contenedor | Funcion |
|------|-----------|---------|
| **Despacho** | `redde-despacho` | Gestion de envios pendientes y actualizacion de estados |
| **Mostrador** | `redde-mostrador` | Registro de nuevos envios y asignacion de codigos de tracking |
| **Atencion al Cliente** | `redde-atencion` | Busqueda de envios y registro de quejas/reclamos |
| **Admin** | `redde-admin` | Dashboard con estadisticas y vision general de operaciones |

### Servidor Central

API REST (Node.js/Express) que centraliza toda la logica de negocio. Conecta con PostgreSQL para persistencia de datos y con OpenLDAP para autenticar empleados. Emite tokens JWT para las sesiones autenticadas.

- Base de datos: PostgreSQL 16 con tablas de envios (`shipments`), historial de estados (`shipment_history`) y quejas (`complaints`)
- Codigos de tracking con formato `RDD-YYYY-NNNNN`
- Control de acceso por rol en cada endpoint

### OpenLDAP

Servidor de directorio que gestiona la permisologia de todos los usuarios (empleados) dentro de la empresa.

- Dominio: `dc=reddedeliveries,dc=local`
- Unidades organizativas: `ou=People` (usuarios) y `ou=Groups` (roles)
- Grupos que definen permisos: `despacho`, `mostrador`, `atencion`, `admin`

### Tracking Frontend

Aplicacion web publica (React + Nginx) donde los clientes pueden consultar el estado de sus envios usando su codigo de tracking. Es el unico servicio expuesto al exterior.

- Nginx actua como proxy reverso, reenviando **unicamente** las peticiones a `/api/tracking/` hacia el servidor central
- Todas las demas rutas de la API estan bloqueadas (403 Forbidden)
- Accesible en `http://localhost:8080`

## Seguridad

- **Aislamiento de red**: la red `internal` tiene `internal: true`, lo que impide cualquier acceso a internet desde los contenedores internos
- **Exposicion minima de puertos**: solo el puerto `8080` esta mapeado al host (tracking frontend). PostgreSQL, OpenLDAP y el servidor central no exponen puertos al exterior
- **Proxy Nginx**: filtra las peticiones publicas, permitiendo solo el endpoint de tracking y bloqueando el acceso a endpoints internos de la API
- **Autenticacion centralizada via LDAP**: todos los servicios de empleados delegan la autenticacion al servidor OpenLDAP
- **Autorizacion por roles**: cada endpoint verifica el grupo LDAP del usuario para permitir o denegar operaciones
- **Secretos en variables de entorno**: las credenciales se manejan a traves de `.env` (excluido del repositorio via `.gitignore`)
- **Imagenes Alpine**: se utilizan imagenes base minimas para reducir la superficie de ataque
- **Volumenes nombrados**: los datos persistentes (PostgreSQL, OpenLDAP) se almacenan en volumenes Docker, no en bind mounts

## Configuracion de credenciales

Las credenciales no se incluyen en el repositorio. Para configurar el entorno:

```bash
# Copiar el archivo de ejemplo y completar los valores
cp .env.example .env
```

Editar `.env` con las credenciales deseadas. Las contrasenas de los usuarios LDAP se definen en los archivos `openldap/bootstrap/*.ldif`.

| Usuario | Rol | Contenedor |
|---------|-----|------------|
| `jperez` | Despacho | `redde-despacho` |
| `mgarcia` | Mostrador | `redde-mostrador` |
| `lrodriguez` | Atencion al Cliente | `redde-atencion` |
| `admin` | Administrador | `redde-admin` |

## Inicio rapido

```bash
# Clonar e iniciar todos los servicios
git clone <repo-url>
cd delivery-network

# Configurar las variables de entorno
cp .env.example .env
# Editar .env con las credenciales

# Levantar toda la infraestructura
docker compose up -d

# Verificar que todos los contenedores estan corriendo
docker compose ps
```

## Uso

### Acceder a los hosts de empleados

```bash
# Conectarse a un host (ejemplo: mostrador)
docker attach redde-mostrador

# Desconectarse sin detener el contenedor
# Ctrl+P seguido de Ctrl+Q
```

### Tracking publico

Abrir en el navegador: `http://localhost:8080`

Ingresar un codigo de tracking (ej: `RDD-2026-00001`) para ver el estado y el historial del envio.

### Flujo de operacion tipico

1. **Mostrador** registra un nuevo envio y obtiene un codigo de tracking
2. **Despacho** procesa el envio y actualiza su estado (`en_despacho` -> `en_camino` -> `entregado`)
3. El **cliente** consulta el estado en el frontend publico con su codigo de tracking
4. **Atencion al Cliente** atiende consultas y registra quejas si es necesario
5. **Admin** supervisa las estadisticas generales y el estado de las operaciones

## Estructura del proyecto

```
delivery-network/
├── docker-compose.yml          # Definicion de todos los servicios y redes
├── .env                        # Variables de entorno (no versionado)
├── central-server/
│   ├── Dockerfile
│   ├── db/
│   │   └── init.sql            # Esquema de base de datos y datos de prueba
│   └── src/                    # API Express (rutas, middleware, config)
├── openldap/
│   ├── Dockerfile
│   └── bootstrap/
│       ├── 01-base.ldif        # Unidades organizativas
│       └── 02-users.ldif       # Usuarios y grupos
├── hosts/
│   ├── Dockerfile              # Imagen compartida para los 4 hosts
│   ├── entrypoint.sh           # Selecciona el CLI segun HOST_ROLE
│   ├── common/                 # Codigo compartido (API client, UI helpers)
│   ├── despacho/src/           # CLI de despacho
│   ├── mostrador/src/          # CLI de mostrador
│   ├── atencion/src/           # CLI de atencion al cliente
│   └── admin/src/              # CLI de administracion
└── tracking-frontend/
    ├── Dockerfile              # Multi-stage: build React + serve con Nginx
    ├── nginx.conf              # Proxy reverso (solo /api/tracking/)
    └── src/                    # Aplicacion React
```

## Tecnologias

- **Docker & Docker Compose** - Orquestacion de contenedores y redes
- **Node.js / Express** - Servidor central (API REST)
- **PostgreSQL 16** - Base de datos relacional
- **OpenLDAP** (osixia/openldap) - Directorio para autenticacion y autorizacion
- **React** - Frontend de tracking publico
- **Nginx** - Servidor web y proxy reverso
- **JWT** - Tokens de sesion para los servicios internos
