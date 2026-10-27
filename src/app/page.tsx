"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { DEPARTAMENTOS, DEPARTAMENTO_INFO, type Departamento } from "@/lib/departamentos";
import { useAuth } from "@/lib/auth-context";

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
  evidencias?: string[];
}

const statusBadge = (s: string) => {
  switch (s) {
    case "open":
      return { label: "Pendiente", bg: "bg-red-50 text-[#CA1224] border-red-200/60", dot: "bg-[#CA1224]" };
    case "progress":
      return { label: "En Progreso", bg: "bg-blue-50 text-[#003479] border-blue-200/60", dot: "bg-[#003479]" };
    case "resolved":
      return { label: "Resuelto", bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-600" };
    default:
      return { label: s, bg: "bg-zinc-50 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" };
  }
};

const priorityBadge = (p: string) => {
  switch (p) {
    case "Alta":
      return "bg-[#CA1224]/10 text-[#CA1224] border-[#CA1224]/20";
    case "Media":
      return "bg-orange-50 text-orange-700 border-orange-200/60";
    case "Baja":
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
};

function HomeContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"crear" | "consultar">("crear");

  // Form state
  const [solicitante, setSolicitante] = useState("");
  const [asunto, setAsunto] = useState("");
  const [departamento, setDepartamento] = useState<Departamento>("Sistemas");
  const [sucursal, setSucursal] = useState("Chihuahua");
  const [ip, setIp] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [detalles, setDetalles] = useState("");

  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [copiedFolio, setCopiedFolio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ solicitante?: string; asunto?: string; detalles?: string; ip?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Status Lookup State
  const [searchFolio, setSearchFolio] = useState("");
  const [consultTicket, setConsultTicket] = useState<Ticket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isForanea = sucursal.trim().toLowerCase() !== "chihuahua";
  const requiresRemoteAccess = departamento === "Sistemas" && isForanea;

  // Check URL parameters for auto-lookup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const folio = params.get("folio");
      const tab = params.get("tab");
      if (folio) {
        setSearchFolio(folio);
        setActiveTab("consultar");
        handleDirectLookup(folio);
      } else if (tab === "consultar") {
        setActiveTab("consultar");
      }
    }
  }, []);

  const handleDirectLookup = async (folioToSearch: string) => {
    const term = folioToSearch.trim().toLowerCase();
    if (!term) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Error al consultar el servidor");
      const tickets: Ticket[] = await res.json();
      const match = tickets.find(
        (t) =>
          t.id.toLowerCase() === term ||
          t.id.toLowerCase() === `t-${term}` ||
          (t.user && t.user.toLowerCase().includes(term))
      );
      if (match) {
        setConsultTicket(match);
      } else {
        setConsultTicket(null);
        setSearchError(`No se encontró ningún ticket con el folio o solicitante "${folioToSearch}".`);
      }
    } catch {
      setSearchError("No se pudo conectar con el servidor para verificar el ticket.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFolio.trim()) {
      setSearchError("Ingrese un número de folio (ej. T-1042) o nombre del solicitante.");
      return;
    }
    handleDirectLookup(searchFolio);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};

    if (!solicitante.trim()) errors.solicitante = "Por favor ingrese el nombre del solicitante.";
    if (!asunto.trim()) errors.asunto = "Por favor especifique el asunto del problema.";
    if (!detalles.trim()) errors.detalles = "Por favor detalle la información de la solicitud.";
    if (requiresRemoteAccess && !ip.trim()) {
      errors.ip = "Para sucursales foráneas en Sistemas es necesario el acceso remoto (AnyDesk, TeamViewer o IP).";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    setSubmitError(null);

    try {
      const now = new Date();
      const hora = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const newId = `T-${Date.now().toString().slice(-6)}`;

      const newTicket: Ticket = {
        id: newId,
        title: asunto.trim(),
        user: solicitante.trim(),
        status: "open",
        date: `Hoy, ${hora}`,
        priority: prioridad,
        departamento,
        sucursal,
        ip: requiresRemoteAccess ? ip.trim() : "",
        detalles: detalles.trim(),
        // La fecha de inicio se registra automáticamente; la de resolución la establece el administrador
        fechaInicio: todayYMD,
        fechaEsperada: "",
        respuesta: "",
        evidencias: [],
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      if (!res.ok) throw new Error("Error del servidor");

      setCreatedTicketId(newId);

      // Reset form
      setSolicitante("");
      setAsunto("");
      setDetalles("");
      setIp("");
    } catch {
      setSubmitError("No se pudo registrar la solicitud. Por favor intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFolio(true);
      setTimeout(() => setCopiedFolio(false), 2500);
    }
  };

  const dept = DEPARTAMENTO_INFO[departamento];

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#EAEAEA] bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/logotecno.png" alt="Tecnocontrol" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
              <span className="font-semibold text-[#003479] text-sm tracking-tight hidden sm:inline">Tecnocontrol TI</span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("crear")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "crear" ? "bg-[#003479] text-white" : "text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA]"
                }`}
              >
                Levantar Solicitud
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("consultar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "consultar" ? "bg-[#003479] text-white" : "text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA]"
                }`}
              >
                Consultar Estatus
              </button>
              <Link
                href="/calendario"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA] transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendario
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
            </div>
          </div>

          <Link
            href="/admin"
            className="text-xs font-semibold text-[#37312E]/70 hover:text-[#003479] border border-[#EAEAEA] hover:border-[#003479]/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
          >
            {user ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Panel Admin ({user.nombre ? `${user.nombre} • ${user.departamento}` : user.departamento}) →
              </span>
            ) : (
              <span>Panel Admin →</span>
            )}
          </Link>
        </div>

        {/* Mobile sub-nav */}
        <div className="flex sm:hidden border-t border-[#EAEAEA] px-4 py-1.5 bg-[#FBFBFB] overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("crear")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "crear" ? "bg-[#003479] text-white" : "text-[#37312E]/70 bg-white border border-[#EAEAEA]"
            }`}
          >
            Levantar Solicitud
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("consultar")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "consultar" ? "bg-[#003479] text-white" : "text-[#37312E]/70 bg-white border border-[#EAEAEA]"
            }`}
          >
            Consultar Estatus
          </button>
          <Link href="/calendario" className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 bg-white border border-[#EAEAEA] flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Calendario
          </Link>
          <Link href="/admin" className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 bg-white border border-[#EAEAEA]">
            {user ? (user.nombre ? `${user.nombre} (${user.departamento})` : `Admin (${user.departamento})`) : "Admin"}
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in-up">
        {/* Header */}
        <header className="mb-6 text-center">
          <span className="inline-block text-xs uppercase tracking-widest font-semibold text-[#003479] bg-[#003479]/10 px-3 py-1 rounded-full mb-3">
            Mesa de Ayuda TI
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#003479] tracking-tight mb-2">
            {activeTab === "crear" ? "Soporte Técnico" : "Consulta de Solicitud"}
          </h1>
          <p className="text-[#37312E]/60 text-sm max-w-md mx-auto">
            {activeTab === "crear"
              ? "Ingrese los detalles de su solicitud para ser atendida por el equipo correspondiente."
              : "Verifique el estado en tiempo real, dictamen técnico y respuesta de su ticket con su folio."}
          </p>
        </header>

        {/* Tab switch pills */}
        <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-[#EAEAEA]/60 rounded-xl max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("crear")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "crear" ? "bg-white text-[#003479] shadow-xs" : "text-[#37312E]/60 hover:text-[#37312E]"
            }`}
          >
            Levantar Solicitud
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("consultar")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "consultar" ? "bg-white text-[#003479] shadow-xs" : "text-[#37312E]/60 hover:text-[#37312E]"
            }`}
          >
            Consultar Estatus
          </button>
        </div>

        {/* Banner calendario */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#003479]/[0.04] to-[#003479]/[0.09] border border-[#003479]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#003479]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#003479]/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Disponibilidad y Carga Técnica</p>
              <p className="text-[#37312E]/60 text-xs mt-0.5">Consulta fechas y saturación de departamentos antes de enviar tu ticket.</p>
            </div>
          </div>
          <Link
            href="/calendario"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003479] text-white hover:bg-[#00275C] transition-all font-semibold shrink-0 text-xs active:scale-95"
          >
            Ver Calendario →
          </Link>
        </div>

        {/* Modal éxito al registrar */}
        {createdTicketId && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-fade-in-up">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">✓</div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#003479] mb-1">¡Solicitud Generada!</h2>
              <p className="text-xs text-[#37312E]/60 mb-4">Su ticket fue registrado con el folio:</p>
              <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-xl p-4 mb-5">
                <span className="font-mono text-2xl font-bold text-[#003479] tracking-wider block">{createdTicketId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdTicketId)}
                  className="mt-2 text-xs font-semibold text-[#003479] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedFolio ? "✓ Folio Copiado" : "📋 Copiar Folio"}
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const id = createdTicketId;
                    setCreatedTicketId(null);
                    setSearchFolio(id);
                    setActiveTab("consultar");
                    handleDirectLookup(id);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-sm font-medium transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  Consultar Estatus Ahora →
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedTicketId(null)}
                  className="w-full py-2.5 rounded-xl border border-[#EAEAEA] text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F7F8FA] text-sm font-medium transition-colors cursor-pointer"
                >
                  Levantar Otra Solicitud
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──── TAB 1: CREAR TICKET ────────────────────────────────────────── */}
        {activeTab === "crear" ? (
          <section className="bg-white rounded-2xl shadow-xs border border-[#EAEAEA] overflow-hidden">
            <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
              {/* Error global */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {submitError}
                </div>
              )}

              {/* Solicitante + Asunto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-2">
                    Nombre del Solicitante <span className="text-[#CA1224]">*</span>
                  </label>
                  <input
                    type="text"
                    value={solicitante}
                    onChange={(e) => {
                      setSolicitante(e.target.value);
                      if (formErrors.solicitante) setFormErrors((p) => ({ ...p, solicitante: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] focus:outline-none transition-all ${
                      formErrors.solicitante ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"
                    }`}
                    placeholder="Ej. Ana Pérez"
                  />
                  {formErrors.solicitante && <p className="text-xs text-[#CA1224] mt-1.5 font-medium">{formErrors.solicitante}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-2">
                    Asunto del Problema <span className="text-[#CA1224]">*</span>
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => {
                      setAsunto(e.target.value);
                      if (formErrors.asunto) setFormErrors((p) => ({ ...p, asunto: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] focus:outline-none transition-all ${
                      formErrors.asunto ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"
                    }`}
                    placeholder="Ej. No puedo acceder a mi correo"
                  />
                  {formErrors.asunto && <p className="text-xs text-[#CA1224] mt-1.5 font-medium">{formErrors.asunto}</p>}
                </div>
              </div>

              {/* Departamento + Sucursal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-2">
                    Departamento <span className="text-[#CA1224]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={departamento}
                      onChange={(e) => {
                        const newDept = e.target.value as typeof departamento;
                        setDepartamento(newDept);
                        if (newDept !== "Sistemas") {
                          setIp("");
                          if (formErrors.ip) setFormErrors((p) => ({ ...p, ip: undefined }));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all cursor-pointer pr-8"
                    >
                      {DEPARTAMENTOS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#37312E]/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-xs ${dept.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dept.dot}`} />
                    {dept.desc}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-2">Sucursal que emite el ticket</label>
                  <div className="relative">
                    <select
                      value={sucursal}
                      onChange={(e) => {
                        setSucursal(e.target.value);
                        if (e.target.value.toLowerCase() === "chihuahua") setIp("");
                      }}
                      className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all cursor-pointer pr-8"
                    >
                      <option value="Chihuahua">Chihuahua</option>
                      <option value="Juárez">Juárez</option>
                      <option value="Parral">Parral</option>
                      <option value="Monterrey">Monterrey</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#37312E]/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acceso Remoto: Solo si el folio va para el departamento de Sistemas y es foránea */}
              {requiresRemoteAccess && (
                <div className="p-4 rounded-xl border border-[#003479]/20 bg-[#003479]/[0.02] animate-slide-down">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <label className="text-[11px] font-semibold text-[#003479] uppercase tracking-widest">
                      Acceso Remoto / IP <span className="text-[#37312E]/50 font-normal lowercase">(AnyDesk, TeamViewer o IP)</span> <span className="text-[#CA1224]">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-[#003479] bg-[#003479]/10 px-2 py-0.5 rounded-full">
                      Sistemas • Sucursal Foránea ({sucursal})
                    </span>
                  </div>
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => {
                      setIp(e.target.value);
                      if (formErrors.ip) setFormErrors((p) => ({ ...p, ip: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-sm font-mono text-[#37312E] focus:outline-none transition-all ${
                      formErrors.ip ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"
                    }`}
                    placeholder="AnyDesk: 123 456 789 o IP: 192.168.1.100"
                  />
                  {formErrors.ip ? (
                    <p className="text-xs text-[#CA1224] mt-1.5 font-medium">{formErrors.ip}</p>
                  ) : (
                    <p className="text-[11px] text-[#37312E]/50 mt-1.5">ID de AnyDesk, TeamViewer o dirección IP para soporte remoto.</p>
                  )}
                </div>
              )}

              {/* Prioridad (las fechas se gestionan automáticamente / por el administrador) */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-2">Prioridad</label>
                  <div className="relative">
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all cursor-pointer pr-8"
                    >
                      <option value="Baja">Baja (Sin urgencia)</option>
                      <option value="Media">Media (Afecta parcialmente)</option>
                      <option value="Alta">Alta (Crítico / Bloqueo)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#37312E]/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div>
                <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-2">
                  Detalles Adicionales <span className="text-[#CA1224]">*</span>
                </label>
                <textarea
                  value={detalles}
                  onChange={(e) => {
                    setDetalles(e.target.value);
                    if (formErrors.detalles) setFormErrors((p) => ({ ...p, detalles: undefined }));
                  }}
                  className={`w-full px-3.5 py-3 border rounded-xl bg-white text-sm text-[#37312E] focus:outline-none transition-all min-h-[120px] resize-y ${
                    formErrors.detalles ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"
                  }`}
                  placeholder="Por favor proporcione toda la información relevante para que el equipo técnico pueda solucionar el problema..."
                />
                {formErrors.detalles && <p className="text-xs text-[#CA1224] mt-1.5 font-medium">{formErrors.detalles}</p>}
              </div>

              {/* Botón submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#003479] hover:bg-[#00275C] active:scale-[0.99] text-white font-semibold py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Registrando Solicitud...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Registrar Solicitud</span>
                  </>
                )}
              </button>
            </form>
          </section>
        ) : (
          /* ──── TAB 2: CONSULTAR ESTATUS ──────────────────────────────────── */
          <section className="bg-white rounded-2xl shadow-xs border border-[#EAEAEA] overflow-hidden p-5 sm:p-8 space-y-6 animate-fade-in">
            <div>
              <h2 className="text-base font-semibold text-[#003479] mb-1">Rastreo de Ticket por Folio</h2>
              <p className="text-xs text-[#37312E]/60">
                Ingrese el folio otorgado al momento de su solicitud (ej. <span className="font-mono font-bold text-[#003479]">T-1042</span>) o su nombre completo.
              </p>
            </div>

            <form onSubmit={handleConsultSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchFolio}
                  onChange={(e) => setSearchFolio(e.target.value)}
                  placeholder="Ej. T-1042 o Ana Pérez"
                  className="w-full pl-9 pr-4 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all font-mono"
                />
                <svg className="w-4 h-4 text-[#37312E]/40 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Buscando...</span>
                  </>
                ) : (
                  <span>Buscar</span>
                )}
              </button>
            </form>

            {searchError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fade-in">
                <span className="text-sm font-bold text-amber-600">⚠</span>
                <div>
                  <p className="font-semibold">{searchError}</p>
                  <p className="text-amber-700/80 mt-1">
                    Verifique que el folio esté bien escrito o levante una nueva solicitud si aún no la ha creado.
                  </p>
                </div>
              </div>
            )}

            {consultTicket && (
              <div className="border border-[#003479]/20 rounded-2xl bg-[#FBFBFB] p-5 sm:p-6 space-y-4 animate-fade-in shadow-xs">
                {/* Header card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EAEAEA]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-bold text-[#003479] bg-[#003479]/10 px-2.5 py-1 rounded-lg">
                      {consultTicket.id}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityBadge(consultTicket.priority)}`}>
                      Prioridad {consultTicket.priority}
                    </span>
                  </div>

                  {(() => {
                    const badge = statusBadge(consultTicket.status);
                    return (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${badge.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Asunto */}
                <div>
                  <h3 className="text-base font-semibold text-[#003479]">{consultTicket.title}</h3>
                  <p className="text-xs text-[#37312E]/50 mt-0.5">Ingresado: {consultTicket.date}</p>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-white rounded-xl border border-[#EAEAEA] text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#37312E]/50 block">Solicitante</span>
                    <span className="font-medium text-[#37312E]">{consultTicket.user}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#37312E]/50 block">Departamento</span>
                    <span className="font-medium text-[#37312E]">{consultTicket.departamento}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#37312E]/50 block">Sucursal</span>
                    <span className="font-medium text-[#37312E]">{consultTicket.sucursal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#37312E]/50 block">Entrega Estimada</span>
                    <span className="font-medium text-[#37312E]">{consultTicket.fechaEsperada || "Pendiente"}</span>
                  </div>
                </div>

                {/* Problem details */}
                <div className="bg-white p-4 rounded-xl border border-[#EAEAEA] text-xs">
                  <span className="text-[10px] uppercase font-semibold text-[#37312E]/50 block mb-1">Descripción reportada:</span>
                  <p className="text-[#37312E] leading-relaxed whitespace-pre-wrap">{consultTicket.detalles}</p>
                </div>

                {/* Dictamen tecnico */}
                {consultTicket.respuesta ? (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                    <div className="flex items-center gap-1.5 text-[#003479] font-bold uppercase text-[10px] mb-1.5">
                      <span>✓ Dictamen / Solución Técnica:</span>
                    </div>
                    <p className="text-[#37312E] leading-relaxed whitespace-pre-wrap">{consultTicket.respuesta}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 flex items-center gap-2">
                    <span className="text-amber-600 font-bold">ℹ</span>
                    <span>Tu ticket está en espera de dictamen o en proceso de atención por el equipo técnico asignado.</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center text-sm text-[#003479]">Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
