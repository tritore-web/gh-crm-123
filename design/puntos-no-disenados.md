# Puntos no diseñados y supuestos

Puntos del brief que no se pudieron diseñar con los datos existentes, o que se diseñaron con un supuesto. Se anotan aquí para que el humano decida; no se ha inventado ningún campo.

## Dato que no está en la base de datos (decidido)

1. **Modo de prueba del resumen matutino (M6).** Decisión: la fuente es **n8n** (WF-CRM123), no la base de datos; `SCRIPTS-SQL.md` no cambia. La franja ámbar «Modo de prueba: los correos llegan solo a la cuenta de pruebas.» no cambia de diseño: se muestra solo cuando n8n informa de que el modo de prueba está activo. Queda por definir con quien construya la PWA cómo lee ese dato (por ejemplo, una respuesta del propio flujo de n8n) y qué se muestra si n8n no responde: se propone no mostrar la franja y dejar el resto de la pantalla usable, ya que el aviso no bloquea ninguna acción.

## Limitaciones de los datos que afectan a la pantalla

2. **Autor de las actividades (W6, W9) (decidido).** Un vendedor solo puede leer su propio perfil, así que no puede ver el nombre de un supervisor que registró una actividad en uno de sus clientes. Decisión: en esas actividades, visto por un vendedor, el autor se muestra solo como «Supervisor». Un supervisor ve siempre el nombre completo, y las actividades propias del vendedor siguen mostrando su nombre. W6 y W9 incluyen un ejemplo.
3. **Totales del equipo (M2).** `v_team_summary` incluye solo vendedores activos: al desactivar a un vendedor, sus oportunidades ganadas del mes y sus perdidas dejan de contar en los indicadores del panel.
4. **Acciones del sistema en la auditoría (W13).** `actor_id` puede ser nulo (clave de servicio). El diseño muestra «Sistema» en la columna Quién cuando no hay actor.

## Supuestos de diseño

5. **Prefijo del teléfono.** La base exige formato internacional (`+` y 8–15 dígitos). El formulario acepta «600 111 222» y supone `+34`; solo se define el formato visual de los números `+34`.
6. **Destinatarios del resumen.** «Se enviará a N personas» se calcula con los usuarios activos (vendedores y supervisores); el brief no dice si algún usuario puede excluirse.
7. **Estado «Anulada».** Se deduce de la existencia de una actividad de tipo anulación que apunta a la original; la fila de anulación no se muestra aparte.
8. **Contraseña temporal.** Su generación y su única visualización dependen del servidor (la base no guarda contraseñas); el diseño solo define la pantalla.
9. **Colores añadidos.** El brief fija la paleta base; se añadieron tintes, `border-strong`, `warning-text` y los colores de la barra lateral por accesibilidad. Están anotados en `tokens.json`.
