// Catálogo único de departamentos. Lo usan el portal, el panel admin, los
// calendarios y la API, para que agregar un departamento sea un solo cambio.

export const DEPARTAMENTOS = ["Sistemas", "Marketing", "Arquitectura", "Gerencia"] as const;

export type Departamento = (typeof DEPARTAMENTOS)[number];

export const DEPARTAMENTO_DEFAULT: Departamento = "Sistemas";

export function isDepartamento(value: unknown): value is Departamento {
  return typeof value === "string" && (DEPARTAMENTOS as readonly string[]).includes(value);
}

// Nombres antiguos que pudieron guardarse en tickets previos.
const LEGACY_ALIASES: Record<string, Departamento> = {
  "Soporte de TI": "Sistemas",
  "Recursos Humanos": "Marketing",
  "Mantenimiento de Instalaciones": "Arquitectura",
};

export function normalizeDepartamento(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEPARTAMENTO_DEFAULT;
  return LEGACY_ALIASES[value] ?? value;
}

export const DEPARTAMENTO_INFO: Record<
  Departamento,
  { color: string; bg: string; dot: string; desc: string }
> = {
  Sistemas: { color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-600", desc: "Infraestructura, redes y software" },
  Marketing: { color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-600", desc: "Diseño, campañas y publicidad" },
  Arquitectura: { color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-600", desc: "Planos, renders y remodelaciones" },
  Gerencia: { color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-600", desc: "Dirección, autorizaciones y gestión" },
};

// Colores usados por los calendarios (público y admin).
export const DEPARTAMENTO_CALENDAR: Record<
  Departamento,
  { bg: string; text: string; dot: string; ring: string; border: string; pill: string; statText: string }
> = {
  Sistemas: { bg: "bg-blue-50 text-blue-900 border-blue-200", text: "text-blue-800", dot: "bg-blue-600", ring: "ring-blue-400", border: "border-blue-300", pill: "bg-blue-100 text-blue-800", statText: "text-blue-700" },
  Marketing: { bg: "bg-purple-50 text-purple-900 border-purple-200", text: "text-purple-800", dot: "bg-purple-600", ring: "ring-purple-400", border: "border-purple-300", pill: "bg-purple-100 text-purple-800", statText: "text-purple-700" },
  Arquitectura: { bg: "bg-emerald-50 text-emerald-900 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-600", ring: "ring-emerald-400", border: "border-emerald-300", pill: "bg-emerald-100 text-emerald-800", statText: "text-emerald-700" },
  Gerencia: { bg: "bg-amber-50 text-amber-900 border-amber-200", text: "text-amber-800", dot: "bg-amber-600", ring: "ring-amber-400", border: "border-amber-300", pill: "bg-amber-100 text-amber-800", statText: "text-amber-700" },
};
