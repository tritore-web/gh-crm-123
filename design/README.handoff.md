# README.handoff — Traspaso a Claude Code Web

Documento de traspaso del diseño de CRM-123 (versión 1.0 del brief, 22-nov-2026). Destinatario: Claude Code Web, para construir la aplicación real a partir de este diseño.

## 1. Qué es esto y qué NO es

- Este artefacto es un **sistema de diseño con maquetas estáticas en HTML + CSS**. No hay React, no hay shadcn/ui, no hay JavaScript funcional (salvo el paso a paso de «Recorridos»), no hay conexión a Supabase ni a n8n.
- **No se usó shadcn/ui.** Todo se maquetó con CSS propio en `components/bundle.css`, que lee solo variables de `tokens.json`. La sección 6 explica qué componente de shadcn/ui corresponde a cada pieza para que **no se reinvente** al construir la aplicación real.
- Las fuentes de verdad, en este orden: (1) `SCRIPTS-SQL.md` para los datos; (2) `DESIGN_BRIEF.md` para comportamiento y textos; (3) este artefacto para el aspecto. Si chocan, gana el orden indicado; si algo no encaja, **detente y avisa a Ines** (regla de cambios de `SCRIPTS-SQL.md`: nadie altera la base por su cuenta).
- Los datos de las maquetas (nombres, importes, fechas) son **ejemplos inventados**; usan solo campos que existen en el modelo. No son datos reales ni semillas.
- Los generadores que produjeron los HTML (scripts de Python) están solo en el espacio de trabajo de la sesión de diseño y **no se entregan**. El HTML publicado es lo único que existe.

## 2. Contexto del proyecto (para no preguntarlo otra vez)

- Negocio: librería-cafetería en España; clientes personas; euro; español de España.
- Usuarios: hasta 10 vendedores (escritorio, sitio web) y hasta 2 supervisores (PWA móvil y escritorio).
- Pila acordada: datos en **Supabase** (proyecto `dbcrm123`, `eu-central-1`, Auth con correo + contraseña, registro público desactivado), código en **GitHub**, despliegue en **Vercel**, resumen matutino por correo en **n8n** (flujo `WF-CRM123`).
- Ines no tiene perfil técnico: explica los avances en lenguaje claro y pide confirmación antes de cualquier decisión irreversible.
- El marco de la aplicación (React, Next.js, Vite…) **no está decidido en los documentos**. Se propone React + TypeScript + Tailwind + shadcn/ui por ser el destino natural de este diseño, pero es una propuesta: confírmala con Ines antes de empezar.

## 3. Pantallas construidas y nombre exacto de cada archivo

Cada pantalla es un componente de tarjeta del sistema de diseño. Ruta: `project/components/<Nombre>/preview.html`. Todas contienen la vista normal y los demás estados en miniatura (mitad de tamaño) o a tamaño real.

### Escritorio (1440 × 900)

| Id | Pantalla | Carpeta / archivo | Estados incluidos |
|---|---|---|---|
| W1 | Ingreso | `W01Login` | normal, cargando, error de credenciales, usuario desactivado, sesión caducada |
| W2 | Cambiar contraseña | `W02CambiarContrasena` | vacía, validación en vivo, contraseña débil, guardando, error |
| W3 | Tablero del día | `W03Tablero` | normal, cargando, vacía «todo al día», vacía inicial, error, versión supervisor (columna y filtro Vendedor) |
| W4 | Clientes (lista) | `W04Clientes` | normal, cargando, vacía, sin resultados, error, supervisor |
| W5 | Nuevo / editar cliente | `W05FormCliente` | nuevo, teléfono duplicado, validación, guardando, editar con «Vendedor asignado» (supervisor) |
| W6 | Ficha del cliente | `W06FichaCliente` | normal, cargando, vacío (sin historial ni oportunidades), archivado, error, diálogo Archivar, diálogo Cambiar vendedor (supervisor) |
| W7 | Oportunidades (lista) | `W07Oportunidades` | normal, cargando, vacía, sin resultados, error, supervisor |
| W8 | Nueva / editar oportunidad | `W08FormOportunidad` | cliente por elegir, cliente fijado, validación, guardando, cliente archivado no elegible |
| W9 | Ficha de la oportunidad | `W09FichaOportunidad` | abierta, Ganada, Perdida, archivada, historial vacío, cargando, error; diálogos Cerrar como Ganada, Cerrar como Perdida, Reabrir, Registrar actividad, «definir siguiente acción», Anular actividad |
| W10 | Archivados | `W10Archivados` | pestaña Clientes, pestaña Oportunidades, vacía, cargando, error |
| W11 | Usuarios (supervisor) | `W11Usuarios` | normal, Nuevo usuario, creando, contraseña temporal (una sola vez), confirmación de Desactivar, último supervisor, límite 10 de 10, cargando, error |
| W12 | Reasignar (supervisor) | `W12Reasignar` | normal, confirmación, en ejecución, éxito con resumen, origen sin clientes, cargando, error |
| W13 | Auditoría (supervisor) | `W13Auditoria` | normal, vacía, cargando, error |

### Móvil PWA (390 × 844)

| Id | Pantalla | Carpeta / archivo | Estados incluidos |
|---|---|---|---|
| M1 | Ingreso y cambio de contraseña | `M01Ingreso` | ingreso, cargando, error, «solo para supervisores», sesión caducada, cambio de contraseña (vacío y cumple) |
| M2 | Panel del equipo | `M02Panel` | normal, normal al desplazarse, cargando, vacía, error |
| M3 | Oportunidades (consulta) | `M03Oportunidades` | normal, filtro Atrasadas, cargando, vacía, sin resultados, error |
| M4 | Detalle de oportunidad | `M04DetalleOportunidad` | abierta, Ganada, Perdida, cargando, error |
| M5 | Detalle de un vendedor | `M05DetalleVendedor` | con atrasadas, sin atrasadas, cargando, error |
| M6 | Resumen matutino | `M06ResumenMatutino` | normal, modo de prueba, hoja de confirmación, en ejecución, Correcto, Con errores, Fallido, demasiado pronto, interruptor apagado, sin envíos, error de conexión |
| M7 | Cuenta | `M07Cuenta` | normal |
| M8 | Sin conexión | `M08SinConexion` | normal |

### Piezas del sistema (carpetas de `project/components/`)

`Buttons`, `Fields`, `Tags`, `DataTable`, `OpportunityCard`, `Timeline`, `Dialog`, `BottomSheet`, `Sidebar`, `BottomNav`, `Stats`, `Skeleton`, `Banner`, `Funnel`, `StageStepper`, `EmptyState` (cada una con `preview.html` y `README.md`), más `Cover` (portada) y `Flows` (recorridos de los flujos 1, 3, 7 y 9).

### Otros archivos

- `project/tokens.json`: fuente de todos los valores visuales (lista de abajo).
- `project/components/bundle.css`: todos los estilos de los componentes (clases `.btn`, `.field`, `.input`, `.tag`, `.tbl`, `.panel`, `.stat`, `.tl`, `.dlg`, `.sheet`, `.sb`, `.bnav`, `.banner`, `.sk`, `.empty`, `.fn`, `.steps`, `.d-frame`, `.m-frame`…). Es la referencia de medidas exactas.
- `project/README.md`: reglas de uso del sistema. `project/puntos-no-disenados.md`: decisiones y supuestos pendientes.

## 4. Valores visuales finales

### Colores (solo modo claro)

| Token | Hex | Uso |
|---|---|---|
| `bg-app` | `#FAF6EF` | Fondo de la aplicación |
| `surface` | `#FFFFFF` | Tarjetas, tablas, paneles, diálogos, campos |
| `border` | `#E6DECF` | Bordes y separadores (decorativo) |
| `border-strong` | `#8A7967` | Borde de campos, casillas y barras (añadido) |
| `text` | `#2B2118` | Texto principal |
| `text-2` | `#6B5B4B` | Texto secundario |
| `brown` | `#4A3426` | Títulos y barra lateral |
| `sb-text` | `#F3E9DC` | Texto sobre la barra lateral (añadido) |
| `sb-text-2` | `#D9C7B3` | Grupo y texto secundario sobre la barra (añadido) |
| `sb-active` | `#5E4533` | Elemento activo de la barra (añadido) |
| `primary` | `#2F5D50` | Acción principal, enlaces, selección, foco |
| `primary-hover` | `#264C41` | Botón principal al pasar el ratón |
| `primary-tint` | `#E5EEEA` | Fondo suave de selección (añadido; reservado, aún sin uso en las maquetas) |
| `success` | `#2F7D5B` | Éxito, Ganada |
| `success-tint` | `#EDF6F1` | Fondo de Ganada y avisos de éxito (añadido) |
| `warning` | `#B7791F` | Aviso: solo iconos, bordes y barras |
| `warning-text` | `#8F5E14` | Texto de aviso y «Hoy» (añadido) |
| `warning-tint` | `#FBF1DC` | Fondo de avisos (añadido) |
| `danger` | `#B3402A` | Atraso, error, Perdida |
| `danger-tint` | `#F8E5E0` | Fondo de Perdida y errores (añadido) |
| `neutral-tint` | `#EFE7DA` | Etiquetas neutras, esqueletos, franja informativa |
| `stage-nueva` | `#F1EBE0` | Etapa Nueva |
| `stage-contactada` | `#EBE2D3` | Etapa Contactada |
| `stage-propuesta` | `#E4D8C5` | Etapa Propuesta enviada |
| `stage-negociacion` | `#DCCDB5` | Etapa Negociación |
| `row-hover` | `#FBF8F2` | Fila de tabla bajo el cursor |
| (blanco) | `#FFFFFF` | Texto sobre `primary` y `sb-active`; punto del interruptor |
| (velo) | `rgba(43,33,24,0.45)` | Fondo oscurecido de diálogos y hoja inferior (valor fijo en `bundle.css`, no es token) |

Contrastes calculados (WCAG 2): `text`/`surface` 15,75; `text-2`/`surface` 6,52; `text-2`/`bg-app` 6,05; blanco/`primary` 7,49; `success`/`surface` 4,99; `success`/`success-tint` 4,53; `danger`/`surface` 5,7; `danger`/`danger-tint` 4,69; `warning-text`/`warning-tint` 4,95; `sb-text`/`brown` 9,67; `border-strong`/`surface` 4,19 y /`bg-app` 3,89 (borde de control, mínimo 3:1). `warning` sobre blanco da 3,64: **no usar como texto**. Esto es un cálculo manual de los pares principales, **no una auditoría completa**: falta pasar una herramienta de accesibilidad sobre la aplicación real.

### Tipografía

- Familia: **Inter**, con respaldo `system-ui, -apple-system, "Segoe UI", sans-serif`. En las maquetas Inter se carga desde Google Fonts (`@import` en `bundle.css`). Para producción, autoalojar Inter (WOFF2) es una decisión pendiente.
- Cifras tabulares (`font-variant-numeric: tabular-nums`) en toda la aplicación.

| Estilo | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `d-title` | 20 / 28 px | 600 | Título de pantalla de escritorio |
| `d-heading` | 16 / 24 px | 600 | Título de panel o diálogo |
| `d-body` | 14 / 20 px | 400 | Texto base de escritorio |
| `d-label` | 13 / 18 px | 500 | Etiqueta de campo |
| `d-table` | 13 / 18 px | 400 | Celdas de tabla |
| `d-caption` | 12 / 16 px | 500 | Cabeceras de tabla, etiquetas, ayudas |
| `m-figure` | 30 / 36 px | 700 | Cifras de la PWA (el brief permite 28–32) |
| `m-title` | 20 / 28 px | 600 | Cabecera móvil |
| `m-body` | 16 / 24 px | 400 | Texto base y campos móviles (nunca menos de 16) |
| `m-small` | 13 / 18 px | 500 | Etiquetas e indicadores móviles |

Los indicadores de escritorio usan 28 / 36 px en 700 (`.stat .n`).

### Espaciado, formas y medidas

- Espaciado: `space-1` 4 px · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 · `space-6` 32 · `space-7` 48.
- Radios: `radius-sm` 6 px (botones, campos, etiquetas) · `radius-md` 8 px (tarjetas, tablas, diálogos) · `radius-pill` 999 px (insignias, chips). Marco del móvil en las maquetas: 24 px (solo presentación).
- Sombras: `shadow-dialog` `0 8px 24px rgba(43,33,24,0.16)` · `shadow-sheet` `0 -4px 16px rgba(43,33,24,0.14)`. No hay más sombras.
- Escritorio: barra lateral 232 px · barra superior 56 px · contenido máximo 1280 px · margen del contenido 24 px · fila de tabla 36 px · cabecera de tabla 32 px · botón 32 px (pequeño 28 px) · campo 32 px · etiqueta 22 px · búsqueda 320 px · diálogo 460 px (420–440 px los de confirmación) · paginación de 50 filas.
- Móvil: márgenes 16 px · relleno de tarjeta 14 px · cabecera 56 px · navegación inferior 64 px (objetivo mínimo 44 px, token `tap-min`) · botón y campo 48 px · chip 36 px · interruptor 44 × 26 px.
- Foco: anillo sólido de 2 px `primary`, separación 2 px.
- Iconos: trazo de 1,6 px, 16 px por defecto (18 en la barra lateral, 24 en la navegación inferior). Son trazados propios dibujados a mano en SVG (no vienen de una librería); en la aplicación real **sustituir por Lucide** (el conjunto que usa shadcn/ui) eligiendo el equivalente más cercano.
- Marca: el nombre «CRM-123» en texto con un libro abierto estilizado. No hay logo oficial: el símbolo es una propuesta (el brief decía «por ejemplo»).
- Movimiento: solo giro del indicador de progreso y parpadeo de esqueletos; con `prefers-reduced-motion` se detienen.

## 5. Datos que alimentan cada pantalla (para conectar)

Todo con el cliente de Supabase en el navegador y la sesión del usuario: **la seguridad por fila (RLS) ya filtra lo suyo**. No uses la clave de servicio en el navegador.

| Pantalla | Lee | Escribe |
|---|---|---|
| W3 Tablero | `v_next_actions` (`next_action_date <= app_today()`; atrasadas: `is_overdue`), `v_pipeline_summary` (etapas abiertas), conteo de abiertas y suma de `estimated_amount` | — |
| W4 / W10 | `customers` (orden `last_name`, `first_name`; archivados: `archived_at is not null`) | `customers.archived_at` (archivar / recuperar) |
| W5 | `customers` | alta y edición de `customers`; `owner_id` solo lo elige el supervisor |
| W6 | `customers`, `opportunities` del cliente, `activities` del cliente | anular = insertar `activities` con `type = 'anulacion'` y `voids_activity_id` |
| W7 / W8 / W9 | `opportunities` (+ `customers` para el nombre) | alta y edición; cambio de etapa; Ganada: `final_amount`, `closed_on`; Perdida: `lost_reason`, `closed_on`; Reabrir: dejar a nulo esos tres campos; próxima acción: `next_action_date` y `next_action_text` siempre juntas; archivar |
| W9 historial | `activities` de la oportunidad | insertar actividad (`type`: llamada, mensaje, reunion, nota; `occurred_at` por defecto ahora) |
| W11 | `profiles` (solo supervisor) | `profiles.is_active`, `role`; **crear usuario y contraseña temporal requieren servidor** (Auth Admin con clave de servicio: función de servidor, nunca en el navegador) |
| W12 | `customers` por `owner_id`, conteo de `opportunities` | `customers.owner_id` (el trigger mueve las oportunidades) |
| W13 | `audit_log` (solo lectura, supervisor) | — |
| M2 / M5 | `v_team_summary`, `v_lost_reasons_month`, `v_pipeline_summary`, `v_next_actions` | — |
| M3 / M4 | `opportunities`, `activities` | — |
| M6 | `settings.morning_summary_enabled`, `summary_runs` (último) | interruptor: `settings`; **«Enviar ahora»: lo pone en marcha n8n** (ver abajo) |
| Tablero y sesión | `profiles.full_name`, `must_change_password` | `mark_password_changed()` |

Notas de datos que condicionan la interfaz:
- El texto «Atrasada · N días» se calcula en el cliente con `app_today()`.
- El estado «Anulada» de una actividad se deduce de que exista otra actividad con `voids_activity_id` igual a su id.
- Mensajes de error de la base que la interfaz debe traducir a los textos del brief: teléfono duplicado (código `23505`), límites de usuarios (`23514` con «Límite alcanzado»), último supervisor (`23514` con «al menos un supervisor activo»).
- **Resumen matutino**: «Enviar ahora» no escribe en `summary_runs` desde el navegador (solo la clave de servicio escribe ahí). El contrato con n8n (dirección del webhook, qué devuelve, autenticación) **no está definido**; hay que acordarlo con Ines. El flujo debe crear la ejecución `en_curso`, y la pantalla la lee para mostrar «Enviando…».
- **Modo de prueba (decidido):** el dato viene de **n8n, no de Supabase**. Muestra la franja ámbar solo si n8n lo informa; si n8n no responde, no mostrarla y dejar la pantalla usable (propuesta de diseño, por confirmar).
- **Autor de actividades (decidido):** un vendedor no puede leer perfiles de supervisores (RLS). Si el autor es un supervisor y quien mira es un vendedor, mostrar solo «Supervisor»; en cualquier otro caso, el nombre. Habrá que resolverlo de forma que el nombre del supervisor no llegue al navegador del vendedor.

## 6. Componentes: qué usar para no reinventar

**Ninguno de estos componentes viene de shadcn/ui; esta columna es la correspondencia recomendada.** Instala el componente de shadcn/ui indicado y estílalo con las variables de abajo; no escribas botones, campos ni tablas desde cero.

| Pieza del diseño (carpeta) | Clases en `bundle.css` | Usar en la aplicación real |
|---|---|---|
| Botones (`Buttons`) | `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.is-loading` | `Button` (variantes `default`, `outline`, `ghost`; tamaños `sm` y por defecto; estado de carga con `Loader2` de Lucide) |
| Campos (`Fields`) | `.field`, `.input`, `.area`, `.help`, `.msg-err` | `Input`, `Textarea`, `Label`, `FormMessage` (con react-hook-form) |
| Selectores | `sel()` en maqueta | `Select`; el selector de cliente con búsqueda: `Popover` + `Command` (combobox) |
| Casilla / interruptor | `.box`, `.switch` | `Checkbox`, `Switch` |
| Etiquetas (`Tags`) | `.tag`, `.tag.s-*`, `.won`, `.lost`, `.type`, `.badge` | `Badge` con variantes propias (etapas, tipo, Ganada, Perdida) |
| Tabla densa (`DataTable`) | `.tbl`, `.panel`, `.pager` | `Table` (+ TanStack Table si hace falta ordenar o paginar) |
| Tarjeta (`OpportunityCard`, `.panel`, `.stat`, `.m-card`) | `.card`, `.panel`, `.stat` | `Card` |
| Línea de tiempo (`Timeline`) | `.tl` | No existe en shadcn/ui: componente propio sencillo |
| Diálogos (`Dialog`) | `.scrim`, `.dlg` | `Dialog` y `AlertDialog` (confirmaciones) |
| Hoja inferior (`BottomSheet`) | `.sheet` | `Sheet` con `side="bottom"` (o `Drawer`) |
| Barra lateral (`Sidebar`) | `.sb` | `Sidebar` de shadcn/ui |
| Navegación inferior (`BottomNav`) | `.bnav` | Componente propio (4 enlaces) |
| Esqueletos (`Skeleton`) | `.sk` | `Skeleton` |
| Franjas (`Banner`) | `.banner` | `Alert` con variantes |
| Pestañas (W10) | `.tabs`, `.tab` | `Tabs` |
| Menú «+ Nuevo» | maqueta cerrada | `DropdownMenu` |
| Fechas (próxima acción, cierre, filtros) | campo de texto con icono | `Popover` + `Calendar` (configurar en español, semana desde el lunes) |
| Aviso «Guardado.» | `.toast` | `Sonner` / `Toast` |
| Embudo, indicador de etapa, indicadores (`Funnel`, `StageStepper`, `Stats`) | `.fn`, `.steps`, `.stat`, `.m-kpi` | Propios (barras y pasos simples; no hace falta librería de gráficos) |
| Estados vacíos (`EmptyState`) | `.empty` | Propio, con iconos de Lucide `BookOpen` y `Coffee` |

### Correspondencia de variables con shadcn/ui (tema)

| Variable de shadcn/ui | Valor |
|---|---|
| `--background` | `#FAF6EF` (`bg-app`) |
| `--foreground` | `#2B2118` (`text`) |
| `--card`, `--popover` | `#FFFFFF` (`surface`) |
| `--card-foreground`, `--popover-foreground` | `#2B2118` |
| `--primary` | `#2F5D50` |
| `--primary-foreground` | `#FFFFFF` |
| `--secondary`, `--muted`, `--accent` | `#EFE7DA` (`neutral-tint`) |
| `--secondary-foreground`, `--accent-foreground` | `#2B2118` |
| `--muted-foreground` | `#6B5B4B` (`text-2`) |
| `--border` | `#E6DECF` |
| `--input` | `#8A7967` (`border-strong`) |
| `--ring` | `#2F5D50` |
| `--destructive` | `#B3402A` (`danger`) |
| `--destructive-foreground` | `#FFFFFF` |
| `--radius` | `0.5rem` (8 px; los controles usan 6 px: `radius-sm`) |
| `--sidebar` / `--sidebar-foreground` / `--sidebar-accent` | `#4A3426` / `#F3E9DC` / `#5E4533` |

Atención: `--destructive` solo se usa para texto y mensajes de error. **Archivar, Anular y Desactivar son botones secundarios, nunca rojos**; «Cerrar como Perdida» lleva texto rojo con icono sobre botón secundario.

## 7. Dónde se apartó del brief, y por qué

| # | Brief | Qué se hizo | Motivo |
|---|---|---|---|
| 1 | Paleta cerrada (§2) | Se añadieron `border-strong`, `warning-text`, los tintes (`primary`, `success`, `warning`, `danger`, `neutral`), las cuatro etapas, `row-hover` y los colores de la barra lateral | El brief pide AA y no define el texto sobre la barra, los fondos de etiquetas ni bordes de campos. El borde `#E6DECF` sobre blanco da 1,3:1; el ámbar `#B7791F` como texto, 3,64:1. Los colores base no se modificaron |
| 2 | Etapas «en tonos neutros cálidos» | Cuatro tonos crecientes de beige + texto siempre visible | Se distinguen por el nombre, no por el color |
| 3 | Tipografía Inter «o equivalente de sistema» | Inter por Google Fonts, con respaldo de sistema | Es lo pedido; falta decidir autoalojamiento |
| 4 | Cifras de la PWA 28–32 px | 30 px | Punto medio del rango |
| 5 | Iconos de trazo fino | Trazados propios, no de una librería | Las maquetas no podían depender de una; en la aplicación real, Lucide |
| 6 | Logo «símbolo mínimo» | Libro abierto dibujado en SVG | Es una propuesta; no hay logo fuente |
| 7 | W3: lista con «nombre · teléfono · oportunidad con tipo · acción · fecha» | Tabla (no tarjetas), con oportunidad y fecha en dos líneas | En 1440 px el contenido real no cabe en una línea con las dos acciones de fila |
| 8 | W3: «Accesos: + Nuevo cliente, + Nueva oportunidad» | Dos botones secundarios junto al embudo | El brief no fija el lugar |
| 9 | W11: columna «Cambio de contraseña pendiente» | Columna titulada «Contraseña» con la etiqueta «Cambio de contraseña pendiente» solo en las filas afectadas | Título de columna más corto; el texto exacto está en la etiqueta |
| 10 | W12: flujo de cuatro pasos | Se añadió un indicador «1. Origen › 2. Clientes › 3. Destino › 4. Confirmar» y un diálogo «Reasignando…» | Hace visible el orden del flujo y el «proceso en ejecución» |
| 11 | W11: «No se puede desactivar al último supervisor (mensaje claro)» | Diálogo «No se puede desactivar» con el mensaje | El brief no dice la forma |
| 12 | M2: tarjetas de todos los vendedores | La vista normal enseña dos y hay una segunda vista «al desplazarse» | Una pantalla de 844 px no los muestra todos |
| 13 | M6: dos textos de confirmación | «¿Enviar ahora?» como título de la hoja y «Se enviará a N personas. ¿Enviar ahora?» como cuerpo | Cumple el texto del brief; el título repite la pregunta |
| 14 | Estado de Ganada: etiqueta verde | Fondo `#EDF6F1` en lugar del primer tono probado `#E3F0E9` | Con el primero, el texto daba 4,26:1 (insuficiente) |
| 15 | §11.4 «Un recorrido navegable» | Un paso a paso con «Anterior / Siguiente» sobre capturas estáticas de las pantallas; **no** es un prototipo en el que se hace clic en los botones del diseño | No es posible en HTML estático sin construir la lógica |

## 8. Qué es maqueta sin funcionalidad (lo que falta conectar)

**Todo es maqueta.** En concreto, nada de lo siguiente funciona:

- **Autenticación y sesión:** ingreso, cierre de sesión, cambio obligatorio de contraseña, sesión caducada con retorno a la ruta, rechazo de vendedores en la PWA, usuario desactivado.
- **Navegación y rutas:** no hay enrutado; los enlaces, la fila clicable de las tablas, la búsqueda rápida (el atajo `/` y la lista de resultados), el menú «+ Nuevo» abierto y el selector de cliente con búsqueda existen solo como dibujo cerrado.
- **Formularios:** ningún campo se puede editar; no hay validación, ni normalización del teléfono (+34 por defecto), ni formato de euros al escribir, ni selectores de fecha.
- **Datos:** todas las listas, cifras y gráficos de barras son ejemplos fijos; no hay consultas, paginación (50 por página), orden por apellido, filtros ni totales calculados.
- **Acciones:** archivar y recuperar, cambiar etapa (el menú de «Cambiar etapa» no está dibujado abierto), cerrar como Ganada o Perdida, reabrir, anular, quitar o editar la próxima acción, registrar actividad y «definir siguiente acción», reasignar (masiva e individual), crear y desactivar usuarios, contraseña temporal (se muestra una sola vez y se copia al portapapeles).
- **Resumen matutino:** el interruptor, «Enviar ahora», el bloqueo de 10 minutos, la actualización automática de «En ejecución» y el modo de prueba.
- **PWA:** manifiesto, instalación, «tirar para actualizar», hora de «última actualización» real y detección de falta de conexión (M8).
- **Estados dinámicos:** los esqueletos, los errores con «Reintentar» y los procesos en ejecución están dibujados como imágenes fijas; falta conectarlos al ciclo real de carga y error.
- **Accesibilidad:** el orden de tabulación, los atajos de teclado, los anuncios para lector de pantalla y la gestión del foco en diálogos están **sin construir ni probar**. Las maquetas no se han pasado por una auditoría automática.

### Estados y elementos del brief que NO se dibujaron

- Pantalla o estado **«Sin permiso»** («No tienes permiso para ver esto.» con botón de volver) — está en el brief (§4) y no se maquetó.
- El menú desplegable «+ Nuevo» (Cliente, Oportunidad) y el menú de «Cambiar etapa» abiertos.
- Resultados de la búsqueda rápida.
- Estado «sin conexión» dentro de cada pantalla móvil (solo existe M8 completa).
- Estados de foco, hover y deshabilitado por componente más allá de lo visible en `Buttons` y `Fields`.
- Diálogo de «Cambiar contraseña» desde M7 (solo está el botón).
- Plantillas de correo del resumen matutino (fuera del brief).

## 9. Orden de trabajo sugerido

1. Confirmar con Ines el marco (propuesta: React + TypeScript + Tailwind + shadcn/ui), el despliegue en Vercel y el autoalojamiento de Inter.
2. Crear el proyecto, aplicar los tokens como variables CSS (sección 4 y la tabla de variables de la sección 6) y fijar el tema claro.
3. Autenticación con Supabase (correo + contraseña), carga del `profile` y rol desde `profiles` (nunca desde el JWT), cambio obligatorio de contraseña con `mark_password_changed()`.
4. Estructura: barra lateral, barra superior, rutas, estados comunes (cargando, vacía, error, sin permiso, sesión caducada).
5. Clientes (W4–W6, W10), después oportunidades y actividades (W7–W9).
6. Tablero (W3) con las vistas.
7. Administración: Usuarios, Reasignar y Auditoría (W11–W13). Crear usuarios exige una función de servidor.
8. PWA del supervisor (M1–M8), con el contrato n8n acordado antes de M6.
9. Pruebas con roles distintos (vendedor, supervisor, vendedor desactivado) y revisión de accesibilidad con herramienta.

## 10. Reglas que no se negocian

- La palabra «eliminar» y sus sinónimos («borrar», «suprimir», «papelera») **no aparecen** en ninguna pantalla. Se archiva, se desactiva o se anula.
- No se pide ningún documento de identidad.
- No hay borrado físico: ninguna política ni permiso DELETE.
- Un cliente es de un solo vendedor activo; reasignar mueve también sus oportunidades.
- Máximo 10 vendedores activos y 2 supervisores activos; siempre al menos un supervisor activo.
- Las actividades no se editan: se corrigen con una nota nueva o anulando.
- Fuera de alcance: modo oscuro, notificaciones push, datos sin conexión, exportar o imprimir, importar contactos, adjuntos, calendario, chat, metas o comisiones, informes, varios idiomas o monedas, edición de listas, otras pantallas de configuración.
