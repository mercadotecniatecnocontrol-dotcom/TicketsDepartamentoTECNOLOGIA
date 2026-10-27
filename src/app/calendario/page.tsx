"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, Suspense } from "react";
import { DEPARTAMENTOS, DEPARTAMENTO_CALENDAR, normalizeDepartamento } from "@/lib/departamentos";

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

// ─── Paleta por departamento (catálogo compartido en @/lib/departamentos) ──
type DeptStyle = { bg: string; text: string; dot: string; ring: string; border: string; pill: string };
const DEPT_COLORS: Record<string, DeptStyle> = DEPARTAMENTO_CALENDAR;
const DEFAULT_COLOR: DeptStyle = {
  bg: "bg-zinc-50 text-zinc-800 border-zinc-200",
  text: "text-zinc-700",
  dot: "bg-zinc-500",
  ring: "ring-zinc-400",
  border: "border-zinc-300",
  pill: "bg-zinc-100 text-zinc-700"
};
const getDeptColor = (dept: string) => DEPT_COLORS[dept] ?? DEFAULT_COLOR;

// ─── Umbral de saturación de carga de trabajo ─────────────────────────────────
// Si un departamento tiene >= 3 tickets en un mismo día, se considera saturado.
const OVERLOAD_THRESHOLD = 3;


// ─── Helpers de fecha ─────────────────────────────────────────────────────────
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7; // Lun=0
}

function CalendarioContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [today, setToday] = useState<Date>(() => new Date(2026, 9, 23));
  const [viewYear, setViewYear] = useState(2026);
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
        console.error("[Calendario] Error cargando tickets:", e);
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

  // Si aparece un departamento nuevo en los datos, se muestra activo por defecto
  const allDeptsKey = allDepts.join(",");
  useEffect(() => {
    setActiveDepts(prev => {
      const n = new Set(prev);
      allDepts.forEach(d => n.add(d));
      return n;
    });
  }, [allDeptsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Mapeo día → tickets expandiendo el rango [fechaInicio, fechaEsperada]
  const ticketsByDay = useMemo<Record<string, Ticket[]>>(() => {
    const map: Record<string, Ticket[]> = {};
    const addToDay = (date: string, t: Ticket) => {
      if (!date) return;
      if (!map[date]) map[date] = [];
      if (!map[date].find(x => x.id === t.id)) map[date].push(t);
    };
    filteredTickets.forEach(t => {
      const start = t.fechaInicio;
      const end = t.fechaEsperada;
      if (start && end && start <= end) {
        const cur = new Date(start + "T12:00:00");
        const endDate = new Date(end + "T12:00:00");
        while (cur <= endDate) {
          addToDay(formatYMD(cur), t);
          cur.setDate(cur.getDate() + 1);
        }
      } else if (end) {
        addToDay(end, t);
      } else if (start) {
        addToDay(start, t);
      }
    });
    return map;
  }, [filteredTickets]);

  // ─── CÁLCULO DE SATURACIÓN DE CARGA DE TRABAJO ──────────────────────────────
  // Identifica los días con >= 3 tickets en el mismo departamento
  const overloadedDays = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    Object.entries(ticketsByDay).forEach(([day, ts]) => {
      const countByDept: Record<string, number> = {};
      ts.forEach(t => {
        countByDept[t.departamento] = (countByDept[t.departamento] || 0) + 1;
      });
      if (Math.max(...Object.values(countByDept)) >= OVERLOAD_THRESHOLD) {
        s.add(day);
      }
    });
    return s;
  }, [ticketsByDay]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

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
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#003479]/20 selection:text-[#003479] pb-16">
      {/* Top Navbar Consistente */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#EAEAEA] bg-white/80 backdrop-blur-xl animate-fade-in-up">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <img src="/logotecno.png" alt="Tecnocontrol Logo" style={{ height: "42px", width: "auto", objectFit: "contain", flexShrink: 0 }} />
              <span className="font-semibold text-[#003479] text-base tracking-tight hidden sm:inline-block">Tecnocontrol TI</span>
            </Link>

            {/* Nav Links Públicos */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#37312E]/70 hover:text-[#003479] hover:bg-[#FAFAFA] border border-transparent hover:border-[#EAEAEA] transition-all"
              >
                Levantar Solicitud
              </Link>
              <Link
                href="/calendario"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#003479] text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Calendario de Carga</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-[#37312E]/70 hover:text-[#003479] hover:bg-[#FAFAFA] border border-[#EAEAEA] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Panel Administrativo →</span>
            </Link>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex sm:hidden border-t border-[#EAEAEA] px-6 py-2 bg-[#FBFBFB] overflow-x-auto gap-2">
          <Link href="/" className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 hover:text-[#003479] bg-white border border-[#EAEAEA]">
            Levantar Solicitud
          </Link>
          <Link href="/calendario" className="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#003479] text-white flex items-center gap-1">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Calendario</span>
          </Link>
          <Link href="/admin" className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 hover:text-[#003479] bg-white border border-[#EAEAEA]">
            Admin
          </Link>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
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
              Monitoreo visual de fechas de entrega, compromisos y saturación técnica para cualquier usuario.
            </p>
          </div>
        </div>

        {/* Tarjetas de estadísticas: total, una por departamento y días saturados */}
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

        {/* Filtros Interactivos de Departamento */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 sm:p-5 mb-6 shadow-xs animate-fade-in-up delay-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#F0F0F0]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#37312E]/70 uppercase tracking-widest">Filtros de Vista:</span>
              <button
                type="button"
                onClick={() => setActiveDepts(new Set(allDepts))}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#003479] text-white cursor-pointer hover:bg-[#00275C] transition-all shadow-xs active:scale-95"
              >
                Ver Todos
              </button>
              <button
                type="button"
                onClick={() => setActiveDepts(new Set())}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-[#FAFAFA] text-[#37312E]/60 border border-[#EAEAEA] cursor-pointer hover:bg-white transition-all active:scale-95"
              >
                Ocultar Todos
              </button>
            </div>

            {/* Accesos rápidos "Ver solo" */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#37312E]/70">
              <span className="text-[11px] font-medium mr-1">Ver sólo:</span>
              {DEPARTAMENTOS.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setActiveDepts(new Set([dept]))}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FAFAFA] hover:bg-[#003479]/10 hover:text-[#003479] border border-[#EAEAEA] transition-colors cursor-pointer active:scale-95"
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Badges de Conmutación de Departamentos */}
          <div className="flex flex-wrap items-center gap-2.5">
            {allDepts.map(dept => {
              const col = getDeptColor(dept);
              const isActive = activeDepts.has(dept);
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => toggleDept(dept)}
                  title={isActive ? `Clic para ocultar ${dept}` : `Clic para mostrar ${dept}`}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isActive
                      ? `${col.bg} ring-1 ${col.ring} shadow-xs`
                      : "bg-white text-[#37312E]/40 border-[#EAEAEA] opacity-40 hover:opacity-75"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? col.dot : "bg-[#EAEAEA]"}`}></span>
                  <span>{dept}</span>
                  <span className="text-[10px] ml-0.5 opacity-80">
                    {isActive ? "✓ Activo" : "+ Oculto"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerta de Carga Saturada si existe */}
        {overloadedDays.size > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ⚠
              </span>
              <div>
                <h4 className="font-semibold text-xs sm:text-sm">Advertencia de Disponibilidad (Alta Demanda)</h4>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Hay <strong>{overloadedDays.size} día(s)</strong> con 3 o más tickets concentrados en el mismo departamento. Se encuentran resaltados en rojo.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">
              Umbral: ≥{OVERLOAD_THRESHOLD} tickets
            </span>
          </div>
        )}

        {/* Layout Calendario + Detalle */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Tarjeta del Calendario */}
          <div className="bg-white rounded-xl border border-[#EAEAEA] shadow-xs overflow-hidden">
            {/* Cabecera del Mes */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FBFBFB]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#EAEAEA] transition-colors cursor-pointer text-[#003479]"
                  title="Mes anterior"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewYear(today.getFullYear());
                    setViewMonth(today.getMonth());
                    setSelectedDay(null);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-white text-[#003479] hover:bg-[#003479] hover:text-white border border-[#EAEAEA] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Hoy
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-[#003479] tracking-tight">
                {MONTHS_ES[viewMonth]} {viewYear}
              </h2>

              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#EAEAEA] transition-colors cursor-pointer text-[#003479]"
                title="Mes siguiente"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-[#EAEAEA] bg-[#FAFAFA]">
              {DAYS_ES.map(d => (
                <div key={d} className="py-2.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#37312E]/50">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#F0F0F0]">
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="min-h-[100px] bg-[#FAFAFA]/40"></div>;

                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayTs = ticketsByDay[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const isOverload = overloadedDays.has(dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDay(p => p === dateStr ? null : dateStr)}
                    className={`min-h-[105px] p-2 cursor-pointer transition-all relative flex flex-col justify-between ${isSelected
                        ? "bg-[#003479]/[0.08] ring-2 ring-inset ring-[#003479]/40"
                        : "hover:bg-[#003479]/[0.02]"
                      } ${isOverload && !isSelected ? "bg-red-50/70" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday
                              ? "bg-[#003479] text-white shadow-xs"
                              : isOverload
                                ? "text-red-700 font-extrabold"
                                : "text-[#37312E]/70"
                            }`}
                        >
                          {day}
                        </span>

                        {isOverload && (
                          <span title="Día saturado: falta de disponibilidad técnica" className="flex items-center text-red-600">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Lista de Tickets en la casilla */}
                      <div className="space-y-1">
                        {dayTs.slice(0, 2).map(t => {
                          const col = getDeptColor(t.departamento);
                          return (
                            <div
                              key={t.id}
                              className={`${col.pill} rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight truncate border ${col.border}`}
                              title={`${t.id}: ${t.title} (${t.departamento})`}
                            >
                              {t.title}
                            </div>
                          );
                        })}
                        {dayTs.length > 2 && (
                          <div className="text-[10px] font-semibold text-[#003479] pl-1">
                            +{dayTs.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso de saturación en el borde inferior */}
                    {dayTs.length > 0 && (
                      <div className="mt-2 h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${dayTs.length >= OVERLOAD_THRESHOLD
                              ? "bg-red-500"
                              : dayTs.length >= 2
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            }`}
                          style={{ width: `${Math.min(100, (dayTs.length / OVERLOAD_THRESHOLD) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Lateral: Detalle del Día & Leyenda */}
          <div className="space-y-5">
            {/* Leyenda de Carga */}
            <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 shadow-xs">
              <h3 className="text-xs font-bold text-[#37312E]/70 uppercase tracking-widest mb-3">
                Nivel de Disponibilidad
              </h3>
              <div className="space-y-2.5 text-xs text-[#37312E]/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>1 Ticket (Carga normal)</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">Disponible</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>2 Tickets (Carga media)</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold">Moderado</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>≥3 Tickets (Saturado)</span>
                  </div>
                  <span className="text-[11px] text-red-700 font-bold">Sin cupo</span>
                </div>
              </div>
            </div>

            {/* Detalle del Día Seleccionado */}
            {selectedDay ? (
              <div className="bg-white rounded-xl border border-[#003479]/20 shadow-xs overflow-hidden animate-fade-in">
                <div className="px-5 py-3.5 bg-[#003479]/5 border-b border-[#EAEAEA] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#003479]/70 font-semibold uppercase tracking-widest">Día Seleccionado</p>
                    <p className="text-sm font-bold text-[#003479]">{selectedDay}</p>
                  </div>
                  <span className="text-xs font-bold bg-[#003479] text-white px-2.5 py-0.5 rounded-full">
                    {selectedDayTickets.length} tickets
                  </span>
                </div>

                <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
                  {selectedDayTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-[#37312E]/50">No hay tickets programados para este día.</p>
                      <Link
                        href={`/?fecha=${selectedDay}`}
                        className="inline-block mt-3 text-xs font-semibold text-[#003479] bg-[#003479]/10 hover:bg-[#003479] hover:text-white px-3 py-1.5 rounded-lg transition-all"
                      >
                        + Crear Ticket para esta fecha ({selectedDay})
                      </Link>
                    </div>
                  ) : (
                    selectedDayTickets.map(t => {
                      const col = getDeptColor(t.departamento);
                      return (
                        <div key={t.id} className={`p-3.5 rounded-xl border ${col.bg}`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-mono font-bold">{t.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.pill}`}>
                              {t.departamento}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold leading-snug mb-2 text-[#37312E]">
                            {t.title}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#37312E]/70 pt-2 border-t border-black/5">
                            <div>
                              <span className="text-[#37312E]/50 block text-[9px] uppercase">Solicitante:</span>
                              <span className="font-medium">{t.user}</span>
                            </div>
                            <div>
                              <span className="text-[#37312E]/50 block text-[9px] uppercase">Estado:</span>
                              <span className={`font-semibold ${t.status === "open" ? "text-red-600" : t.status === "progress" ? "text-[#003479]" : "text-emerald-700"
                                }`}>
                                {t.status === "open" ? "Pendiente" : t.status === "progress" ? "En Progreso" : "Resuelto"}
                              </span>
                            </div>
                          </div>
                          {t.fechaEsperada && (
                            <p className="text-[10px] text-[#37312E]/60 mt-2 font-medium">
                              📅 Fecha de Entrega: <strong>{t.fechaEsperada}</strong>
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 text-center shadow-xs">
                <svg className="w-10 h-10 text-[#003479]/20 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-medium text-[#37312E]/70">Haz clic en cualquier día del calendario para ver los tickets asignados y la disponibilidad técnica.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PublicCalendarioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-sm text-[#003479]">Cargando calendario...</div>}>
      <CalendarioContent />
    </Suspense>
  );
}
