# PassPort Inc. 🛂

Sistema de autenticación y gestión de sesiones seguro. Proyecto #10 del bootcamp.

## Stack

- **Runtime:** Node.js + Express
- **Base de datos:** PostgreSQL con `pg`
- **Vistas:** EJS + CSS compartido
- **Seguridad:** bcrypt · jsonwebtoken · helmet · tiny-csrf · express-rate-limit · express-validator

## Estructura
```
Autenticacion/
├── src/
│   ├── config/         → Conexión a PostgreSQL
│   ├── controllers/    → Lógica de negocio (auth, admin)
│   ├── models/         → Acceso a la base de datos
│   ├── views/          → Vistas EJS (login, register, dashboard, admin)
│   ├── middleware/     → Autenticación y roles
│   ├── routes/         → Definición de rutas
│   └── app.js          → Entry point y configuración Express
├── public/
│   └── css/
│       └── styles.css  → Estilos compartidos
├── .env                → Variables de entorno (NO subir a Git)
├── .env.example        → Plantilla de variables de entorno
└── package.json
```

## Setup

### 1. Clonar e instalar dependencias
```bash
git clone <repo>
cd Autenticacion
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editá .env con tus datos reales
```

### 3. Crear base de datos y tablas en PostgreSQL
```sql
CREATE DATABASE auth_db;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'usuario',
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security_logs (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(50),
  email VARCHAR(255),
  evento VARCHAR(100),
  exitoso BOOLEAN,
  razon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

### 4. Correr el proyecto
```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Seguridad implementada

| Medida | Descripción |
|---|---|
| bcrypt | Hashing de contraseñas con 12 salt rounds |
| JWT | Token firmado guardado en cookie HttpOnly |
| Sessions | Sesiones persistentes en PostgreSQL |
| CSRF | Protección con tiny-csrf |
| Rate limiting | 100 req/15min global, 20 req/15min en login |
| Brute force | Bloqueo tras 3 intentos fallidos por 15 minutos |
| Helmet | Headers HTTP de seguridad |
| RBAC | Roles: usuario / administrador |
| XSS | Validación y sanitización con express-validator |

## Crear usuario administrador

Por defecto todos los usuarios se registran con rol `usuario`. Para crear un administrador ejecutá esto en PostgreSQL:
```sql
UPDATE users SET rol = 'administrador' WHERE email = 'tu@email.com';
```