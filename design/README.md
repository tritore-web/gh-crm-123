CRM-123 es el CRM de una librería-cafetería en España: un sitio web de escritorio para vendedores y supervisores, y una PWA móvil de consulta solo para supervisores. Esta guía es la fuente de las reglas visuales; los datos que puede mostrar una pantalla están fijados por `SCRIPTS-SQL.md`.

## Regla de oro

En pantalla solo existe información que ya exista en la base de datos. No inventes campos, listas de valores, filtros que dependan de datos inexistentes ni funciones nuevas. Si una pantalla pide un dato que no existe, no lo diseñes y anótalo en «Puntos no diseñados».

## Fundamentos de contenido

- Idioma: español de España. Moneda: euro. Tono: claro, cálido y directo, sin tecnicismos.
- Trata de «tú»: «Todo al día: no tienes acciones para hoy.», «Podrás recuperarlo después.»
- Nada se destruye: se **archiva**, se **desactiva** o se **anula**. Ninguna pantalla usa palabras de destrucción de datos; los botones son «Archivar», «Recuperar», «Desactivar», «Reactivar» y «Anular».
- Etiquetas de pantalla (valores guardados entre paréntesis): Origen = Tienda, Web, Redes sociales, Recomendación. Tipo = Evento privado, Catering, Club de lectura o suscripción, Pedido grande de libros, Venta a grupos. Etapa = Nueva → Contactada → Propuesta enviada → Negociación → Ganada / Perdida. Motivo de pérdida = Precio, Sin respuesta, Eligió otra opción, Ya no le interesa, Otro. Actividad = Llamada, Mensaje, Reunión o visita, Nota (Anulada solo la crea el sistema).
- Formatos obligatorios: euros `1.234,50 €`; en la PWA sin decimales si son enteros (`4.200 €`); fechas `23/11/2026` con relativas solo de apoyo («hoy», «hace 3 días»); teléfonos `+34 600 111 222`, enlace de llamada en móvil.
- Atraso: «Atrasada · 3 días». Guardado correcto: «Guardado.» Error general: «Algo salió mal. Inténtalo de nuevo.»
- Nunca pidas DNI, NIE, NIF ni ningún documento de identidad.

## Fundamentos visuales

- Solo modo claro. Fondo de la aplicación `bg-app`; tarjetas, tablas, paneles y diálogos sobre `surface`; separadores con `border`.
- Texto principal `text`; secundario `text-2`; títulos y barra lateral `brown`.
- La acción principal es `primary` (hover `primary-hover`) con texto blanco; también para enlaces, selección y foco. El foco es un anillo sólido de 2 px `primary`, siempre visible.
- Estados: `success` (éxito, Ganada), `warning` (aviso, acción para hoy) y `danger` (atraso, error, Perdida). El ámbar como texto usa `warning-text`, porque `warning` sobre blanco no llega a AA. El color nunca es el único portador de significado: acompáñalo de texto o icono.
- Las etapas abiertas son etiquetas neutras cálidas (`stage-nueva` … `stage-negociacion`); solo Ganada y Perdida llevan color propio.
- Contraste AA como mínimo. Los bordes de campos y casillas usan `border-strong` (3:1); `border` es solo decorativo.
- Tipografía: Inter o la sans-serif del sistema (`--font-sans`) con cifras tabulares. Escritorio: base 14 px (`d-body`), tablas 13 px (`d-table`), títulos 20/16 px. Móvil: base 16 px (`m-body`), cifras destacadas 30 px (`m-figure`).
- Forma: esquinas `radius-sm` (6 px) en controles y `radius-md` (8 px) en tarjetas; sombras casi inexistentes, usa bordes. Solo `shadow-dialog` (escritorio) y `shadow-sheet` (hoja inferior).
- Escritorio (1440 × 900, desde 1280): filas de `row-h` 36 px, barra lateral `sidebar-w` 232 px, contenido máximo `content-max` 1280 px, margen `space-5`. Móvil (390 × 844): márgenes `space-4`, tarjetas con 12–16 px de relleno, objetivos táctiles de `tap-min` 44 px como mínimo.
- Movimiento: solo indicadores de progreso y esqueletos; respeta «reducir movimiento».

## Iconografía

Iconos de trazo fino de 1,6 px, un concepto por icono: teléfono, mensaje, reunión, nota, archivo, alerta, y los de navegación. Van siempre junto a un texto o con etiqueta accesible. Sin ilustraciones decorativas salvo el dibujo sobrio de los estados vacíos (un libro o una taza). La marca es el nombre **CRM-123** en texto con un libro abierto estilizado como símbolo; sin eslogan. El conjunto de iconos es propio de esta guía: no hay logo ni conjunto de iconos fuente.

## Cómo usar este sistema

- Cada componente de «Componentes» tiene su guía y su vista previa; `components/bundle.css` contiene todos los estilos y usa solo variables de `tokens.json`.
- «Escritorio» (W1–W13) y «Móvil» (M1–M8) muestran cada pantalla en su estado normal y en cada estado común: cargando (esqueletos), vacía, error con Reintentar, proceso en ejecución, sin permiso, sesión caducada y, en la PWA, sin conexión.
- «Recorridos» enlaza los flujos 1, 3, 7 y 9 paso a paso.
- Reglas de negocio que el diseño hace evidentes: un cliente tiene un solo vendedor; el teléfono no se repite; Ganada pide monto final y fecha de cierre; Perdida exige motivo; una oportunidad abierta tiene como máximo una próxima acción; las actividades no se editan; reasignar mueve también las oportunidades; hay un máximo de 10 vendedores y 2 supervisores activos y siempre queda un supervisor.
