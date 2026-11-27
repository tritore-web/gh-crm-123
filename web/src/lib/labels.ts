// Valores guardados (SCRIPTS-SQL §2.3) y su etiqueta en pantalla. Las listas son cerradas: no se pueden añadir otras.
export const SOURCES = ['tienda', 'web', 'redes', 'recomendacion'] as const;
export const OPPORTUNITY_TYPES = ['evento_privado', 'catering', 'club_lectura_suscripcion', 'pedido_grande_libros', 'venta_grupos'] as const;
export const OPEN_STAGES = ['nueva', 'contactada', 'propuesta_enviada', 'negociacion'] as const;
export const STAGES = [...OPEN_STAGES, 'ganada', 'perdida'] as const;
export const LOST_REASONS = ['precio', 'sin_respuesta', 'eligio_otra_opcion', 'ya_no_le_interesa', 'otro'] as const;
export const ACTIVITY_TYPES = ['llamada', 'mensaje', 'reunion', 'nota'] as const; // "anulacion" es del sistema: no se ofrece al crear

export type Source = (typeof SOURCES)[number];
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type OpenStage = (typeof OPEN_STAGES)[number];
export type Stage = (typeof STAGES)[number];
export type LostReason = (typeof LOST_REASONS)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const SOURCE_LABEL: Record<Source, string> = {
  tienda: 'Tienda',
  web: 'Web',
  redes: 'Redes sociales',
  recomendacion: 'Recomendación',
};
export const TYPE_LABEL: Record<OpportunityType, string> = {
  evento_privado: 'Evento privado',
  catering: 'Catering',
  club_lectura_suscripcion: 'Club de lectura o suscripción',
  pedido_grande_libros: 'Pedido grande de libros',
  venta_grupos: 'Venta a grupos',
};
export const STAGE_LABEL: Record<Stage, string> = {
  nueva: 'Nueva',
  contactada: 'Contactada',
  propuesta_enviada: 'Propuesta enviada',
  negociacion: 'Negociación',
  ganada: 'Ganada',
  perdida: 'Perdida',
};
export const LOST_REASON_LABEL: Record<LostReason, string> = {
  precio: 'Precio',
  sin_respuesta: 'Sin respuesta',
  eligio_otra_opcion: 'Eligió otra opción',
  ya_no_le_interesa: 'Ya no le interesa',
  otro: 'Otro',
};
export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  llamada: 'Llamada',
  mensaje: 'Mensaje',
  reunion: 'Reunión o visita',
  nota: 'Nota',
};

const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

export const isSource = (v: unknown): v is Source => includes(SOURCES, v);
export const isOpportunityType = (v: unknown): v is OpportunityType => includes(OPPORTUNITY_TYPES, v);
export const isStage = (v: unknown): v is Stage => includes(STAGES, v);
export const isOpenStage = (v: unknown): v is OpenStage => includes(OPEN_STAGES, v);
export const isLostReason = (v: unknown): v is LostReason => includes(LOST_REASONS, v);
export const isActivityType = (v: unknown): v is ActivityType => includes(ACTIVITY_TYPES, v);

export const sourceLabel = (v: string) => (isSource(v) ? SOURCE_LABEL[v] : v);
export const typeLabel = (v: string) => (isOpportunityType(v) ? TYPE_LABEL[v] : v);
export const stageLabel = (v: string) => (isStage(v) ? STAGE_LABEL[v] : v);
export const lostReasonLabel = (v: string) => (isLostReason(v) ? LOST_REASON_LABEL[v] : v);
export const isClosedStage = (v: string) => v === 'ganada' || v === 'perdida';
