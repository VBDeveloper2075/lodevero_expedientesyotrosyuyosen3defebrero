# Guía de conexión a Base de Datos (AlwaysData)

Este servicio Node.js usa MySQL (mysql2/promise) y variables de entorno cargadas desde `servidor/.env`.

## 1) Variables requeridas (`servidor/.env`)

- DB_HOST: mysql-lodevero.alwaysdata.net
- DB_PORT: 3306
- DB_USER: lodevero
- DB_PASSWORD: "soyDeVero1234567#"  (entre comillas si contiene # u otros símbolos)
- DB_NAME: lodevero_jp3_db
- PORT: 5000
- NODE_ENV: production

Notas:
- Mantén la contraseña entre comillas si incluye `#`, `;`, `&`, espacios u otros caracteres especiales.
- Evita URL-encoding (no usar `%23`), dotenv lee el valor literal.

## 2) Cambios en el código (ya aplicados)

- `config/db.js` ahora usa `connectTimeout` y eliminamos opciones no soportadas por mysql2 (`acquireTimeout`, `timeout`, `reconnect`).
- `server.js` carga `.env` por defecto desde `servidor/`.

## 3) Arranque rápido

1. Completa `servidor/.env` con los valores anteriores.
2. Inicia el servidor con `npm run server` desde la raíz del proyecto.
3. Logs esperados:
   - `🔧 Configuración de base de datos: Host mysql-lodevero.alwaysdata.net ... Usuario lodevero`
   - `✅ Conexión a la base de datos establecida con éxito`

## 4) Solución de problemas

### A. ER_ACCESS_DENIED_ERROR (1045)
Causas típicas y soluciones:
- Usuario o contraseña incorrectos → Verificar en el panel de AlwaysData (Bases de datos > Usuarios MySQL).
- Contraseña con símbolos → Envolver en comillas dobles en `.env`.
- Usuario/host no autorizado → En AlwaysData, permitir host `%` (cualquier origen) o registrar la IP/IPv6 de tu equipo.
- Mayúsculas/minúsculas del usuario → Usar exactamente el username creado (en este proyecto: `lodevero`).

### B. ECONNREFUSED
- Host/puerto inválidos o servicio de MySQL caído.
- Verifica que el host sea exactamente `mysql-lodevero.alwaysdata.net:3306`.

### C. Advertencias de opciones mysql2
- Si ves advertencias sobre opciones inválidas, asegúrate de tener la versión de `config/db.js` que usa `connectTimeout`.

## 5) Notas sobre IP, IPv6 e identidad

- AlwaysData puede registrar el host de conexión como IPv6 (por ejemplo, `2800:...`). Si tu usuario MySQL está restringido por host, agrega tanto IPv4 como IPv6, o usa `%` temporalmente para pruebas.
- El uso de varias cuentas de GitHub/VS Code o diferentes correos no afecta la autenticación MySQL. Solo importan `DB_USER`/`DB_PASSWORD` y permisos del usuario en la base.

## 6) Seguridad y repositorio

- `servidor/.gitignore` ya excluye `.env` para evitar filtrar secretos.
- Nunca subas `.env` a control de versiones. Si necesitas compartir configuración, usa `.env.example` sin credenciales reales.

## 7) Referencias

- Panel AlwaysData > Bases de datos > MySQL: crear usuario, asignar permisos a `lodevero_jp3_db`, configurar host (`%` o IP/IPv6), y restablecer contraseña si es necesario.
- Dependencia: `mysql2` (pool con `mysql2/promise`).
