"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, Suspense } from "react";
import { DEPARTAMENTOS, DEPARTAMENTO_CALENDAR, normalizeDepartamento } from "@/lib/departamentos";
import AdminNav from "@/components/AdminNav";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Ticket {
  id: string;
  title: string;
  user: string;
  status: "open" | "progress" | "resolved";
  date: string;
  priority: string;
  departamento: string;
  sucursal: string;
  ip: string;
  detalles: string;
  fechaInicio?: string;
  fechaEsperada: string;
  respuesta?: string;
}

// ─── Paleta por departamento ───────────────────────────────────────────────────
// ─── Paleta por departamento (Sistemas=Azul, Marketing=Morado, Arquitectura=Verde) ──
type DeptStyle = { bg: string; text: string; dot: string; ring: string; border: string };
const DEPT_COLORS: Record<string, DeptStyle> = DEPARTAMENTO_CALENDAR;
const DEFAULT_COLOR: DeptStyle = { bg: "bg-zinc-100", text: "text-zinc-700", dot: "bg-zinc-400", ring: "ring-zinc-400", border: "border-zinc-300" };
const getDeptColor = (dept: string) => DEPT_COLORS[dept] ?? DEFAULT_COLOR;

// ─── Umbral de saturación de carga de trabajo ─────────────────────────────────
// Si un departamento tiene >= 3 tickets activos en un mismo día, se considera saturado
const OVERLOAD_THRESHOLD = 3;


// ─── Helpers de fecha ─────────────────────────────────────────────────────────
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function formatYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7; // Lun=0
}

// ─── Componente Principal ─────────────────────────────────────────────────────
function CalendarioContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [today, setToday] = useState<Date>(() => new Date(2026, 9, 23));
  const [viewYear, setViewYear]   = useState(2026);
  const [viewMonth, setViewMonth] = useState(9); // Octubre
  const [activeDepts, setActiveDepts] = useState<Set<string>>(new Set<string>(DEPARTAMENTOS));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/tickets");
        if (!res.ok) throw new Error("Error al consultar API");
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((t: Record<string, unknown>) => ({
          ...t,
          departamento: normalizeDepartamento(t.departamento),
        }));
        setTickets(normalized as Ticket[]);
      } catch (e) {
        console.error("[Admin Calendario] Error cargando tickets:", e);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  const allDepts = useMemo(() => {
    const s = new Set<string>(DEPARTAMENTOS);
    tickets.forEach(t => { if (t.departamento) s.add(t.departamento); });
    return Array.from(s);
  }, [tickets]);

  const allDeptsKey = allDepts.join(",");
  useEffect(() => { setActiveDepts(new Set(allDepts)); }, [allDeptsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDept = (dept: string) => {
    setActiveDepts(prev => {
      const n = new Set(prev);
      if (n.has(dept)) n.delete(dept); else n.add(dept);
      return n;
    });
  };

  const filteredTickets = useMemo(
    () => tickets.filter(t => activeDepts.has(t.departamento)),
    [tickets, activeDepts]
  );

  // Mapa día → tickets (expandir rango fechaInicio–fechaEsperada)
  const ticketsByDay = useMemo<Record<string, Ticket[]>>(() => {
    const map: Record<string, Ticket[]> = {};
    const addToDay = (date: string, t: Ticket) => {
      if (!date) return;
      if (!map[date]) map[date] = [];
      if (!map[date].find(x => x.id === t.id)) map[date].push(t);
    };
    filteredTickets.forEach(t => {
      const start = t.fechaInicio;
      const end   = t.fechaEsperada;
      if (start && end && start <= end) {
        const cur = new Date(start + "T12:00:00");
        const endDate = new Date(end + "T12:00:00");
        while (cur <= endDate) { addToDay(formatYMD(cur), t); cur.setDate(cur.getDate() + 1); }
      } else if (end) { addToDay(end, t); }
      else if (start) { addToDay(start, t); }
    });
    return map;
  }, [filteredTickets]);

  // ─── CÁLCULO DE CARGA DE TRABAJO (WORKLOAD SATURATION) ──────────────────────
  // Identifica días donde un departamento supera el umbral (OVERLOAD_THRESHOLD >= 3).
  // Para cada día se agrupan los tickets por departamento. Si un departamento tiene >= 3,
  // el día se agrega a 'overloadedDays' para activar fondo rojizo, alerta y barra de progreso.
  const overloadedDays = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    Object.entries(ticketsByDay).forEach(([day, ts]) => {
      const countByDept: Record<string, number> = {};
      ts.forEach(t => { countByDept[t.departamento] = (countByDept[t.departamento] || 0) + 1; });
      if (Math.max(...Object.values(countByDept)) >= OVERLOAD_THRESHOLD) s.add(day);
    });
    return s;
  }, [ticketsByDay]);

  const daysInMonth   = getDaysInMonth(viewYear, viewMonth);
  const firstWeekDay  = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); setSelectedDay(null); };

  const todayStr = formatYMD(today);
  const selectedDayTickets = selectedDay ? (ticketsByDay[selectedDay] ?? []) : [];

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthTicketsUnique = Array.from(
    new Map(
      Object.entries(ticketsByDay)
        .filter(([d]) => d.startsWith(monthPrefix))
        .flatMap(([, ts]) => ts)
        .map(t => [t.id, t])
    ).values()
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-16" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Unified Navbar */}
      <AdminNav currentTab="calendario" />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header Consistente */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#003479] bg-[#003479]/10 px-2.5 py-0.5 rounded-full">
                Disponibilidad y Carga Técnica
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#003479] tracking-tight">
              Calendario de Carga de Trabajo
            </h1>
            <p className="text-sm text-[#37312E]/70 mt-1">
              Monitoreo visual de la programación de tickets, fechas de entrega y saturación de departamentos.
            </p>
          </div>

        </div>

        {/* 4 Stat Cards Consistentes */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 animate-fade-in-up delay-100">
          <div className="p-5 rounded-xl border border-[#EAEAEA] bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Tickets del Mes</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#003479]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#003479]">{monthTicketsUnique.length}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">En curso o programados</p>
          </div>

          {DEPARTAMENTOS.map(dept => (
            <div key={dept} className="p-5 rounded-xl border border-[#EAEAEA] bg-white shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">{dept}</p>
                <span className={`w-2.5 h-2.5 rounded-full ${getDeptColor(dept).dot}`}></span>
              </div>
              <p className={`text-2xl sm:text-3xl font-semibold ${DEPARTAMENTO_CALENDAR[dept].statText}`}>
                {monthTicketsUnique.filter(t => t.departamento === dept).length}
              </p>
              <p className="text-[11px] text-[#37312E]/50 mt-1">Tickets este mes</p>
            </div>
          ))}

          <div className="p-5 rounded-xl border border-[#EAEAEA] bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Días Saturados</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#CA1224]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#CA1224]">{overloadedDays.size}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">≥3 tickets / día</p>
          </div>
        </div>

        {/* Filtros Interactivos por Departamento (Ocultar/Mostrar/Ver Solo) */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 mb-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#37312E]/70 uppercase tracking-widest">Filtros de Vista:</span>
              <button
                type="button"
                onClick={() => setActiveDepts(new Set(allDepts))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#003479] text-white cursor-pointer hover:bg-[#00275C] transition-all"
              >
                Ver Todos
              </button>
              <button
                type="button"
                onClick={() => setActiveDepts(new Set())}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAFAFA] text-[#37312E]/60 border border-[#EAEAEA] cursor-pointer hover:bg-white transition-all"
              >
                Limpiar Todo
              </button>
            </div>

            {/* Accesos rápidos "Ver solo" */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#37312E]/60">
              <span className="text-[11px] font-medium mr-1">Ver sólo:</span>
              {DEPARTAMENTOS.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setActiveDepts(new Set([dept]))}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAFAFA] hover:bg-[#003479]/10 hover:text-[#003479] border border-[#EAEAEA] transition-colors cursor-pointer"
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Badges interactivos de conmutación */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F5F5F5]">
            {allDepts.map(dept => {
              const col = getDeptColor(dept);
              const isActive = activeDepts.has(dept);
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => toggleDept(dept)}
                  title={isActive ? `Clic para ocultar ${dept}` : `Clic para mostrar ${dept}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? `${col.bg} ${col.text} ${col.border} ring-1 ${col.ring} shadow-xs`
                      : "bg-white text-[#37312E]/40 border-[#EAEAEA] opacity-40 hover:opacity-75"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? col.dot : "bg-[#EAEAEA]"}`}></span>
                  <span>{dept}</span>
                  <span className="text-[10px] ml-1 opacity-70">
                    {isActive ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerta saturación */}
        {overloadedDays.size > 0 && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 shadow-xs">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            <p className="text-xs font-medium">
              <strong>{overloadedDays.size} día{overloadedDays.size > 1 ? "s" : ""} con alta carga</strong> — ≥{OVERLOAD_THRESHOLD} tickets en el mismo departamento. Marcados en rojo.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
          {/* Calendario */}
          <div className="bg-white border border-[#EAEAEA] rounded-2xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <button type="button" onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#F0F0F0] transition-colors cursor-pointer" title="Mes anterior">
                  <svg className="w-5 h-5 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewYear(today.getFullYear());
                    setViewMonth(today.getMonth());
                    setSelectedDay(null);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAFAFA] text-[#003479] hover:bg-[#003479]/10 border border-[#EAEAEA] transition-all cursor-pointer"
                >
                  Hoy
                </button>
              </div>
              <h2 className="text-lg font-semibold text-[#003479] tracking-tight">{MONTHS_ES[viewMonth]} {viewYear}</h2>
              <button type="button" onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#F0F0F0] transition-colors cursor-pointer" title="Mes siguiente">
                <svg className="w-5 h-5 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 border-b border-[#EAEAEA]">
              {DAYS_ES.map(d => <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#37312E]/50">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-[#F0F0F0]">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} className="min-h-[90px] bg-[#FAFAFA]/50"></div>;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayTs = ticketsByDay[dateStr] ?? [];
                const isToday    = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const isOverload = overloadedDays.has(dateStr);
                return (
                  <div key={dateStr} onClick={() => setSelectedDay(p => p === dateStr ? null : dateStr)}
                    className={`min-h-[90px] p-1.5 cursor-pointer transition-all relative
                      ${isSelected ? "bg-[#003479]/[0.07] ring-2 ring-inset ring-[#003479]/40" : "hover:bg-[#003479]/[0.02]"}
                      ${isOverload && !isSelected ? "bg-red-50/60" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? "bg-[#003479] text-white" : isOverload ? "text-red-700" : "text-[#37312E]/60"}`}>{day}</span>
                      {isOverload && (
                        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayTs.slice(0, 3).map(t => {
                        const col = getDeptColor(t.departamento);
                        return <div key={t.id} className={`${col.bg} ${col.text} rounded px-1 py-0.5 text-[9px] font-medium leading-tight truncate`}>{t.title}</div>;
                      })}
                      {dayTs.length > 3 && <div className="text-[9px] text-[#37312E]/50 pl-0.5">+{dayTs.length - 3} más</div>}
                    </div>
                    {dayTs.length > 0 && (
                      <div className="absolute bottom-1 left-1.5 right-1.5 h-1 rounded-full bg-[#EAEAEA] overflow-hidden">
                        <div className={`h-full rounded-full ${dayTs.length >= OVERLOAD_THRESHOLD ? "bg-red-400" : dayTs.length >= 2 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(100, (dayTs.length / (OVERLOAD_THRESHOLD + 1)) * 100)}%` }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-4">
            {/* Leyenda */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 shadow-xs">
              <p className="text-xs font-bold text-[#37312E]/60 uppercase tracking-widest mb-3">Indicador de carga</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><div className="w-12 h-2 rounded-full bg-emerald-400"></div><span className="text-[#37312E]/70">1 ticket</span></div>
                <div className="flex items-center gap-2"><div className="w-12 h-2 rounded-full bg-amber-400"></div><span className="text-[#37312E]/70">2 tickets</span></div>
                <div className="flex items-center gap-2"><div className="w-12 h-2 rounded-full bg-red-400"></div><span className="text-[#37312E]/70">≥{OVERLOAD_THRESHOLD} (Saturado)</span></div>
              </div>
            </div>

            {/* Detalle día */}
            {selectedDay ? (
              <div className="bg-white border border-[#003479]/20 rounded-xl shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-[#003479]/5 border-b border-[#EAEAEA] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#003479]/70 font-semibold uppercase tracking-widest">Día</p>
                    <p className="text-sm font-bold text-[#003479]">{selectedDay}</p>
                  </div>
                  <span className="text-xs font-bold bg-[#003479] text-white px-2 py-0.5 rounded-full">{selectedDayTickets.length}</span>
                </div>
                <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                  {selectedDayTickets.length === 0
                    ? <p className="text-xs text-center text-[#37312E]/40 py-6">Sin tickets para este día.</p>
                    : selectedDayTickets.map(t => {
                        const col = getDeptColor(t.departamento);
                        return (
                          <div key={t.id} className={`${col.bg} rounded-lg p-3`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className={`text-[10px] font-bold font-mono ${col.text}`}>{t.id}</span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60 ${col.text}`}>{t.departamento}</span>
                            </div>
                            <p className={`text-xs font-semibold ${col.text} leading-snug mb-1`}>{t.title}</p>
                            <div className="flex items-center gap-3 text-[10px] text-[#37312E]/60">
                              <span>👤 {t.user}</span>
                              <span className={t.status === "open" ? "text-red-600" : t.status === "progress" ? "text-[#003479]" : "text-emerald-700"}>
                                {t.status === "open" ? "Pendiente" : t.status === "progress" ? "En Progreso" : "Resuelto"}
                              </span>
                            </div>
                            {t.fechaEsperada && <p className="text-[9px] text-[#37312E]/50 mt-1">📅 Entrega: {t.fechaEsperada}</p>}
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#EAEAEA] rounded-xl p-6 text-center shadow-xs">
                <svg className="w-8 h-8 text-[#EAEAEA] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p className="text-xs text-[#37312E]/40">Haz clic en un día para ver sus tickets.</p>
              </div>
            )}

            {/* Resumen mes */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 shadow-xs">
              <p className="text-xs font-bold text-[#37312E]/60 uppercase tracking-widest mb-3">Resumen del mes</p>
              {allDepts.length === 0
                ? <p className="text-xs text-[#37312E]/40 italic">Sin datos</p>
                : allDepts.map(dept => {
                    const col = getDeptColor(dept);
                    const count = monthTicketsUnique.filter(t => t.departamento === dept).length;
                    const pct   = monthTicketsUnique.length > 0 ? Math.round((count / monthTicketsUnique.length) * 100) : 0;
                    return (
                      <div key={dept} className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className={`font-medium ${col.text}`}>{dept}</span>
                          <span className="text-[#37312E]/50">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                          <div className={`h-full rounded-full ${col.dot}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CalendarioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-sm text-[#003479]">Cargando calendario...</div>}>
      <CalendarioContent />
    </Suspense>
  );
}
