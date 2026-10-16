"use client";

import Link from "next/link";
import { useState } from "react";

const INITIAL_MOCK_TICKETS = [
  {
    id: "T-1042",
    title: "No puedo acceder al correo corporativo",
    user: "Ana Pérez",
    status: "open",
    date: "Hoy, 09:30",
    priority: "Alta",
    departamento: "Soporte de TI",
    sucursal: "Chihuahua",
    ip: "",
    detalles: "Me aparece error de contraseña incorrecta aunque estoy segura de que está bien escrita. Necesito acceder para enviar un reporte urgente.",
    fechaEsperada: "2026-10-08"
  },
  {
    id: "T-1041",
    title: "Falla de conectividad en sala B",
    user: "Carlos Ruiz",
    status: "progress",
    date: "Hoy, 11:20",
    priority: "Media",
    departamento: "Soporte de TI",
    sucursal: "Juárez",
    ip: "192.168.1.45",
    detalles: "El proyector no se conecta a la red de invitados y tenemos presentación a las 2 PM.",
    fechaEsperada: "2026-10-09"
  },
  {
    id: "T-1040",
    title: "Reemplazo de equipo de cómputo",
    user: "María Gómez",
    status: "resolved",
    date: "Ayer",
    priority: "Baja",
    departamento: "Recursos Humanos",
    sucursal: "Monterrey",
    ip: "192.168.5.10",
    detalles: "El equipo actual está muy lento y el teclado falla. Solicitud pre-aprobada por gerencia.",
    fechaEsperada: "2026-10-15"
  },
  {
    id: "T-1039",
    title: "Mantenimiento de aire acondicionado",
    user: "Luis Torres",
    status: "open",
    date: "Hace 2 días",
    priority: "Media",
    departamento: "Mantenimiento de Instalaciones",
    sucursal: "Parral",
    ip: "",
    detalles: "El aire de la oficina principal hace mucho ruido y no enfría lo suficiente.",
    fechaEsperada: "2026-10-10"
  },
];

export default function UserDashboard() {
  const [solicitante, setSolicitante] = useState("");
  const [asunto, setAsunto] = useState("");
  const [departamento, setDepartamento] = useState("Soporte de TI");
  const [sucursal, setSucursal] = useState("Chihuahua");
  const [ip, setIp] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [fechaEsperada, setFechaEsperada] = useState("");
  const [detalles, setDetalles] = useState("");

  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ solicitante?: string; asunto?: string; detalles?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { solicitante?: string; asunto?: string; detalles?: string } = {};

    if (!solicitante.trim()) {
      errors.solicitante = "Por favor ingrese el nombre del solicitante.";
    }
    if (!asunto.trim()) {
      errors.asunto = "Por favor especifique el asunto del problema.";
    }
    if (!detalles.trim()) {
      errors.detalles = "Por favor detalle la información de la solicitud.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    const now = new Date();
    const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `T-${Math.floor(1043 + Math.random() * 100)}`;

    const newTicket = {
      id: newId,
      title: asunto.trim(),
      user: solicitante.trim(),
      status: "open",
      date: `Hoy, ${hora}`,
      priority: prioridad,
      departamento,
      sucursal,
      ip: sucursal !== "Chihuahua" ? ip.trim() : "",
      detalles: detalles.trim(),
      fechaEsperada: fechaEsperada || now.toISOString().split("T")[0]
    };

    // Save to localStorage so admin sees it immediately
    try {
      const existing = localStorage.getItem("tecnocontrol_tickets");
      const list = existing ? JSON.parse(existing) : INITIAL_MOCK_TICKETS;
      const updated = [newTicket, ...list];
      localStorage.setItem("tecnocontrol_tickets", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setCreatedTicketId(newId);
    setIsSubmitting(false);

    // Reset Form
    setSolicitante("");
    setAsunto("");
    setDetalles("");
    setIp("");
    setFechaEsperada("");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#003479]/20 selection:text-[#003479]">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#EAEAEA] bg-white/80 backdrop-blur-xl animate-fade-in-up">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logotecno.png" alt="Tecnocontrol Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <span className="font-semibold text-[#003479] text-base tracking-tight hidden sm:inline-block">Tecnocontrol TI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs font-semibold text-[#003479] bg-[#003479]/10 hover:bg-[#003479] hover:text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Panel Administrativo →</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16 animate-fade-in-up delay-100">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-[#003479] tracking-tight mb-3">
            Soporte Técnico
          </h1>
          <p className="text-[#37312E]/70 text-sm">Ingrese los detalles de su solicitud para ser atendida por el equipo de TI.</p>
        </header>

        {/* Modal de Ticket Creado Exitosamente */}
        {createdTicketId && (
          <div className="fixed inset-0 z-50 bg-[#37312E]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-md p-8 text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-semibold text-[#003479] mb-1">¡Solicitud Generada con Éxito!</h2>
              <p className="text-xs text-[#37312E]/70 mb-4">Su ticket ha sido registrado en el sistema con el folio:</p>

              <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl p-4 mb-6">
                <span className="font-mono text-2xl font-bold text-[#003479] tracking-wider">{createdTicketId}</span>
                <p className="text-[11px] text-[#37312E]/50 mt-1">Guarde este folio para consultar el estatus de su solicitud</p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreatedTicketId(null)}
                  className="w-full py-3 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-sm font-medium transition-all shadow-sm cursor-pointer"
                >
                  Levantar Otra Solicitud
                </button>
                <Link
                  href="/admin"
                  className="w-full py-2.5 rounded-xl border border-[#EAEAEA] text-[#37312E]/70 hover:text-[#003479] hover:bg-[#FAFAFA] text-sm font-medium transition-colors"
                >
                  Ir al Panel de Administración →
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#EAEAEA] overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group/input">
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">
                  Nombre del Solicitante <span className="text-[#CA1224]">*</span>
                </label>
                <input
                  type="text"
                  value={solicitante}
                  onChange={(e) => {
                    setSolicitante(e.target.value);
                    if (formErrors.solicitante) setFormErrors(prev => ({ ...prev, solicitante: undefined }));
                  }}
                  className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors text-[#37312E] placeholder-[#37312E]/40 text-base ${
                    formErrors.solicitante ? "border-[#CA1224]" : "border-[#EAEAEA] focus:border-[#003479]"
                  }`}
                  placeholder="Ej. Ana Pérez"
                />
                {formErrors.solicitante && (
                  <p className="text-xs text-[#CA1224] mt-1 font-medium">{formErrors.solicitante}</p>
                )}
              </div>

              <div className="group/input">
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">
                  Asunto del Problema <span className="text-[#CA1224]">*</span>
                </label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => {
                    setAsunto(e.target.value);
                    if (formErrors.asunto) setFormErrors(prev => ({ ...prev, asunto: undefined }));
                  }}
                  className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors text-[#37312E] placeholder-[#37312E]/40 text-base ${
                    formErrors.asunto ? "border-[#CA1224]" : "border-[#EAEAEA] focus:border-[#003479]"
                  }`}
                  placeholder="Ej. No puedo acceder a mi correo"
                />
                {formErrors.asunto && (
                  <p className="text-xs text-[#CA1224] mt-1 font-medium">{formErrors.asunto}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group/input">
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">Departamento</label>
                <div className="relative">
                  <select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="w-full px-0 py-2 border-b border-[#EAEAEA] bg-transparent focus:outline-none focus:border-[#003479] transition-colors text-[#37312E] appearance-none cursor-pointer text-base"
                  >
                    <option value="Soporte de TI">Soporte de TI</option>
                    <option value="Mantenimiento de Instalaciones">Mantenimiento de Instalaciones</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Almacén">Almacén</option>
                    <option value="Facturación">Facturación</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#37312E]/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="group/input">
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">Sucursal</label>
                <div className="relative">
                  <select
                    value={sucursal}
                    onChange={(e) => {
                      const selectedSuc = e.target.value;
                      setSucursal(selectedSuc);
                      if (selectedSuc.trim().toLowerCase() === "chihuahua") {
                        setIp("");
                      }
                    }}
                    className="w-full px-0 py-2 border-b border-[#EAEAEA] bg-transparent focus:outline-none focus:border-[#003479] transition-colors text-[#37312E] appearance-none cursor-pointer text-base"
                  >
                    <option value="Chihuahua">Chihuahua</option>
                    <option value="Juárez">Juárez</option>
                    <option value="Parral">Parral</option>
                    <option value="Monterrey">Monterrey</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#37312E]/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {sucursal.trim().toLowerCase() !== "chihuahua" && (
              <div className="group/input animate-fade-in p-4 rounded-xl border border-[#003479]/20 bg-[#003479]/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#003479] uppercase tracking-widest">
                    Acceso Remoto / Dirección IP <span className="text-[#37312E]/50 font-normal lowercase">(AnyDesk, TeamViewer o IP)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#003479] bg-[#003479]/10 px-2.5 py-0.5 rounded-full">
                    Sucursal Foránea ({sucursal})
                  </span>
                </div>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-lg bg-white focus:outline-none focus:border-[#003479] transition-colors text-[#37312E] placeholder-[#37312E]/40 text-sm font-mono"
                  placeholder="Ej. AnyDesk: 123 456 789 o IP: 192.168.1.100"
                />
                <p className="text-[11px] text-[#37312E]/60 mt-1.5">
                  Proporcione el ID de AnyDesk, TeamViewer o dirección IP para que el equipo de TI pueda atender la solicitud de forma remota.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group/input">
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">Nivel de Prioridad</label>
                <div className="relative">
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full px-0 py-2 border-b border-[#EAEAEA] bg-transparent focus:outline-none focus:border-[#003479] transition-colors text-[#37312E] appearance-none cursor-pointer text-base"
                  >
                    <option value="Baja">Baja (Sin urgencia)</option>
                    <option value="Media">Media (Afecta parcialmente)</option>
                    <option value="Alta">Alta (Crítico / Bloqueo total)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#37312E]/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="group/input">
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">Fecha de resolución esperada</label>
                <input
                  type="date"
                  value={fechaEsperada}
                  onChange={(e) => setFechaEsperada(e.target.value)}
                  className="w-full px-0 py-2 border-b border-[#EAEAEA] bg-transparent focus:outline-none focus:border-[#003479] transition-colors text-[#37312E] text-base cursor-text"
                />
              </div>
            </div>

            <div className="group/input">
              <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-3">
                Detalles Adicionales <span className="text-[#CA1224]">*</span>
              </label>
              <textarea
                value={detalles}
                onChange={(e) => {
                  setDetalles(e.target.value);
                  if (formErrors.detalles) setFormErrors(prev => ({ ...prev, detalles: undefined }));
                }}
                className={`w-full px-4 py-3 border rounded-lg bg-transparent focus:outline-none transition-colors text-[#37312E] placeholder-[#37312E]/40 min-h-[140px] resize-y text-base ${
                  formErrors.detalles ? "border-[#CA1224] bg-red-50/10" : "border-[#EAEAEA] focus:border-[#003479]"
                }`}
                placeholder="Por favor proporcione toda la información relevante para que el equipo técnico pueda solucionar el problema..."
              ></textarea>
              {formErrors.detalles && (
                <p className="text-xs text-[#CA1224] mt-1 font-medium">{formErrors.detalles}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#003479] hover:bg-[#00275C] active:scale-[0.99] text-white font-medium py-3.5 rounded-lg transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>{isSubmitting ? "Registrando..." : "Registrar Solicitud"}</span>
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
