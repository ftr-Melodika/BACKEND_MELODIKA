# Reglas para Claude en BACKEND_MELODIKA

Backend Node.js (ESM) + Express 5 + Supabase/Postgres. Esta API la consume un frontend, así que el "contrato" (rutas, campos, formato de respuesta) debe mantenerse estable.

## 1. Cómo comunicarte (prioridad máxima)
Quien lee puede no saber programar. Al terminar cada edición, responder SIEMPRE en dos bloques, en este orden:

**En palabras simples**: qué se hizo y para qué, con analogías cotidianas, sin jerga (si hay que usar un término técnico, explicarlo en una frase).

**Detalle técnico**: archivos tocados, decisiones tomadas y por qué, riesgos, y cómo probarlo.

## 2. Hallazgos durante una tarea (avisar y preguntar)
Si mientras haces una tarea ves algo mal modularizado, mal estructurado o con errores **que no es parte de lo pedido**:
- No lo arregles ni te desvíes de la tarea.
- Termina lo pedido y, al final (o con AskUserQuestion si te bloquea), cuéntalo: qué viste en lenguaje simple, qué riesgo tiene y qué propones.
- Pregunta si se corrige ahora o después.

Si el problema SÍ es parte de la tarea, resuélvelo normalmente.

## 3. Modularización
- Una responsabilidad por archivo y por función; funciones cortas y con nombre claro (en español, como el resto del código).
- No duplicar: reutilizar helpers, validadores y servicios existentes antes de crear nuevos.
- Constantes en lugar de textos o números "mágicos" repetidos.
- Cada archivo nuevo va en la carpeta de su capa.

## 4. Arquitectura por capas (la existente)
`controllers → services → repositories`
- **controllers**: solo reciben la petición, usan validadores, llaman al service y responden. Sin lógica de negocio ni SQL.
- **services**: lógica de negocio y reglas (ej. `perfilService.validarAccesoPerfil(authId, perfilId)` para comprobar que el perfil es del usuario).
- **repositories**: único lugar con SQL (`pool`, consultas parametrizadas `$1`), devuelven `entities`.
- **middlewares/validadores**: validación de entrada.
- Rutas async siempre envueltas en `catchAsync`; rutas protegidas con `verificarToken` y usuario en `req.user`.

## 5. Manejo de errores (seguir la práctica del proyecto)
- **Controllers y services**: `throw new Error("Texto")` (con `.status` cuando corresponda, ver `cancionService`). Nunca escribir el mensaje final para el usuario ahí.
- **Repositories**: `try/catch` + `manejarErrorDB(error, MENSAJES_ERROR_DB.X)`. Nada de textos sueltos: si falta la constante, agregarla en `src/helpers/manejoErrores/mensajesErrorDB.js`.
- **Un mapper por módulo** en `src/helpers/mapperErrores/` (`cuentaErrores`, `cursoErrores`, `perfilErrores`, `amistadErrores`, `grupoErrores`, `cancionErrores`). Traduce el texto lanzado (o el código de Postgres) a `{ codigoEstado, mensajeUsuario }`. Al lanzar un texto nuevo, agregar su caso en el mapper de SU módulo (no en el de otro, aunque cuelgue de la misma ruta).
- Lo que se repite entre mappers (errores de conexión/ID inválido de la BD, errores de acceso al perfil) va en `mapperErrores/erroresComunes.js`; reutilizarlo en vez de copiar.
- Módulo nuevo = mapper nuevo registrado en `resolveErrorMapper` de `src/middlewares/errorHandler.js` (las rutas más específicas van primero).
- `errorHandler` es el único que responde los errores de controllers/services y el único que llama a `registrarErrorOculto` (log de depuración en consola; no se quita y no se repite en los mappers). No exponer detalles internos al usuario.
- Los middlewares (validadores y `authMiddleware`) sí responden directo con `res.status(...).json({ success: false, message })`; es la práctica aceptada para ellos. Validaciones de entrada van en `middlewares/validadores/`, no dentro del controller.

## 6. Formato de respuestas (para el frontend)
- Éxito: `res.status(status.OK | status.CREATED).json({ success: true, message: "...", data })` con `http-status-codes`, igual que los controllers actuales.
- Error: `{ success: false, message }` generado por `errorHandler`.
- No renombrar campos ni romper endpoints existentes sin preguntar antes.
- Documentar cada ruta con los comentarios `#swagger.tags` / `#swagger.summary` y regenerar con `npm run swagger`.

## 7. Autenticación
Se usa Supabase Auth (`signInWithPassword`, `supabase.auth.getUser(token)`). El cliente de Supabase se crea solo en `src/database/supabase.js` (`supabase` compartido y `crearClienteAuth()` para login/refresh); no crear clientes nuevos en otros archivos. No agregar hash de contraseñas ni JWT propios salvo que sea realmente necesario; en ese caso, preguntar antes.

## 8. Seguridad
Validar toda entrada, consultas parametrizadas, secretos solo en `.env`, no loguear datos sensibles, comprobar que cada usuario solo accede a lo suyo.

## 9. Flujo de trabajo
- Leer el código existente antes de editar y seguir su estilo.
- Cambios mínimos y enfocados en lo pedido.
- No hacer commits ni tocar `.env` salvo que se pida.
- Ante ambigüedad, preguntar.

## 10. Comandos
`npm start` · `npm run migrar` · `npm run seed:cursos` · `npm run seed:canciones` · `npm run swagger`
