# CLAUDE.md — Contrato de trabajo para Claude Code Web · CRM-123

Este archivo es el contrato. Se lee **completo** al iniciar cada sesión y antes de cada hito. Si una instrucción del humano o de otro documento lo contradice, **detente, explícalo en lenguaje de negocio y pide confirmación**. Las reglas de seguridad no se relajan por comodidad ni por prisa.

**Orden de lectura y precedencia:** `CLAUDE.md` (seguridad y forma de trabajo) → `SCRIPTS-SQL.md` (estructura oficial de datos) → `TECHNICAL_SPEC.md` (cómo construir) → `BUILD_PLAN.md` (en qué orden) → `DESIGN_BRIEF.md` (qué se ve en pantalla).

---

## 1. El proyecto

CRM minimalista de funcionalidad estándar para el equipo comercial de una **librería-cafetería en España** (clientes personas, euro, español, zona `Europe/Madrid`).

- **Sitio web de escritorio** (`web/`): gestión diaria de vendedores; el supervisor también administra.
- **PWA** (`pwa/`): consulta rápida para el supervisor, e interruptor y envío manual del resumen matutino.
- **Resumen matutino:** flujo de n8n que envía un correo por Resend a cada vendedor (y el resumen del equipo a cada supervisor).

**Principio rector:** diseño y desarrollo estándar, simplificado, minimalista y funcional, con opciones **estrictamente básicas y necesarias**, siguiendo buenas prácticas. Si dudas entre añadir o no una función, **no la añadas** y pregunta.

El humano **no tiene perfil técnico**. Háblale en español, en lenguaje de negocio; explica cualquier término técnico en una línea.

---

## 2. Configuración fija (no inventar ni cambiar)

| Elemento | Valor |
|---|---|
| Nombre de marca | **CRM-123** |
| Rama de fuentes | **`gh-crm-123`** (única rama de trabajo) |
| Carpetas | `web/` (sitio de escritorio) y `pwa/` (PWA del supervisor) |
| Proyecto de Supabase | **`dbcrm123`**, organización **Org CRM 123**, región UE |
| Flujo de n8n | **`WF-CRM123`** (archivo `pwa/n8n/WF-CRM123.json`) |
| Remitente de Resend | **`onboarding@resend.dev`** (modo de prueba; ver `TECHNICAL_SPEC.md` §10.4) |
| Roles | **Vendedor** y **Supervisor**, con usuario (correo) y contraseña. 10 vendedores y 2 supervisores. El Supervisor tiene todos los accesos de administrador. |
| Despliegue | GitHub → Vercel **manual**. Claude Code Web nunca despliega. |
| Datos | Supabase. Estructura **oficial e inmutable**: `SCRIPTS-SQL.md`. |

---

## 3. Datos personales prohibidos

**Prohibido pedir, mostrar o guardar** DNI, NIE, NIF, DPI, NIT, pasaporte o cualquier identificador personal similar: ni en formularios, ni en columnas, ni en notas de ejemplo, ni en datos de prueba. **El teléfono es el identificador del cliente.** Los datos de prueba usan nombres y teléfonos ficticios.

---

## 4. Seguridad: lo innegociable

Estas reglas no se relajan por comodidad ni por prisa. **Todas deben cumplirse en los comandos de la base de datos** y en el código.

1. **RLS activa en todas las tablas**, incluidas configuración y auditoría. Ninguna excepción.
2. **Ninguna política de `DELETE`.** No hay borrado físico, solo archivado lógico. **Nunca uses la palabra "eliminar" en la interfaz** (usa "Archivar", "Recuperar", "Desactivar", "Anular").
3. **`activities` y `audit_log` son solo de inserción.** Sin políticas de `UPDATE` ni `DELETE` para nadie, incluido el supervisor.
4. **Toda política de `UPDATE` lleva `with check`**, no solo `using`. Sin él, un vendedor podría cambiar `owner_id` y quedarse con la oportunidad de otro.
5. **Ninguna política con condición `true`**, salvo el `select` de `settings`.
6. **Todas las vistas con `security_invoker = true`.** Una vista sin esto filtra los datos de todo el equipo a cualquier vendedor.
7. **Toda función `security definer` fija `search_path = public`.**
8. **`SUPABASE_SERVICE_ROLE_KEY` nunca sale del servidor.** Solo en Route Handlers y Server Actions. Jamás en un componente cliente, ni siquiera importado sin usar.
9. **Los secretos se comparan con `crypto.timingSafeEqual`**, nunca con `===`. (Usar `safeEqual` de `src/lib/safe-equal.ts`.)
10. **El rol se lee de la tabla `profiles`**, nunca de un JWT ni de nada que venga del cliente.
11. **n8n nunca toca Postgres.** Todo pasa por los endpoints `/api/n8n/*` de la aplicación.

La base de datos que cumple 1–7 ya está definida y verificada en `SCRIPTS-SQL.md`. Tu código debe cumplir 8–11 y no debilitar nada de lo anterior.

### 4.1 Reglas de implementación que derivan de lo anterior

- **Tres clientes de Supabase** (`TECHNICAL_SPEC.md` §7). Por defecto, el cliente de servidor con la sesión del usuario (RLS). El cliente administrador vive en `src/lib/supabase/admin.ts` (primera línea `import 'server-only'`) y **solo** se importa desde las operaciones enumeradas en `TECHNICAL_SPEC.md` §8.3 y §10–§11. Antes de usarlo, la función verifica el rol del llamador.
- Ninguna variable con prefijo `NEXT_PUBLIC_` contiene un secreto. La clave de servicio se marca *Sensitive* en Vercel.
- **Nunca** imprimir, registrar, comitear ni devolver en una respuesta un secreto, clave o contraseña (excepto la contraseña temporal mostrada **una vez** al supervisor al crear o restablecer un usuario). Si el humano pega un secreto en la conversación, avísale de que debe **rotarlo**.
- **Sin borrado:** ningún `.delete()`, `DELETE`, `TRUNCATE` ni `auth.admin.deleteUser` en el código, con **una única excepción**: la compensación de un alta de usuario fallida descrita en `TECHNICAL_SPEC.md` §8.3.
- **Validación en el servidor** con Zod de toda entrada (nunca confiar en el cliente). Los campos de ID que recibe una acción se validan como UUID.
- **El middleware no es la única barrera:** cada Server Action y Route Handler que requiera un rol lo comprueba de nuevo con `getCurrentProfile()`.
- Mensajes de error al usuario: en español, sin trazas ni detalles internos.
- Los logs del servidor no incluyen teléfonos, correos ni notas.

### 4.2 Guardia automática obligatoria: `scripts/check-security.mjs`

Cada aplicación (`web/`, `pwa/`) incluye este script (`npm run check:security`). Debe **fallar** (código distinto de 0) si encuentra:

1. `SUPABASE_SERVICE_ROLE_KEY` o `service_role` fuera de los archivos permitidos (`src/lib/supabase/admin.ts`, `scripts/` y archivos de entorno de ejemplo).
2. Cualquier archivo con `'use client'` que importe, directa o indirectamente, `admin.ts` o `server-only`.
3. Variables `NEXT_PUBLIC_*` cuyo nombre contenga `SERVICE`, `SECRET`, `KEY` (salvo `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `PASSWORD` o `TOKEN`.
4. La palabra "eliminar" o "borrar" (sin distinguir mayúsculas) en textos de interfaz (`src/app`, `src/components`).
5. Llamadas `.delete(` de Supabase, `deleteUser`, o sentencias `DELETE`/`TRUNCATE` (salvo la compensación permitida, marcada con el comentario `// COMPENSACION_ALTA_FALLIDA`).
6. Lectura de roles desde `user_metadata`, `app_metadata`, `jwt`, `getSession().user.role` o cookies propias.
7. Comparaciones de secretos con `===`, `==` o `!==` en archivos de `src/app/api` (todo secreto pasa por `safeEqual`).
8. Archivos `.env*` rastreados por git (excepto `.env.example`).

Se ejecuta antes de **cada** confirmación de hito y se muestra el resultado al humano.

---

## 5. La base de datos es de solo lectura para ti

- `SCRIPTS-SQL.md` es la **única** definición de la base. La ejecuta Claude.ai Chat (Hito 1). **No ejecutas DDL** (crear, alterar o borrar tablas, columnas, políticas, vistas o funciones) ni migraciones, ni siquiera "pequeños ajustes".
- Los tipos TypeScript se **generan** desde Supabase (`src/types/database.ts`) y no se editan a mano.
- Usa **exactamente** los nombres de tablas, columnas, vistas y valores permitidos de `SCRIPTS-SQL.md`.
- Si crees que falta una columna, una vista o una regla: **detente**, descríbelo al humano en lenguaje de negocio y espera. Un cambio implica una nueva versión de `SCRIPTS-SQL.md` (y de los documentos que la usan), aprobada por el humano.

---

## 6. Convenciones de código

- **TypeScript estricto**, sin `any`. Componentes de servidor por defecto; `'use client'` solo cuando hace falta interactividad.
- **Español** en toda la interfaz y los mensajes; el código y los nombres técnicos en inglés. Texto de interfaz en un solo lugar por pantalla, sin duplicar.
- **Euros** con formato `es-ES` (`1.234,50 €`); **fechas** `dd/mm/aaaa`; "hoy" según la zona de `settings` (`Europe/Madrid`), nunca la fecha del navegador.
- **Teléfono:** normalizar y validar según `TECHNICAL_SPEC.md` §5.1 antes de guardar.
- Sin `select *` sobre tablas; listas paginadas (50); orden determinista.
- **Accesibilidad:** etiquetas en todos los campos, foco visible, contraste AA, objetivos táctiles ≥ 44 px en la PWA, navegable con teclado en escritorio.
- Dependencias: solo las del stack aprobado (`TECHNICAL_SPEC.md` §3). Pide aprobación antes de añadir otra.
- Funciones pequeñas, nombres claros, sin código muerto. Cada módulo de `src/lib/` con pruebas Vitest cuando contiene lógica.
- Sigue la jerarquía y los estados de pantalla de `DESIGN_BRIEF.md` (vacía, cargando, error, proceso en ejecución). No inventes pantallas ni campos.

---

## 7. Forma de trabajar: hitos con puertas

El trabajo se divide en hitos (`BUILD_PLAN.md`). En cada hito:

1. **Inicio:** lee este archivo, `TECHNICAL_SPEC.md` y la sección del hito. **Informa las variables de entorno** que las aplicaciones necesitan para toda su funcionalidad, explica cómo obtener cada valor y **verifica** (con `scripts/check-env.mjs`, sin imprimir valores) cuáles están configuradas.
2. **Construye** solo lo que el hito indica. Nada del siguiente.
3. **Al final del hito, antes de las pruebas de funcionalidad:** si el humano debe actualizar o crear variables (en Vercel o n8n), **avísalo** con la lista exacta y espera a que confirme que están listas.
4. Ejecuta `npm run check:security`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en cada aplicación afectada, y muestra el resultado.
5. Entrega al humano la **lista de pruebas de funcionalidad** del hito, con el resultado esperado de cada una.
6. **PUERTA:** **NO puedes avanzar al siguiente hito hasta recibir la confirmación explícita del humano.** Pide la confirmación con una pregunta clara y espera. El silencio no es una confirmación.

Ante cualquier ambigüedad que cambie lo que se construye: pregunta (una pregunta corta, con una recomendación). Si es de bajo riesgo, propón un valor por defecto y pide solo que lo confirme.

---

## 8. Git y despliegue

- Trabaja **solo** en la rama `gh-crm-123`. No crear otras ramas, no reescribir historial, no `push --force`.
- Commits pequeños y con sentido, con mensajes en español en imperativo (por ejemplo, "Añade el ingreso con correo y contraseña").
- Nunca comitear `.env*` con valores, claves, tokens ni exportaciones de datos reales.
- **No despliegues.** El despliegue a Vercel lo hace el humano de forma manual (Deploy Hook de cada proyecto). Cada carpeta lleva `vercel.json` con `{"git": {"deploymentEnabled": false}}`. En cada hito, entrega el procedimiento de despliegue y la lista de variables que deben existir en Vercel.
- El flujo de n8n **no se activa solo**: se entrega como archivo JSON para importarlo a mano en n8n Cloud.

---

## 9. Qué NO hacer (resumen)

- No ejecutar DDL ni cambiar la estructura de la base.
- No añadir funciones, campos ni pantallas no previstas.
- No pedir ni guardar identificadores personales.
- No usar "eliminar" en la interfaz ni borrar datos.
- No usar la clave de servicio en el navegador ni importarla en código de cliente.
- No leer el rol de otro sitio que no sea `profiles`.
- No dejar que n8n lea o escriba la base directamente.
- No avanzar de hito sin la confirmación del humano.
- No desplegar. No imprimir ni guardar secretos.
