# BUILD_PLAN.md — CRM-123

**Versión 1.0 · 22-nov-2026 · Plan de 4 hitos.**

| Hito | Quién lo ejecuta | Qué entrega |
|---|---|---|
| **1 · Base de datos** | **Claude.ai Chat** con el conector MCP de Supabase (conversación nueva) | La base `dbcrm123` creada, verificada y probada. Nada de interfaz. |
| **2 · Entrar y desplegar** | **Claude Code Web** | Ingreso, armazón de navegación y tablero del día vacío, en las dos aplicaciones, desplegadas. |
| **3 · Núcleo comercial** | Claude Code Web | Lo que un vendedor usa todos los días. |
| **4 · Supervisión y una automatización** | Claude Code Web | Panel del equipo, administración y el flujo `WF-CRM123` de n8n. |

## Reglas de este plan (valen para los cuatro hitos)

1. **Puerta de hito.** **No se puede avanzar al siguiente hito hasta recibir la confirmación explícita del humano.** Al terminar cada hito se presenta el informe, se pide la confirmación con una pregunta clara y se espera. El silencio no confirma.
2. **Variables de entorno.** **Al inicio de cada hito** se informan las variables que las aplicaciones necesitan para toda su funcionalidad (sección 1), se explica cómo obtener sus valores y se **verifica** cuáles están configuradas. **Al final de cada hito, antes de las pruebas de funcionalidad**, se avisa al humano de las que debe crear o actualizar.
3. **Sin atajos de seguridad.** Todo lo de `CLAUDE.md` §4 rige en cada hito. La estructura de la base es la de `SCRIPTS-SQL.md` y no se modifica.
4. **El humano no es técnico.** Cada indicación se da paso a paso, en español, con el nombre exacto de los botones a pulsar.
5. **Valores secretos:** nunca se pegan en una conversación. Se escriben directamente en Vercel o en n8n.

---

## 0. Antes de empezar (cuentas necesarias)

| Servicio | Qué se necesita | Cuándo |
|---|---|---|
| **Supabase** | Organización **Org CRM 123** | Hito 1 |
| **GitHub** | Repositorio del proyecto (rama `gh-crm-123`) | Hito 2 |
| **Vercel** | Cuenta conectada a GitHub | Hito 2 |
| **Resend** | Cuenta (anota con qué correo la creas) | Hito 4 |
| **n8n Cloud** | Cuenta (tiene periodo de prueba; comprueba el plan vigente antes de depender del flujo) | Hito 4 |

---

## 1. Variables de entorno: catálogo completo

Estas son **todas** las variables que las aplicaciones necesitan para toda su funcionalidad. Al inicio de cada hito se repite esta lista y se verifica su estado con `scripts/check-env.mjs` (que informa presentes/faltantes **sin imprimir valores**).

### 1.1 Cómo obtener cada valor

| Variable | Aplicaciones | Cómo se obtiene (paso a paso) | Necesaria desde |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | web, pwa | Supabase › proyecto **dbcrm123** › **Project Settings** › **API** › copia **Project URL**. (Claude.ai Chat también la entrega al final del Hito 1.) | Hito 2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web, pwa | Supabase › **Project Settings** › **API Keys** › copia la clave **anon** (o **publishable**). Es pública por diseño. | Hito 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | web, pwa | Supabase › **Project Settings** › **API Keys** › copia la clave **service_role** (o **secret**) con el botón *Reveal*. **Es secreta:** no la pegues en ninguna conversación; escríbela directamente en Vercel y marca la variable como *Sensitive*. | Hito 2 (se usa desde el Hito 4) |
| `APP_ORIGIN` | pwa | La dirección de la PWA en Vercel, **sin barra final**: Vercel › proyecto `crm-123-pwa` › **Domains**; por ejemplo `https://crm-123-pwa.vercel.app`. | Hito 4 (se crea en el Hito 2) |
| `N8N_API_SECRET` | pwa (y credencial en n8n) | Genera un texto aleatorio de 48 caracteres o más: con el generador de contraseñas de tu gestor (64 caracteres, letras y números) o con el comando `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. El **mismo valor** va en Vercel y en n8n (sección 5.3). | Hito 4 |
| `N8N_WEBHOOK_SECRET` | pwa (y credencial en n8n) | Igual que el anterior, pero **un valor distinto**. | Hito 4 |
| `N8N_WEBHOOK_URL` | pwa | En n8n Cloud, tras importar y **activar** `WF-CRM123`: abre el nodo **Disparo manual** › pestaña **Production URL** › copia la dirección. | Hito 4 |
| `RESEND_FROM` | pwa | Escribe exactamente `CRM-123 <onboarding@resend.dev>`. | Hito 4 |
| `SUMMARY_TEST_RECIPIENT` | pwa | El correo con el que creaste tu cuenta de **Resend** (Resend solo entrega a ese correo desde `onboarding@resend.dev`). | Hito 4 |

Credenciales que se crean **dentro de n8n** (no son variables de Vercel): "CRM123 Webhook Secret", "CRM123 API Secret" y "Resend API" (la clave de API se crea en Resend › **API Keys** › **Create API Key** › permiso *Sending access*). Detalle en el Hito 4.

### 1.2 Qué debe existir en Vercel, por hito (acumulado)

| Hito | Proyecto `crm-123-web` | Proyecto `crm-123-pwa` |
|---|---|---|
| 1 | — (no hay aplicaciones) | — |
| 2 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Las mismas 3 + `APP_ORIGIN` |
| 3 | Sin cambios | Sin cambios |
| 4 | Sin cambios | + `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `N8N_API_SECRET`, `RESEND_FROM`, `SUMMARY_TEST_RECIPIENT` |

---

## 2. Hito 1 — Base de datos

**Qué construye:** la base de datos de `dbcrm123` a partir de `SCRIPTS-SQL.md`; el script se entrega y se ejecuta. **Nada de interfaz.**
**Quién:** Claude.ai Chat, en una **conversación nueva** con el conector MCP de Supabase activado. Se le adjuntan `CLAUDE.md`, `TECHNICAL_SPEC.md` y, sobre todo, `SCRIPTS-SQL.md` (la estructura oficial y las pruebas).

### 2.1 Variables de entorno (inicio del hito)
Chat presenta la tabla de la sección 1 y explica que **en este hito no existe ninguna aplicación** que las use. Verificación de estado: "ninguna configurada todavía; se verifican en el Hito 2". Al terminar el hito entrega los valores públicos (URL del proyecto y clave anónima/publishable). **Nunca** solicita ni muestra la clave `service_role`.

### 2.2 Texto de arranque (el humano lo pega en la conversación nueva)

> Eres el ejecutor del Hito 1 de CRM-123. Te adjunto `CLAUDE.md`, `TECHNICAL_SPEC.md` y `SCRIPTS-SQL.md`. Léelos completos. `SCRIPTS-SQL.md` es la estructura **oficial e inmutable** de la base de datos: no la modifiques ni ejecutes nada que no esté en ella. Sigue `BUILD_PLAN.md`, sección "Hito 1". Háblame en español, en lenguaje de negocio, y avísame antes de cualquier paso que cueste dinero. No avances de paso sin dejar claro el resultado del anterior. Al final, espera mi confirmación.

### 2.3 Procedimiento (para Claude.ai Chat)

Usa el conector MCP de Supabase (herramientas como `list_organizations`, `get_cost`, `confirm_cost`, `create_project`, `get_project`, `apply_migration`, `execute_sql`, `get_advisors`, `generate_typescript_types`, `get_project_url`, `get_publishable_keys`; o sus equivalentes).

**A. Preparación**
1. Lista las organizaciones. Confirma que existe **Org CRM 123**. Si no existe, detente y pide al humano que la cree en supabase.com (Dashboard › New organization › nombre `Org CRM 123`, plan **Free**).
2. Lista los proyectos de esa organización. Si ya existe `dbcrm123`, pregunta si se reutiliza (no lo borres ni lo pauses).

**B. Crear el proyecto**
3. Consulta el costo (`get_cost`) y confírmalo (`confirm_cost`) **con el humano**. Se espera **0 €** (plan gratuito).
4. Crea el proyecto **`dbcrm123`** en la organización **Org CRM 123**, región **UE (Frankfurt, `eu-central-1`)**. Si el conector pide una contraseña de base de datos, genera una larga y aleatoria y **no la muestres**.
5. Espera a que el proyecto esté activo (`get_project`).

**C. Construir la estructura** (aplicar con `apply_migration`, en este orden y con estos nombres)

| Orden | Nombre de la migración | Contenido |
|---|---|---|
| 1 | `001_tables` | Script `01_tables.sql` |
| 2 | `002_functions_triggers` | Script `02_functions_triggers.sql` |
| 3 | `003_rls_policies` | Script `03_rls_policies.sql` |
| 4 | `004_views` | Script `04_views.sql` |
| 5 | `005_grants` | Script `05_grants.sql` |
| 6 | `006_seed_settings` | Script `06_seed_settings.sql` |

Copia cada script **tal cual** de `SCRIPTS-SQL.md`. Si uno falla, **detente**: muestra el error exacto y no improvises correcciones.

**D. Validar la estructura (con la base vacía)**
7. Ejecuta `V01_verificacion_estructura.sql` (archivo completo, en una sola llamada con `execute_sql`). **Esperado:** 17 filas, todas con `ok = true`.
8. Ejecuta `T01_pruebas_integridad.sql` (completo, una llamada). **Esperado:** el bloque termina con el error intencional `RESULTADO_PRUEBAS T01: 53 de 53 correctas`.
9. Ejecuta `T02_pruebas_seguridad_rls.sql` (completo, una llamada). **Esperado:** `RESULTADO_PRUEBAS T02: 43 de 43 correctas`.
   - T01 y T02 solo se ejecutan **con la base vacía** (antes del paso 13). Dejan la base intacta porque revierten todo.
   - Si falla únicamente la preparación de una prueba (por ejemplo, la inserción de usuarios de prueba en `auth.users`), puedes ajustar **solo esa línea** e informarlo. Nunca cambies la estructura para que una prueba pase.
10. Ejecuta `get_advisors` de **seguridad** y de **rendimiento**. Reporta los avisos tal cual, **sin corregirlos por tu cuenta**. Esperable: aviso sobre protección contra contraseñas filtradas (depende del plan).
11. Con `generate_typescript_types`, genera los tipos de TypeScript y entrégalos como archivo `database.ts`, para guardarlo en `web/src/types/` y `pwa/src/types/` en el Hito 2.

**E. AVISO AL HUMANO: acciones manuales antes de las pruebas de funcionalidad**
12. Chat detiene el trabajo y da al humano esta lista, paso a paso, y espera que confirme:
    1. **Supabase › Authentication › Sign In / Providers**: desactivar **Allow new users to sign up** (registro público apagado). En *Email*, fijar **longitud mínima de contraseña = 10** y, si está disponible, exigir letras y dígitos.
    2. **Supabase › Authentication › Users › Add user › Create new user**, marcando **Auto Confirm User**, para: **1 supervisor** y **2 vendedores de prueba**. El humano escribe él mismo una contraseña temporal para cada uno (**no se la dice a Chat**).
    3. Copia, de cada usuario creado, el **User UID** y pásaselo a Chat junto con el **nombre completo**, el **correo** y el **rol** de cada persona (sin contraseñas).

**F. Pruebas de funcionalidad (con los datos iniciales)**
13. Con los datos del humano, completa y ejecuta `07_bootstrap_profiles_TEMPLATE.sql`: un `INSERT` por persona, con sus UID reales.
14. Comprueba:

| # | Prueba | Resultado esperado |
|---|---|---|
| P1 | `select role, count(*) from public.profiles group by role` | 1 supervisor y 2 vendedores, todos `is_active = true` y `must_change_password = true` |
| P2 | `select * from public.settings` | Una fila: `id 1`, resumen activo, `Europe/Madrid`, `EUR`, 10 minutos |
| P3 | `select action, count(*) from public.audit_log group by action` | 3 eventos `usuario_creado` |
| P4 | Reejecutar `V01_verificacion_estructura.sql` | 17 filas, todas `ok = true` (la estructura no cambió) |
| P5 | `select count(*) from public.customers` y `public.opportunities` | 0 y 0 (sin datos de negocio) |

15. Verifica que **no** se creó ningún dato de prueba residual de T01/T02 (P5 y `select count(*) from auth.users` = 3).

**G. Entrega y puerta**
16. Chat entrega un **informe** con: resultado de V01 / T01 / T02, avisos de `get_advisors`, **Project URL**, **clave anónima/publishable**, el archivo `database.ts`, y la lista de lo que el humano debe hacer en el Hito 2.
17. Chat pregunta: **"¿Confirmas que el Hito 1 está correcto para pasar al Hito 2?"** y **no avanza** sin un "sí" explícito.

### 2.4 Vercel en este hito
Ninguna variable ni despliegue.

### 2.5 Criterio de cierre
V01 17/17, T01 53/53, T02 43/43, P1–P5 correctas, avisos reportados, `database.ts` entregado, confirmación explícita del humano.

---

## 3. Hito 2 — Entrar y desplegar

**Qué construye** (solo esto): **el ingreso, el armazón de navegación y el tablero del día vacío**, en las dos aplicaciones, y su despliegue.
**Quién:** Claude Code Web, sobre la rama `gh-crm-123`. **Antes de empezar**, el humano ha confirmado el Hito 1.

### 3.1 Variables de entorno (inicio del hito)
1. Informa la tabla de la sección 1.1 y la de 1.2.
2. Explica al humano cómo obtener las necesarias **en este hito**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (y `APP_ORIGIN` de la PWA, que se conoce al crear el proyecto de Vercel).
3. Crea `.env.example` y `scripts/check-env.mjs` y **verifica** el estado (presentes/faltantes, sin valores) en `web/` y `pwa/`. Para el trabajo local, las variables van en `.env.local` (ignorado por git).

### 3.2 Construcción
**Ambas aplicaciones**
- Proyecto Next.js (App Router, TypeScript estricto, Tailwind, shadcn/ui), estructura de `TECHNICAL_SPEC.md` §4.
- Los tres clientes de Supabase (`browser.ts`, `server.ts`, `admin.ts` con `import 'server-only'`) y `getCurrentProfile()` (rol desde `profiles`).
- Tipos `database.ts` entregados en el Hito 1.
- Middleware: sesión, rutas protegidas, desvío a **Cambiar contraseña** si `must_change_password`, cierre de sesión de usuarios desactivados.
- Pantallas de **Ingreso** y **Cambiar contraseña** (con `mark_password_changed()`), conforme a `DESIGN_BRIEF.md`.
- Cabeceras de seguridad (`TECHNICAL_SPEC.md` §15), `vercel.json` con `{"git": {"deploymentEnabled": false}}`.
- `scripts/check-env.mjs` y `scripts/check-security.mjs` (`CLAUDE.md` §4.2); scripts `lint`, `typecheck`, `test`, `check:security`.
- Pruebas unitarias de los módulos de `src/lib/` ya creados (teléfono, dinero, fechas, `safeEqual`, errores).

**`web/`**: barra lateral completa (Tablero, Clientes, Oportunidades, Archivados; bloque Administración solo para supervisor), barra superior y **Tablero del día vacío** (esqueleto, estado vacío inicial, lectura real de las vistas). Las secciones aún no construidas muestran "Esta sección se habilitará en el siguiente hito."

**`pwa/`**: manifiesto, iconos, service worker mínimo y `/offline`; navegación inferior (Panel, Oportunidades, Resumen, Cuenta); **Panel del equipo vacío**; rechazo de vendedores ("Esta aplicación es solo para supervisores.").

### 3.3 Procedimiento de despliegue en Vercel (lo hace el humano; Claude Code lo guía paso a paso)

**Una sola vez por aplicación** (repetir para `web` y `pwa`):
1. Vercel › **Add New…** › **Project** › importa el repositorio de GitHub.
2. **Project Name:** `crm-123-web` (o `crm-123-pwa`). **Root Directory:** `web` (o `pwa`). **Framework Preset:** Next.js.
3. Vercel › proyecto › **Settings** › **Git** › **Production Branch:** `gh-crm-123`.
4. Vercel › **Settings** › **Environment Variables:** crea las variables de la sección 1.2 para el hito (entorno *Production*). Marca `SUPABASE_SERVICE_ROLE_KEY` como **Sensitive**.
5. Vercel › **Settings** › **Git** › **Deploy Hooks:** crea uno llamado `manual`, rama `gh-crm-123`, y **guarda su dirección** en un lugar privado (es la llave para desplegar).
6. Para **desplegar**: abre la dirección del Hook (pegándola en el navegador, o con `curl -X POST <dirección>`). Vercel › **Deployments**: espera el estado **Ready**.
7. Supabase › **Authentication › URL Configuration**: **Site URL** = dirección de `crm-123-web`; en **Redirect URLs** añade la de `crm-123-pwa`.

**Cada despliegue posterior** (hitos 3 y 4): Claude Code sube los cambios a `gh-crm-123`; el humano abre el Deploy Hook de la aplicación modificada.

### 3.4 AVISO AL HUMANO: variables a crear o actualizar (antes de las pruebas)
Claude Code entrega la lista exacta de lo que falta en cada proyecto de Vercel (comparando con 1.2) y **espera confirmación** de que está lista y de que el despliegue terminó en **Ready**.

### 3.5 Pruebas de funcionalidad

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Verificaciones locales: `check:security`, `lint`, `typecheck`, `test`, `build` en `web/` y `pwa/` | Todo en verde |
| 2 | `check-env` en `web/` y `pwa/` | Todas las variables del hito presentes |
| 3 | Un **push** a `gh-crm-123` | **No** inicia ningún despliegue por sí solo |
| 4 | Abrir el Deploy Hook de cada aplicación | Despliegue **Ready**; las dos URL abren |
| 5 | Ingresar en `web` con el supervisor y la contraseña temporal | Pide cambiar contraseña; con una de menos de 10 caracteres o sin números, la rechaza |
| 6 | Completar el cambio de contraseña | Entra al tablero vacío; al volver a ingresar ya no pide cambio |
| 7 | Contraseña equivocada | Mensaje "Correo o contraseña incorrectos" sin indicar cuál falló |
| 8 | Ingresar en `web` con un vendedor de prueba | Ve el menú sin el bloque **Administración** |
| 9 | Como vendedor, abrir directamente la dirección `/admin/usuarios` | "No tienes permiso para ver esto." |
| 10 | Ingresar en `pwa` con el supervisor | Entra al Panel vacío |
| 11 | Ingresar en `pwa` con un vendedor | Mensaje "Esta aplicación es solo para supervisores." y sesión cerrada |
| 12 | Cerrar sesión en ambas | Vuelve al ingreso; el botón Atrás no muestra datos |
| 13 | Instalar la PWA en el móvil | Se puede instalar; abre en pantalla completa |
| 14 | Poner el móvil en modo avión y abrir la PWA | Muestra la pantalla "Sin conexión" |
| 15 | Buscar la clave de servicio en el código descargado por el navegador (DevTools › Sources) | **No aparece** |
| 16 | Desactivar un vendedor (en Supabase, `update profiles set is_active = false …`) e intentar entrar | No puede operar; vuelve a activarlo al terminar |

### 3.6 Criterio de cierre y puerta
Pruebas 1–16 correctas. Claude Code presenta el informe y pregunta: **"¿Confirmas que el Hito 2 está correcto para pasar al Hito 3?"**. **NO puede avanzar al Hito 3 hasta recibir la confirmación del humano.**

---

## 4. Hito 3 — Núcleo comercial

**Qué construye:** **agrega a la funcionalidad existente** lo que un vendedor usa todos los días, en `web/`: clientes, oportunidades, actividades, próxima acción, tablero del día con datos, archivados, búsqueda rápida. La PWA no cambia.

### 4.1 Variables de entorno (inicio del hito)
Informa de nuevo las secciones 1.1 y 1.2, indica que **este hito no requiere variables nuevas** y **verifica** con `check-env` que las del Hito 2 siguen presentes en `web/` y `pwa/`.

### 4.2 Construcción (`web/`)
- **Clientes:** lista con búsqueda y filtros, alta y edición (teléfono normalizado y único), ficha con historial, archivar y recuperar.
- **Oportunidades:** lista con filtros y totales, alta y edición, ficha, cambio de etapa, **cierre Ganada** (monto final y fecha), **cierre Perdida** (motivo obligatorio), **reabrir**, archivar y recuperar.
- **Próxima acción** (fecha + texto) en cada oportunidad abierta.
- **Actividades:** registrar (Llamada, Mensaje, Reunión o visita, Nota) y **anular** (nunca editar ni borrar).
- **Tablero del día** con datos reales: acciones de hoy y atrasadas, indicadores, embudo.
- **Archivados** (clientes y oportunidades) y **búsqueda rápida** por nombre o teléfono.
- **Cambiar vendedor** de un cliente (supervisor), con la regla de que las oportunidades lo siguen.
- Traducción de errores de base de datos (`TECHNICAL_SPEC.md` §5.2) y todos los estados de pantalla de `DESIGN_BRIEF.md`.
- Pruebas unitarias de las operaciones de cierre y reapertura y del traductor de errores.

### 4.3 Procedimiento de despliegue en Vercel
Claude Code sube el trabajo a `gh-crm-123`. El humano abre el **Deploy Hook de `crm-123-web`** (3.3, paso 6) y espera **Ready**. `crm-123-pwa` no cambia y no se redespliega.

### 4.4 AVISO AL HUMANO (antes de las pruebas)
Variables nuevas: **ninguna**. Claude Code lo confirma tras ejecutar `check-env`. Recuerda al humano que, para probar el aislamiento entre vendedores, necesita **dos vendedores de prueba con contraseña ya cambiada** (los del Hito 1) y el supervisor.

### 4.5 Pruebas de funcionalidad

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Verificaciones locales (`check:security`, `lint`, `typecheck`, `test`, `build`) | Todo en verde |
| 2 | **Vendedor A** crea un cliente con teléfono `600111222` | Se guarda como `+34 600 111 222` |
| 3 | Vendedor A crea otro cliente con el **mismo teléfono** | Mensaje "Ese teléfono ya está registrado…"; no se crea |
| 4 | **Vendedor B** intenta registrar ese mismo teléfono | El mismo mensaje; **no** ve al cliente de A en su lista |
| 5 | Teléfono inválido (`abc`) y correo inválido | Errores junto al campo |
| 6 | El formulario de cliente | **No** pide ningún documento de identidad |
| 7 | Vendedor A crea una oportunidad (tipo, monto 500 €) con próxima acción para **ayer** | Aparece en **Atrasadas** del tablero con "Atrasada · 1 día" |
| 8 | Otra oportunidad con próxima acción **hoy** | Aparece en **Para hoy** |
| 9 | Registrar una **Llamada** en la oportunidad | Entra al historial con autor, fecha y hora |
| 10 | **Anular** esa llamada | Queda tachada con "Anulada"; no hay opción de editar ni de borrar |
| 11 | Cerrar la oportunidad como **Ganada** | Pide monto final (propone 500 €) y fecha; pasa a Ganada y sale del tablero |
| 12 | Cerrar otra como **Perdida** sin motivo | No deja confirmar; con motivo, queda Perdida |
| 13 | **Reabrir** una cerrada | Quita monto final, fecha y motivo; vuelve a una etapa abierta |
| 14 | **Archivar** un cliente | Desaparece de Clientes, aparece en **Archivados**; **Recuperar** lo devuelve |
| 15 | Buscar en la barra superior por teléfono y por apellido | Abre la ficha correcta |
| 16 | Revisar toda la interfaz | La palabra "eliminar" **no aparece** en ningún sitio |
| 17 | **Supervisor** abre Clientes y Oportunidades | Ve los de **todos** los vendedores, con columna Vendedor |
| 18 | Supervisor usa **Cambiar vendedor** en un cliente con oportunidades | El cliente **y sus oportunidades** pasan al nuevo vendedor; el vendedor anterior ya no los ve |
| 19 | Con las pantallas sin datos (usuario nuevo) | Se ven los estados vacíos descritos |
| 20 | Cortar la conexión y guardar un cliente | Mensaje de error con **Reintentar**; no se duplica al reintentar |
| 21 | Revisar los resultados de `check:security` | Sin hallazgos |

### 4.6 Criterio de cierre y puerta
Pruebas 1–21 correctas. Claude Code presenta el informe y pregunta: **"¿Confirmas que el Hito 3 está correcto para pasar al Hito 4?"**. **NO puede avanzar al Hito 4 hasta recibir la confirmación del humano.**

---

## 5. Hito 4 — Supervisión y una automatización

**Qué construye:** **agrega a la funcionalidad existente** el panel del equipo (PWA), la administración del supervisor (web) y **el flujo JSON de n8n del spec** (resumen matutino) para importarlo manualmente en n8n Cloud.

### 5.1 Variables de entorno (inicio del hito)
1. Informa de nuevo las secciones 1.1 y 1.2: en este hito se **estrenan** las variables de `pwa/`: `N8N_API_SECRET`, `N8N_WEBHOOK_SECRET`, `N8N_WEBHOOK_URL`, `RESEND_FROM`, `SUMMARY_TEST_RECIPIENT` (y `APP_ORIGIN`, ya creada).
2. Explica cómo obtener cada valor (tabla 1.1) y **verifica** con `check-env` cuáles faltan en `pwa/`. Indica que `N8N_WEBHOOK_URL` solo existe tras importar y activar el flujo (paso 5.4).

### 5.2 Construcción
**`web/` (supervisor)**
- **Usuarios:** lista con contadores (vendedores y supervisores activos), crear usuario (contraseña temporal mostrada una vez), desactivar y reactivar, restablecer contraseña temporal. Uso del cliente administrador solo según `TECHNICAL_SPEC.md` §8.3.
- **Reasignar:** individual (ya existente) y **en bloque** con resumen de confirmación.
- **Auditoría:** lista de solo lectura, con filtros y etiquetas legibles.

**`pwa/`**
- **Panel del equipo** con datos reales (indicadores, tarjetas por vendedor, motivos de pérdida), **Oportunidades** y **Detalle** en consulta, **Detalle de vendedor**, **Cuenta**.
- **Resumen matutino:** interruptor, **Enviar ahora** (con los 12 pasos de protección de `TECHNICAL_SPEC.md` §11), tarjeta de último envío con todos sus estados (en ejecución, correcto, con errores, fallido, demasiado pronto, sin envíos).
- Endpoints `/api/summary/send` y `/api/n8n/runs/start`, `/payload`, `/finish` (`TECHNICAL_SPEC.md` §10.5), con `safeEqual` (`timingSafeEqual`), validación Zod, `Cache-Control: no-store`.
- Generador de correos (vendedor y supervisor), con escape de HTML, texto plano y **modo de prueba**.
- **Flujo `pwa/n8n/WF-CRM123.json`** según `TECHNICAL_SPEC.md` §10.6, listo para importar. Sin claves en claro.
- Pruebas unitarias: `safeEqual`, generación y escape de los correos, estados del resumen, reglas del intervalo.

### 5.3 Procedimiento para el humano: Resend, n8n y secretos (Claude Code lo guía paso a paso)

**Orden obligatorio** (porque `N8N_WEBHOOK_URL` solo existe al final del paso 5):
1. **Resend:** crea tu cuenta (anota el correo). **API Keys › Create API Key** › permiso **Sending access** › copia la clave (se muestra una sola vez; guárdala en tu gestor de contraseñas).
2. **Genera los dos secretos** (`N8N_API_SECRET` y `N8N_WEBHOOK_SECRET`), distintos entre sí (sección 1.1).
3. **Vercel › `crm-123-pwa` › Settings › Environment Variables:** crea `N8N_API_SECRET`, `N8N_WEBHOOK_SECRET`, `RESEND_FROM` (`CRM-123 <onboarding@resend.dev>`) y `SUMMARY_TEST_RECIPIENT` (el correo de tu cuenta de Resend). Marca los secretos como **Sensitive**.
4. **n8n Cloud › Credentials › Add credential › Header Auth**, tres veces:
   - **CRM123 Webhook Secret:** *Name* `X-CRM-Secret`, *Value* = el valor de `N8N_WEBHOOK_SECRET`.
   - **CRM123 API Secret:** *Name* `Authorization`, *Value* = `Bearer ` + el valor de `N8N_API_SECRET` (con un espacio después de *Bearer*).
   - **Resend API:** *Name* `Authorization`, *Value* = `Bearer ` + la clave de API de Resend.
5. **Importar el flujo:** n8n › **Workflows › Add workflow › ⋯ › Import from file** › selecciona `pwa/n8n/WF-CRM123.json` (se descarga del repositorio) y llámalo **WF-CRM123**.
   - Abre el nodo **Config** y escribe en `app_base_url` la dirección de `crm-123-pwa` (la misma que `APP_ORIGIN`, sin barra final).
   - En cada nodo HTTP y en el Webhook, **asigna la credencial** que corresponde (n8n marca en rojo las que faltan).
   - Activa el flujo (**Active**). Abre el nodo **Disparo manual › Production URL** y **copia esa dirección**.
6. **Vercel › `crm-123-pwa`:** crea `N8N_WEBHOOK_URL` con esa dirección.
7. **Despliega `crm-123-pwa` y `crm-123-web`** con sus Deploy Hooks y espera **Ready**.

### 5.4 AVISO AL HUMANO (antes de las pruebas)
Claude Code entrega la lista exacta de lo que falta, compara con 1.2 y **espera confirmación** de que: (a) las 5 variables nuevas existen en `crm-123-pwa`; (b) las 3 credenciales existen en n8n y el flujo está **Active**; (c) ambos proyectos están en **Ready**.

### 5.5 Pruebas de funcionalidad

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Verificaciones locales (`check:security`, `lint`, `typecheck`, `test`, `build`) en ambas | Todo en verde |
| 2 | `check-env` en `pwa/` | Las 9 variables presentes |
| **Administración** | | |
| 3 | Supervisor crea un vendedor nuevo | Se muestra la contraseña temporal **una sola vez**; el vendedor ingresa y debe cambiarla |
| 4 | Intentar crear el vendedor 11 (con 10 activos) y el supervisor 3 | Mensajes claros: "Ya hay 10 vendedores activos" / "Ya hay 2 supervisores activos" |
| 5 | Intentar desactivar al último supervisor activo | La acción se rechaza con un mensaje claro |
| 6 | Desactivar un vendedor | No puede ingresar; el contador baja; sus clientes siguen asignados |
| 7 | **Reasignar en bloque** todos los clientes de un vendedor a otro | Confirmación con el resumen "N clientes y M oportunidades"; después, el destino los ve y el origen no |
| 8 | Abrir **Auditoría** | Aparecen las reasignaciones, altas y desactivaciones, con la persona que las hizo; sin botones de edición |
| 9 | Un vendedor abre `/admin/auditoria` | "No tienes permiso para ver esto." |
| **Panel (PWA)** | | |
| 10 | Panel del equipo con datos de las pruebas | Indicadores y tarjetas por vendedor coherentes con lo cargado (abiertas, ganadas del mes en €, atrasadas) |
| 11 | Tocar un vendedor | Detalle con su embudo y sus acciones atrasadas |
| 12 | Motivos de pérdida | Barras con las cantidades del mes |
| **Resumen matutino** | | |
| 13 | Apagar el interruptor y encenderlo | Se guarda; queda en la auditoría como "Ajuste actualizado" |
| 14 | **Enviar ahora** | Confirmación "Se enviará a N personas"; luego **En ejecución** y finalmente **Correcto** con "Enviados N de N" |
| 15 | Revisar el buzón de la cuenta de Resend | Llegan N correos con asunto `[PRUEBA para …]`: uno por vendedor activo y uno por supervisor; importes en formato `1.234,50 €`; los textos de clientes aparecen escapados |
| 16 | Pulsar **Enviar ahora** otra vez de inmediato | "Espera unos minutos antes de volver a enviar." |
| 17 | Esperar 10 minutos y enviar de nuevo | Funciona |
| 18 | Con el interruptor **apagado**, ejecutar manualmente el flujo desde n8n (rama automática) | El flujo termina sin enviar; no se crea ejecución |
| 19 | Con el interruptor **encendido**, ejecutar manualmente la rama automática desde n8n | Se envía y el "Último envío" aparece como **Automático** |
| 20 | Repetir el paso 19 el mismo día | Se omite ("ya enviado hoy") |
| **Seguridad del disparo** | | |
| 21 | Llamar a `/api/n8n/runs/start` **sin** cabecera de autorización | `401`, sin detalles |
| 22 | Llamarla con una clave incorrecta (incluso casi igual a la correcta) | `401` |
| 23 | Llamar a `/api/summary/send` **sin sesión** | `401` |
| 24 | Llamar a `/api/summary/send` con la sesión de un **vendedor** | `403` |
| 25 | Llamar a `/api/summary/send` con un `Origin` distinto de `APP_ORIGIN` | `403` |
| 26 | Cerrar dos veces una ejecución (`/finish` repetido) | La segunda devuelve `409` |
| 27 | Apagar el flujo en n8n y pulsar **Enviar ahora** | La ejecución queda **Fallido** con un mensaje genérico y no se queda "En ejecución" |
| 28 | Revisar el código descargado por el navegador y los registros de Vercel | Ningún secreto ni clave de servicio |
| 29 | Revisar la auditoría | Constan "Resumen manual solicitado" y "Resumen finalizado" |
| 30 | Ejecutar `check:security` | Sin hallazgos |

### 5.6 Criterio de cierre y puerta
Pruebas 1–30 correctas. Claude Code presenta el informe final y pregunta: **"¿Confirmas que el Hito 4 está correcto?"**. **NO puede dar por cerrado el proyecto ni hacer ningún cambio adicional sin la confirmación del humano.**

### 5.7 Antes de usarlo con el equipo real (lista para el humano; no forma parte del Hito 4)
1. **Resend:** verifica un dominio propio (Resend › **Domains**), cambia `RESEND_FROM` a una dirección de ese dominio y **vacía** `SUMMARY_TEST_RECIPIENT` en Vercel; despliega la PWA. Sin esto, el sistema solo puede entregar a tu cuenta de Resend.
2. **Supabase:** el plan gratuito pausa el proyecto tras una semana de baja actividad; para el equipo real, valora el plan de pago.
3. **Contraseñas:** cambia las de prueba y crea los usuarios reales desde **Administración › Usuarios**.
4. **n8n Cloud:** confirma que tu plan cubre el flujo diario.
