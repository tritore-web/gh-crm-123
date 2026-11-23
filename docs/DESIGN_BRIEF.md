# DESIGN_BRIEF.md — CRM-123

**Versión 1.0 · 22-nov-2026 · Destinatario: Claude Design.**

Este documento describe **qué se ve y cómo se usa** CRM-123: pantallas, información y su jerarquía, estados, flujos y dirección visual. No contiene código ni estructura de base de datos.

> **Regla de oro.** El diseño debe respetar **estrictamente** la estructura de datos oficial, que recibes aparte en `SCRIPTS-SQL.md` como referencia. En pantalla solo puede existir información que **ya exista** allí: no inventes campos, listas de valores, filtros que dependan de datos inexistentes, ni funciones nuevas. Si una pantalla "pide" un dato que no existe, no lo diseñes y avísalo. La sección 3 resume los datos disponibles en lenguaje de negocio.

---

## 1. Contexto y principios

**Negocio:** una librería-cafetería en España. El equipo comercial vende a personas: eventos privados, catering, clubes de lectura o suscripciones, pedidos grandes de libros y ventas a grupos. **Moneda:** euro. **Idioma:** español de España.

**Usuarios**

| Persona | Dispositivo | Qué necesita |
|---|---|---|
| **Vendedor** (hasta 10) | Escritorio (sitio web) | Saber qué hacer hoy, registrar lo que hizo, mover sus oportunidades por el embudo. Todo el día, con rapidez. |
| **Supervisor** (hasta 2) | Móvil (PWA) y escritorio | En el móvil: ver de un vistazo cómo va el equipo y controlar el resumen matutino. En escritorio: lo mismo que un vendedor, más administrar usuarios y reasignar. |

**Principios**
1. **Minimalista y funcional:** solo opciones básicas y necesarias. Cada pantalla tiene un propósito principal evidente.
2. **Escritorio denso y operativo:** tablas compactas, atajos, pocas pantallas intermedias, mucha información útil sin desplazarse.
3. **Móvil de consulta rápida:** números grandes, tarjetas, lectura en menos de 10 segundos, una sola acción principal por pantalla.
4. **Sin sorpresas ni destrucción:** nada se "elimina"; se **archiva**, se **desactiva** o se **anula**. La palabra "eliminar" no aparece nunca.
5. **Lenguaje de negocio:** sin tecnicismos en pantalla.

---

## 2. Dirección visual

**Personalidad:** cálida, tranquila y confiable, como una librería-cafetería. Profesional, no recargada.

**Paleta** (modo claro únicamente)

| Uso | Color |
|---|---|
| Fondo de la aplicación | Crema `#FAF6EF` |
| Superficies (tarjetas, tablas, paneles) | Blanco `#FFFFFF` |
| Bordes y separadores | `#E6DECF` |
| Texto principal | Marrón oscuro `#2B2118` |
| Texto secundario | `#6B5B4B` |
| Títulos y barra lateral | Marrón café `#4A3426` |
| **Acción principal** (botones, enlaces, selección) | Verde oscuro `#2F5D50` (al pasar: `#264C41`) |
| Éxito | `#2F7D5B` |
| Aviso / acción para hoy | Ámbar `#B7791F` |
| Atraso / error / pérdida | Rojo ladrillo `#B3402A` |

- Cumplir contraste **AA** como mínimo. El color nunca es el único portador de significado (acompañar con texto o icono).
- Las **etapas** se muestran como etiquetas sobrias en tonos neutros cálidos; solo **Ganada** (verde) y **Perdida** (rojo ladrillo) usan color propio. Nada de arcoíris.

**Tipografía:** una sans-serif legible (Inter o equivalente de sistema). Escritorio: texto base 14 px, tablas 13 px, títulos 20/16 px. Móvil: texto base 16 px, cifras destacadas 28–32 px. Números con cifras tabulares.

**Forma y espacio:** esquinas suaves (6–8 px), sombras casi inexistentes (bordes finos en su lugar), mucha claridad en la jerarquía. Escritorio: filas de tabla de 36 px, barra lateral de 232 px, ancho máximo de contenido 1280 px. Móvil: márgenes de 16 px, tarjetas con 12–16 px de relleno, objetivos táctiles de al menos 44 px.

**Iconografía:** conjunto de iconos de trazo fino, uno por concepto (teléfono, mensaje, reunión, nota, archivo/archivar, alerta). Sin ilustraciones decorativas, salvo un pequeño dibujo sobrio en estados vacíos (un libro, una taza).

**Marca:** nombre **CRM-123** en texto, con un símbolo mínimo (por ejemplo un libro abierto estilizado). Sin eslogan.

**Formatos en pantalla (obligatorios)**

| Dato | Formato |
|---|---|
| Euros | `1.234,50 €` |
| Fechas | `23/11/2026`; relativas solo como apoyo ("hoy", "ayer", "hace 3 días") |
| Teléfono | Los números `+34` se muestran `+34 600 111 222`; es un enlace de llamada en móvil |
| Montos grandes en la PWA | Sin decimales si son enteros (`4.200 €`) |

---

## 3. Datos disponibles (en lenguaje de negocio)

Solo se puede mostrar o pedir esto. Los nombres son las **etiquetas de pantalla**.

**Cliente (persona)**
Nombre · Apellidos · Teléfono (obligatorio, único; es el identificador del cliente) · Correo (opcional) · Notas (opcional) · Origen · Acepta comunicaciones (sí/no) · Vendedor asignado · Archivado (sí/no) · Fecha de alta.
*Nunca* se pide DNI, NIE, NIF ni ningún documento de identidad.

**Oportunidad**
Título · Cliente · Tipo · Etapa · Monto estimado (€) · Monto final (€, solo si está Ganada) · Fecha de cierre (si Ganada o Perdida) · Motivo de pérdida (solo si Perdida) · Próxima acción: fecha y texto (opcional; una sola por oportunidad) · Notas (opcional) · Vendedor asignado (siempre el del cliente) · Archivada (sí/no).

**Actividad** (historial; solo se añade, nunca se edita ni se borra)
Tipo · Descripción · Fecha y hora en que ocurrió · Autor · Cliente · Oportunidad relacionada (opcional) · Estado "Anulada" cuando alguien la anula.

**Usuario**
Nombre completo · Correo (es el usuario de ingreso) · Rol · Estado (activo o desactivado) · Indicador "debe cambiar su contraseña".

**Resumen matutino**
Interruptor "activo" · Ejecuciones: fecha y hora, tipo (Automático o Manual), estado, correos enviados de total.

**Auditoría** (solo supervisor, lectura)
Fecha y hora · Quién (nombre y rol) · Acción · Elemento afectado · Detalle breve.

### 3.1 Valores cerrados (listas fijas; no se pueden añadir otros)

| Campo | Valores |
|---|---|
| Rol | Vendedor · Supervisor |
| Origen del cliente | Tienda · Web · Redes sociales · Recomendación |
| Tipo de oportunidad | Evento privado · Catering · Club de lectura o suscripción · Pedido grande de libros · Venta a grupos |
| Etapa | Nueva → Contactada → Propuesta enviada → Negociación → **Ganada** / **Perdida** |
| Motivo de pérdida | Precio · Sin respuesta · Eligió otra opción · Ya no le interesa · Otro |
| Tipo de actividad (al crear) | Llamada · Mensaje · Reunión o visita · Nota |
| Estado de una ejecución del resumen | En curso · Correcto · Con errores · Fallido |
| Tipo de ejecución | Automático · Manual |

### 3.2 Reglas de negocio que el diseño debe hacer evidentes

1. **Un cliente pertenece a un solo vendedor**, que solo ve lo suyo. El supervisor ve todo.
2. El **teléfono no se puede repetir**. Si un vendedor intenta registrar uno ya existente, ve: *"Ese teléfono ya está registrado. Si no lo ves en tu lista, pertenece a otro vendedor: consulta con el supervisor."*
3. Al marcar **Ganada** se confirma el **monto final** (propuesto: el estimado) y la **fecha de cierre** (hoy). Al marcar **Perdida** es **obligatorio** elegir un **motivo**. Una oportunidad cerrada no tiene próxima acción.
4. Una oportunidad abierta puede tener **una** próxima acción (fecha + texto).
5. Las **actividades no se editan ni se borran**. Un error se corrige añadiendo una nota nueva o **anulando** la actividad (queda visible, tachada, con la etiqueta "Anulada"). Un vendedor solo anula las suyas.
6. Hay un máximo de **10 vendedores activos y 2 supervisores activos**. Siempre debe quedar al menos un supervisor activo.
7. **Reasignar** un cliente mueve también todas sus oportunidades al nuevo vendedor.
8. El **resumen matutino** se envía de lunes a viernes a las 7:30 (hora de Madrid). El supervisor puede activarlo/desactivarlo y enviarlo manualmente (como mínimo, 10 minutos entre envíos manuales).

---

## 4. Estados comunes (aplican a **todas** las pantallas)

| Estado | Comportamiento |
|---|---|
| **Cargando** | Esqueletos (*skeleton*) con la forma del contenido; nunca una pantalla en blanco. Botones con indicador de progreso y deshabilitados mientras se guarda. |
| **Vacía** | Mensaje breve, sobrio, con la **acción siguiente** como botón principal. Ejemplos en cada pantalla. |
| **Error** | Mensaje claro en español, sin tecnicismos, con botón **Reintentar**. Los errores de formulario se muestran junto al campo y en un resumen al inicio. |
| **Proceso en ejecución** | Para acciones que tardan o se ejecutan en segundo plano (guardar, enviar el resumen): indicador visible, texto de estado ("Enviando…") y bloqueo de la acción para evitar repeticiones. |
| **Sin permiso** | "No tienes permiso para ver esto." con botón de volver. |
| **Sesión caducada** | Mensaje "Tu sesión terminó" y paso al ingreso conservando a dónde iba. |
| **Sin conexión** (PWA) | Pantalla propia: "Sin conexión. Vuelve a intentarlo cuando tengas internet." |

---

## 5. Sitio web de escritorio

Resolución de referencia: **1440 × 900**; debe funcionar bien desde 1280 px de ancho.

### 5.1 Estructura general
- **Barra lateral izquierda** (marrón café): logo CRM-123; navegación **Tablero**, **Clientes**, **Oportunidades**, **Archivados**; bloque **Administración** (solo supervisor): **Usuarios**, **Reasignar**, **Auditoría**; abajo, el nombre de la persona y **Cerrar sesión**.
- **Barra superior:** título de la pantalla, **búsqueda rápida** (por nombre o teléfono, lleva a la ficha del cliente) y botón **+ Nuevo** con menú (Cliente, Oportunidad).
- Contenido sobre fondo crema; tablas y paneles en superficies blancas.

### 5.2 Pantallas

#### W1 · Ingreso
- **Propósito:** entrar con correo y contraseña.
- **Jerarquía:** logo y nombre → campos Correo y Contraseña (con mostrar/ocultar) → botón **Ingresar**. Nada más.
- **Estados:** cargando (botón en progreso) · error ("Correo o contraseña incorrectos" sin indicar cuál falló) · usuario desactivado ("Tu usuario está desactivado. Habla con tu supervisor.") · sesión caducada.

#### W2 · Cambiar contraseña (obligatorio en el primer ingreso)
- **Jerarquía:** explicación en una línea ("Por seguridad, elige una contraseña nueva") → Contraseña nueva · Repetirla → indicador de requisitos (10 caracteres como mínimo, con letras y números) → **Guardar y continuar**.
- **Estados:** validación en vivo · cargando · error. No se puede salir sin completarlo, salvo cerrar sesión.

#### W3 · Tablero del día (pantalla de inicio)
- **Propósito:** responder "¿qué hago hoy?".
- **Jerarquía (de arriba abajo):**
  1. Saludo ("Buenos días, Ana") y fecha de hoy.
  2. **Tres indicadores:** *Para hoy* (n.º de acciones) · *Atrasadas* (n.º, en rojo si > 0) · *Oportunidades abiertas* (n.º y monto total estimado).
  3. **Atrasadas** (si hay): lista ordenada de la más antigua a la más reciente.
  4. **Para hoy:** lista.
  5. **Mi embudo:** una fila por etapa abierta (Nueva, Contactada, Propuesta enviada, Negociación) con cantidad y monto estimado, en barras horizontales simples.
  6. Accesos: **+ Nuevo cliente**, **+ Nueva oportunidad**.
- **Cada acción de la lista** muestra: nombre del cliente · teléfono · título de la oportunidad con etiqueta de tipo · texto de la acción · fecha (y días de atraso). Acciones de fila: **Registrar actividad** · **Abrir**.
- **Supervisor:** mismo tablero con **todos** los vendedores, una columna/etiqueta **Vendedor** en cada acción y un filtro por vendedor.
- **Estados:** cargando (esqueletos) · **vacía** ("Todo al día: no tienes acciones para hoy." + botón **Nueva oportunidad**) · **vacía inicial** cuando aún no hay datos (invita a crear el primer cliente) · error con **Reintentar**.

#### W4 · Clientes (lista)
- **Propósito:** encontrar y abrir clientes.
- **Jerarquía:** título y botón **+ Nuevo cliente** → barra de filtros (búsqueda por nombre o teléfono · Origen · Vendedor [solo supervisor]) → tabla densa → paginación (50 por página).
- **Columnas:** Nombre completo · Teléfono · Correo · Origen · Acepta comunicaciones (icono) · Vendedor (solo supervisor) · Fecha de alta. Orden por apellido. Fila completa abre la ficha.
- **Estados:** cargando · vacía ("Aún no tienes clientes. Crea el primero.") · sin resultados de búsqueda ("No hay clientes con esa búsqueda.") · error.

#### W5 · Nuevo / editar cliente
- **Jerarquía:** Nombre · Apellidos · Teléfono (con ayuda: "Se usa para identificar al cliente. No se puede repetir.") · Correo (opcional) · Origen · Acepta comunicaciones (casilla, apagada por defecto) · Notas · [Supervisor: **Vendedor asignado**] → **Guardar** / Cancelar.
- **Estados:** validación junto al campo (teléfono inválido, correo inválido) · teléfono duplicado (mensaje de la regla 2) · guardando · error.
- **No** pedir ningún documento de identidad.

#### W6 · Ficha del cliente
- **Cabecera:** nombre completo; teléfono; correo; Origen; etiqueta Acepta comunicaciones; vendedor asignado. Acciones: **+ Oportunidad** · **+ Actividad** · **Editar** · **Archivar** · [Supervisor: **Cambiar vendedor**].
- **Cuerpo en dos columnas:**
  - *Izquierda:* **Oportunidades** del cliente (tarjetas compactas: título, tipo, etapa, monto estimado, próxima acción) y **Notas**.
  - *Derecha:* **Historial de actividades** en línea de tiempo (icono por tipo, descripción, autor, fecha y hora; las anuladas aparecen tachadas con etiqueta "Anulada"; acción **Anular** en cada una propia). Botón **+ Registrar actividad**.
- **Estados:** historial vacío ("Todavía no hay actividad con este cliente.") · sin oportunidades ("Este cliente no tiene oportunidades. Crea la primera.") · cargando · error · **cliente archivado** (franja superior "Cliente archivado" con botón **Recuperar**; acciones de edición ocultas).
- **Confirmación de Archivar:** diálogo breve: "¿Archivar a <nombre>? Podrás recuperarlo después." Botones **Archivar** / Cancelar.

#### W7 · Oportunidades (lista)
- **Jerarquía:** título y **+ Nueva oportunidad** → filtros (Etapa [por defecto, las abiertas] · Tipo · Vendedor [supervisor] · casilla "Solo con acción atrasada") → tabla → fila de **totales** (cantidad y suma del monto estimado de lo filtrado) → paginación.
- **Columnas:** Título · Cliente · Tipo · Etapa · Monto estimado · Próxima acción (fecha, en rojo si está atrasada) · Vendedor (supervisor).
- **Estados:** cargando · vacía · sin resultados · error.

#### W8 · Nueva / editar oportunidad
- **Jerarquía:** Cliente (selector con búsqueda por nombre o teléfono; si se llega desde una ficha, viene fijado) · Título · Tipo · Monto estimado (€) · Etapa (por defecto Nueva) · Próxima acción: Fecha y Texto (opcional) · Notas → **Guardar** / Cancelar.
- **Estados:** validación · guardando · error · si el cliente está archivado no se puede elegir.

#### W9 · Ficha de la oportunidad
- **Cabecera:** título; cliente (enlace); etiqueta de Tipo; **indicador de etapa** como una barra de pasos (Nueva → Contactada → Propuesta enviada → Negociación) más el resultado (Ganada o Perdida); Monto estimado.
- **Si está Ganada:** se destaca **Monto final** y **Fecha de cierre**. **Si está Perdida:** **Motivo** y **Fecha de cierre**.
- **Caja "Próxima acción":** fecha + texto, con **Editar** y **Quitar**; si no hay, invitación "Define la próxima acción". En rojo si está atrasada.
- **Acciones:** **Cambiar etapa** (los pasos abiertos con un clic) · **Cerrar como Ganada** · **Cerrar como Perdida** · **Editar** · **Archivar**; en una oportunidad cerrada: **Reabrir**.
- **Historial** de actividades de esta oportunidad (misma línea de tiempo que en la ficha del cliente) y botón **+ Registrar actividad**.
- **Diálogos:**
  - *Cerrar como Ganada:* Monto final (propuesto el estimado) · Fecha de cierre (hoy) → **Confirmar**.
  - *Cerrar como Perdida:* Motivo (obligatorio, lista fija) · Fecha de cierre (hoy) → **Confirmar**.
  - *Reabrir:* aviso "Se quitarán el monto final, la fecha de cierre y el motivo." → elegir etapa abierta → **Reabrir**.
  - *Registrar actividad:* Tipo (Llamada · Mensaje · Reunión o visita · Nota) · Descripción · Fecha y hora (ahora) → **Guardar**.
  - *Anular actividad:* "Se marcará como anulada y seguirá visible en el historial." → **Anular** / Cancelar.
- **Estados:** cargando · error · oportunidad archivada (franja con **Recuperar**) · historial vacío.

#### W10 · Archivados
- **Jerarquía:** dos pestañas **Clientes** y **Oportunidades**; tabla con los mismos datos de las listas, un indicador "Archivado el …" y la acción **Recuperar** por fila.
- **Estados:** cargando · vacía ("No hay elementos archivados.") · error.

#### W11 · Usuarios *(solo supervisor)*
- **Jerarquía:** título · contadores **"Vendedores activos 7 de 10"** y **"Supervisores activos 2 de 2"** · botón **+ Nuevo usuario** · tabla.
- **Columnas:** Nombre · Correo · Rol · Estado (Activo / Desactivado) · "Cambio de contraseña pendiente" (indicador) · acciones **Desactivar** o **Reactivar** y **Contraseña temporal**.
- **Diálogo Nuevo usuario:** Nombre completo · Correo · Rol → **Crear**. Al crear (y al generar una contraseña temporal) se muestra **una sola vez** la contraseña temporal con botón **Copiar** y el aviso "Anótala ahora: no volverá a mostrarse. La persona deberá cambiarla al ingresar."
- **Confirmación de Desactivar:** "¿Desactivar a <nombre>? No podrá ingresar. Sus clientes seguirán asignados hasta que los reasignes." Si ya se alcanzó el límite de un rol, el botón **Crear/Reactivar** se explica: "Ya hay 10 vendedores activos."
- **Estados:** cargando · error · proceso en ejecución al crear (botón en progreso). No se puede desactivar al último supervisor activo (mensaje claro).

#### W12 · Reasignar *(solo supervisor)*
- **Propósito:** traspasar clientes (y sus oportunidades) de un vendedor a otro.
- **Flujo:** (1) elegir **Vendedor de origen** → (2) ver su lista de clientes con casillas y opción **Seleccionar todos** → (3) elegir **Vendedor de destino** (solo activos) → (4) diálogo de confirmación con el resumen: "Se pasarán **N clientes** y **M oportunidades** de <origen> a <destino>." → **Reasignar**.
- **Estados:** sin clientes ("<Vendedor> no tiene clientes.") · cargando · proceso en ejecución ("Reasignando…") · éxito con resumen · error.
- La reasignación **individual** también está en la ficha del cliente (**Cambiar vendedor**).

#### W13 · Auditoría *(solo supervisor, lectura)*
- **Jerarquía:** filtros (Acción · Fechas) → tabla paginada de solo lectura.
- **Columnas:** Fecha y hora · Quién · Acción (etiqueta legible, ver abajo) · Elemento · Detalle breve.
- **Etiquetas de acción:** Cliente creado · Cliente reasignado · Cliente archivado · Cliente recuperado · Oportunidad creada · Cambio de etapa · Oportunidad reasignada · Oportunidad archivada · Oportunidad recuperada · Usuario creado · Cambio de rol · Usuario desactivado · Usuario reactivado · Ajuste actualizado · Resumen manual solicitado · Resumen finalizado.
- **Estados:** cargando · vacía · error. Sin botones de edición ni de exportación.

---

## 6. PWA del supervisor

Pantalla de referencia: **390 × 844**. Instalable en el móvil. Solo supervisores.

### 6.1 Estructura general
- **Navegación inferior** con 4 destinos: **Panel**, **Oportunidades**, **Resumen**, **Cuenta**.
- Cabecera fina con el título y la hora de la última actualización; **tirar para actualizar**.
- Una acción principal por pantalla; tarjetas apiladas; cifras grandes.

### 6.2 Pantallas

#### M1 · Ingreso y cambio de contraseña
Misma lógica que W1 y W2, en formato móvil. Si un vendedor intenta ingresar: *"Esta aplicación es solo para supervisores."*

#### M2 · Panel del equipo (inicio)
- **Propósito:** ver cómo va el equipo en 10 segundos.
- **Jerarquía:**
  1. **Cuatro indicadores** en rejilla 2×2: **Abiertas** (n.º y monto) · **Ganadas del mes** (monto en €, n.º) · **Perdidas del mes** (n.º) · **Acciones atrasadas** (n.º; rojo si > 0).
  2. **Por vendedor:** una tarjeta por vendedor activo con nombre, oportunidades abiertas, monto abierto, ganadas del mes (€) y una insignia roja con sus acciones atrasadas. Se ordena por acciones atrasadas y luego por monto ganado. Tocar abre M5.
  3. **Motivos de pérdida del mes:** barras horizontales con cantidad por motivo.
- **Estados:** cargando (esqueletos) · vacía ("Aún no hay actividad este mes.") · error con **Reintentar** · sin conexión.

#### M3 · Oportunidades (consulta)
- **Jerarquía:** búsqueda por título o cliente · chips de filtro (Abiertas · Ganadas · Perdidas · Atrasadas) · lista de tarjetas: título, cliente, tipo, etapa, monto, próxima acción, vendedor.
- Solo lectura. **Estados:** cargando · vacía · sin resultados · error.

#### M4 · Detalle de oportunidad
- **Jerarquía:** título y etapa · monto (estimado y, si aplica, final) · cliente con teléfono llamable · vendedor · próxima acción · motivo de pérdida si aplica · últimas actividades (lista corta).
- Solo lectura. **Estados:** cargando · error.

#### M5 · Detalle de un vendedor
- **Jerarquía:** nombre · indicadores del vendedor (abiertas, monto, ganadas del mes, perdidas del mes, atrasadas) · su embudo por etapa (cantidad y monto) · sus acciones atrasadas (lista) .
- **Estados:** cargando · vacía ("Sin acciones atrasadas.") · error.

#### M6 · Resumen matutino
- **Propósito:** controlar el correo diario de las 7:30.
- **Jerarquía:**
  1. **Interruptor "Resumen matutino activo"** con la leyenda "Se envía de lunes a viernes a las 7:30 (hora de Madrid) a cada vendedor, y el resumen del equipo a cada supervisor."
  2. Si el sistema está en **modo de prueba**, una franja ámbar: "Modo de prueba: los correos llegan solo a la cuenta de pruebas."
  3. Botón principal **Enviar ahora**.
  4. Tarjeta **Último envío:** fecha y hora · Automático/Manual · estado · "Enviados N de N".
- **Flujo de "Enviar ahora":** botón → hoja inferior de confirmación "Se enviará a **N personas**. ¿Enviar ahora?" con **Enviar** / Cancelar → **En ejecución** → resultado.
- **Estados de la tarjeta y del botón:**
  - **En ejecución:** indicador animado, texto "Enviando…", botón deshabilitado; la pantalla se actualiza sola.
  - **Correcto:** "Se enviaron N de N correos."
  - **Con errores:** "Se enviaron X de N. Algunos correos no salieron."
  - **Fallido:** "No se pudo enviar el resumen. Inténtalo de nuevo más tarde."
  - **Demasiado pronto:** "Espera unos minutos antes de volver a enviar." (mínimo 10 minutos entre envíos manuales).
  - **Interruptor apagado:** tarjeta atenuada con "El envío automático está desactivado." (**Enviar ahora** sigue disponible: es una acción deliberada).
  - **Sin envíos aún:** "Todavía no se ha enviado ningún resumen."
  - **Error de conexión** con **Reintentar**.

#### M7 · Cuenta
- Nombre, correo, rol; **Cambiar contraseña**; **Cerrar sesión**; ayuda para **Instalar** en la pantalla de inicio.

#### M8 · Sin conexión
- Pantalla simple con icono, el mensaje de la sección 4 y botón **Reintentar**.

---

## 7. Flujos clave (paso a paso)

1. **Alta de un cliente nuevo con su primera oportunidad (vendedor).** + Nuevo → Cliente → completar datos → Guardar → ficha del cliente → **+ Oportunidad** (cliente ya fijado) → completar → Guardar → aparece en la ficha y en el tablero si tiene próxima acción.
2. **Registrar lo ocurrido hoy.** Tablero → fila de acción → **Registrar actividad** → tipo y descripción → Guardar → la actividad entra al historial; el sistema propone **definir la siguiente acción** (fecha + texto) o dejar la oportunidad sin acción.
3. **Cerrar una venta.** Ficha de la oportunidad → **Cerrar como Ganada** → confirmar monto final y fecha → la oportunidad pasa a Ganada y sale del tablero.
4. **Perder una venta.** **Cerrar como Perdida** → elegir motivo → confirmar.
5. **Corregir un error de registro.** En el historial → **Anular** en la actividad errónea → confirmar → añadir una nota nueva con lo correcto.
6. **Archivar y recuperar.** **Archivar** → confirmación → el elemento deja las listas activas y aparece en **Archivados** → **Recuperar**.
7. **Alta de un vendedor (supervisor).** Administración › Usuarios → **+ Nuevo usuario** → datos → Crear → copiar la contraseña temporal → entregarla a la persona.
8. **Un vendedor se va (supervisor).** Usuarios → **Desactivar** → Reasignar → origen, selección, destino → confirmar.
9. **Enviar el resumen ahora (supervisor, móvil).** Resumen → **Enviar ahora** → confirmar el número de destinatarios → ver "En ejecución" → ver el resultado.

---

## 8. Microtextos de referencia

| Situación | Texto |
|---|---|
| Archivar | "Archivar" · confirmación: "¿Archivar? Podrás recuperarlo después." |
| Recuperar | "Recuperar" |
| Desactivar usuario | "Desactivar" (no "Eliminar", no "Dar de baja") |
| Anular | "Anular" · estado "Anulada" |
| Guardado correcto | "Guardado." (aviso breve que desaparece solo) |
| Error general | "Algo salió mal. Inténtalo de nuevo." |
| Sin permiso | "No tienes permiso para hacer esto." |
| Teléfono inválido | "Escribe un teléfono válido, por ejemplo 600 111 222." |
| Contraseña débil | "Usa al menos 10 caracteres, con letras y números." |
| Acción atrasada | "Atrasada · 3 días" |

**Palabras prohibidas en toda la interfaz:** "eliminar", "borrar", "suprimir", "papelera".

---

## 9. Accesibilidad y adaptación

- Contraste AA, foco siempre visible, navegación completa con teclado en escritorio (orden lógico, atajos solo para búsqueda y "nuevo").
- Etiquetas visibles en todos los campos (no solo marcas de agua); errores asociados al campo.
- En la PWA, objetivos táctiles de 44 px o más; texto a 16 px como mínimo en campos para evitar ampliaciones involuntarias.
- Respeto de la preferencia de "reducir movimiento".
- Estados de carga y resultados anunciables por lector de pantalla.

---

## 10. Fuera de alcance (no diseñar)

Modo oscuro · notificaciones push · modo sin conexión con datos · exportar o imprimir · importar contactos · adjuntos · calendario completo · chat · metas o comisiones · informes personalizados · varios idiomas o monedas · edición de listas (etapas, tipos, motivos, orígenes) · pantallas de configuración distintas de las descritas · borrado de cualquier tipo.

---

## 11. Entregables esperados de Claude Design

1. Sistema visual: colores, tipografía, espaciado, componentes (botones, campos, etiquetas de etapa y tipo, tabla densa, tarjeta, línea de tiempo, diálogos, hoja inferior, barra lateral, navegación inferior, indicadores numéricos, esqueletos).
2. **Escritorio (1440 × 900):** W1–W13, cada una en sus estados (normal, cargando, vacía, error y, cuando aplique, en ejecución), y los diálogos descritos.
3. **Móvil (390 × 844):** M1–M8, cada una en sus estados (con M6 en todos sus estados de envío).
4. Un recorrido navegable de los flujos 1, 3, 7 y 9 de la sección 7.
5. Lista de cualquier punto de este documento que **no pudiste diseñar** porque requeriría un dato que no existe.
