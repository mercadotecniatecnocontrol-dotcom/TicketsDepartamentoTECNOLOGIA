"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
  fechaEsperada: string;
  respuesta?: string;
  evidencias?: string[];
}

const INITIAL_MOCK_TICKETS: Ticket[] = [
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

const INITIAL_NEW_TICKET_FORM = {
  user: "",
  title: "",
  departamento: "Soporte de TI",
  sucursal: "Chihuahua",
  ip: "",
  priority: "Media",
  fechaEsperada: "",
  detalles: ""
};

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [createdFolioAlert, setCreatedFolioAlert] = useState<string | null>(null);
  const [newTicketForm, setNewTicketForm] = useState(INITIAL_NEW_TICKET_FORM);
  const [createErrors, setCreateErrors] = useState<{ user?: string; title?: string; detalles?: string; ip?: string }>({});

  const handleOpenCreateModal = () => {
    setNewTicketForm({ ...INITIAL_NEW_TICKET_FORM });
    setCreateErrors({});
    setIsCreateModalOpen(true);
  };

  // Prevent background scroll when any modal is open
  useEffect(() => {
    if (isCreateModalOpen || selectedTicket) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCreateModalOpen, selectedTicket]);

  const sanitizeTicket = (t: any, index: number): Ticket => ({
    id: t.id || `T-${1040 + index}`,
    title: t.title || "Sin Asunto",
    user: t.user || "Usuario Anónimo",
    status: ["open", "progress", "resolved"].includes(t.status) ? t.status : "open",
    date: t.date || "Hoy",
    priority: t.priority || "Media",
    departamento: t.departamento || "Soporte de TI",
    sucursal: t.sucursal || "Chihuahua",
    ip: t.ip || "",
    detalles: t.detalles || "",
    fechaEsperada: t.fechaEsperada || "",
    respuesta: t.respuesta || "",
    evidencias: Array.isArray(t.evidencias) ? t.evidencias : []
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tecnocontrol_tickets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTickets(parsed.map(sanitizeTicket));
        } else {
          setTickets(INITIAL_MOCK_TICKETS);
        }
      } else {
        localStorage.setItem("tecnocontrol_tickets", JSON.stringify(INITIAL_MOCK_TICKETS));
      }
    } catch (e) {
      console.error(e);
      setTickets(INITIAL_MOCK_TICKETS);
    }
  }, []);

  const saveTickets = (updated: Ticket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem("tecnocontrol_tickets", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: "open" | "progress" | "resolved") => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
    saveTickets(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const handlePriorityChange = (ticketId: string, newPriority: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, priority: newPriority } : t);
    saveTickets(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, priority: newPriority });
    }
  };

  const handleAddResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !respuestaTexto.trim()) return;

    const updated = tickets.map(t =>
      t.id === selectedTicket.id
        ? { ...t, respuesta: respuestaTexto.trim(), status: "progress" as const }
        : t
    );
    saveTickets(updated);
    setSelectedTicket({ ...selectedTicket, respuesta: respuestaTexto.trim(), status: "progress" });
    setRespuestaTexto("");
    setIsReplying(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTicket || !e.target.files) return;

    const files = Array.from(e.target.files);
    const newUrls: string[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          newUrls.push(reader.result);
          if (newUrls.length === files.length) {
            const currentEvidencias = selectedTicket.evidencias || [];
            const updatedEvidencias = [...currentEvidencias, ...newUrls];
            const updated = tickets.map(t => t.id === selectedTicket.id ? { ...t, evidencias: updatedEvidencias } : t);
            saveTickets(updated);
            setSelectedTicket({ ...selectedTicket, evidencias: updatedEvidencias });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteTicket = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este ticket del historial?")) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);
      if (selectedTicket?.id === id) setSelectedTicket(null);
    }
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { user?: string; title?: string; detalles?: string; ip?: string } = {};
    if (!newTicketForm.user.trim()) errors.user = "El nombre del solicitante es obligatorio.";
    if (!newTicketForm.title.trim()) errors.title = "El asunto del problema es obligatorio.";
    if (!newTicketForm.detalles.trim()) errors.detalles = "Los detalles son obligatorios.";
    const isForanea = newTicketForm.sucursal.trim().toLowerCase() !== "chihuahua";
    if (isForanea && !newTicketForm.ip.trim()) {
      errors.ip = "El acceso remoto (AnyDesk, TeamViewer o IP) es obligatorio para sucursales foráneas.";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    const now = new Date();
    const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `T-${Math.floor(1043 + Math.random() * 1000)}`;
    const created: Ticket = {
      id: newId,
      title: newTicketForm.title.trim(),
      user: newTicketForm.user.trim(),
      status: "open",
      date: `Hoy, ${hora}`,
      priority: newTicketForm.priority,
      departamento: newTicketForm.departamento,
      sucursal: newTicketForm.sucursal,
      ip: isForanea ? newTicketForm.ip.trim() : "",
      detalles: newTicketForm.detalles.trim(),
      fechaEsperada: newTicketForm.fechaEsperada || now.toISOString().split("T")[0],
      evidencias: []
    };

    const updated = [created, ...tickets];
    saveTickets(updated);
    setCreatedFolioAlert(newId);
    setFilterStatus("ALL");
    setSearchTerm("");
    setIsCreateModalOpen(false);
    setNewTicketForm({ ...INITIAL_NEW_TICKET_FORM });
    setCreateErrors({});
  };

  const exportToExcel = () => {
    try {
      const headers = ["ID", "Solicitante", "Asunto", "Estado", "Prioridad", "Departamento", "Sucursal", "IP", "Fecha Ingreso", "Fecha Esperada", "Detalles", "Respuesta"];
      const csvRows = [headers.join(",")];

      tickets.forEach(ticket => {
        const statusText = ticket.status === 'open' ? 'Pendiente' : ticket.status === 'progress' ? 'En Progreso' : 'Resuelto';
        const row = [
          ticket.id,
          `"${(ticket.user || "").replace(/"/g, '""')}"`,
          `"${(ticket.title || "").replace(/"/g, '""')}"`,
          statusText,
          ticket.priority,
          `"${(ticket.departamento || "").replace(/"/g, '""')}"`,
          ticket.sucursal,
          ticket.ip,
          `"${(ticket.date || "").replace(/"/g, '""')}"`,
          ticket.fechaEsperada,
          `"${(ticket.detalles || "").replace(/\n/g, ' ').replace(/"/g, '""')}"`,
          `"${(ticket.respuesta || "").replace(/\n/g, ' ').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Reporte_Tickets_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);

      setExportSuccess(filename);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error("Error al exportar:", err);
    }
  };

  // Filtered list
  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (t.id || "").toLowerCase().includes(term) ||
      (t.user || "").toLowerCase().includes(term) ||
      (t.title || "").toLowerCase().includes(term) ||
      (t.departamento || "").toLowerCase().includes(term) ||
      (t.sucursal || "").toLowerCase().includes(term);

    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendientesCount = tickets.filter(t => t.status === "open").length;
  const progresoCount = tickets.filter(t => t.status === "progress").length;
  const resueltosCount = tickets.filter(t => t.status === "resolved").length;
  const totalCount = tickets.length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#003479]/20 selection:text-[#003479] pb-16">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-[#EAEAEA] bg-white/95 backdrop-blur-xl animate-fade-in-up shadow-xs">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <img src="/logotecno.png" alt="Tecnocontrol Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <span className="font-semibold text-[#003479] text-base tracking-tight hidden sm:inline-block">Tecnocontrol TI</span>
            </div>

            {/* Desktop Nav Pills */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/admin"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#003479] text-white shadow-xs transition-all"
              >
                Historial de Tickets
              </Link>
              <Link
                href="/admin/computadoras"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#37312E]/70 hover:text-[#003479] hover:bg-[#FAFAFA] border border-transparent hover:border-[#EAEAEA] transition-all"
              >
                Entrada de Computadoras
              </Link>
              <Link
                href="/admin/telefonos"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#37312E]/70 hover:text-[#003479] hover:bg-[#FAFAFA] border border-transparent hover:border-[#EAEAEA] transition-all"
              >
                Entrada de Teléfonos
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-[#37312E]/70 hover:text-[#003479] bg-[#FAFAFA] hover:bg-[#EAEAEA]/50 border border-[#EAEAEA] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-4 h-4 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Portal de Usuarios</span>
            </Link>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-[#EAEAEA] px-6 py-2 bg-[#FBFBFB] overflow-x-auto gap-2">
          <Link
            href="/admin"
            className="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#003479] text-white"
          >
            Historial
          </Link>
          <Link
            href="/admin/computadoras"
            className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 hover:text-[#003479] bg-white border border-[#EAEAEA]"
          >
            Computadoras
          </Link>
          <Link
            href="/admin/telefonos"
            className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 hover:text-[#003479] bg-white border border-[#EAEAEA]"
          >
            Teléfonos
          </Link>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-8 sm:py-10">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#003479] bg-[#003479]/10 px-2.5 py-0.5 rounded-full">
                Mesa de Ayuda
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#003479] tracking-tight">
              Historial de Solicitudes y Tickets
            </h1>
            <p className="text-sm text-[#37312E]/70 mt-1">
              Monitoreo, atención técnica y seguimiento a los tickets de soporte del personal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportToExcel}
              className={`text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98 ${exportSuccess
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                : "bg-white text-[#37312E] hover:text-[#003479] border border-[#EAEAEA] hover:border-[#003479]/30"
                }`}
            >
              {exportSuccess ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>¡Descargando Excel!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar a Excel</span>
                </>
              )}
            </button>

            {/* BOTÓN NUEVA SOLICITUD DESDE ADMIN */}
            <button
              type="button"
              id="btn-registrar-solicitud-admin"
              onClick={handleOpenCreateModal}
              className="text-xs sm:text-sm font-medium px-4 sm:px-5 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Solicitud</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Stats Grid (Clickable Filters) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up delay-100">
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === "open" ? "ALL" : "open")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterStatus === "open"
              ? "border-[#CA1224] ring-2 ring-[#CA1224]/30 bg-red-50/20"
              : "border-[#EAEAEA] hover:border-[#CA1224]/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Pendientes</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#CA1224]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#CA1224]">{pendientesCount}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar pendientes</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === "progress" ? "ALL" : "progress")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterStatus === "progress"
              ? "border-[#003479] ring-2 ring-[#003479]/30 bg-blue-50/20"
              : "border-[#EAEAEA] hover:border-[#003479]/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">En Progreso</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#003479]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#003479]">{progresoCount}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar en atención</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === "resolved" ? "ALL" : "resolved")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterStatus === "resolved"
              ? "border-emerald-600 ring-2 ring-emerald-600/30 bg-emerald-50/20"
              : "border-[#EAEAEA] hover:border-emerald-600/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Resueltos</p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-emerald-600">{resueltosCount}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar solucionados</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterStatus === "ALL" && !searchTerm
              ? "border-[#003479] ring-2 ring-[#003479]/20"
              : "border-[#EAEAEA] hover:border-[#003479]/30 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Total Solicitudes</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#37312E]/40"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#37312E]">{totalCount}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Ver todos los registros</p>
          </button>
        </div>

        {/* Success Alert al crear folio */}
        {createdFolioAlert && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✓
              </span>
              <div>
                <h3 className="font-semibold text-sm">¡Solicitud registrada correctamente!</h3>
                <p className="text-xs text-emerald-700/80">
                  Se generó el ticket con folio <span className="font-mono font-bold">{createdFolioAlert}</span> y está disponible en la lista con estatus Pendiente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedFolioAlert(null)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold px-2 py-1 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Search & Filters Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-[#EAEAEA] shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up delay-100">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Folio, Solicitante, Asunto..."
              className="w-full pl-10 pr-9 py-2 border border-[#EAEAEA] rounded-lg bg-[#FAFAFA] text-sm text-[#37312E] placeholder-[#37312E]/40 focus:outline-none focus:border-[#003479] transition-colors"
            />
            <svg className="w-4 h-4 text-[#37312E]/40 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-[#37312E]/40 hover:text-[#37312E] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-[#37312E]/60 whitespace-nowrap">Filtrar:</span>
            {[
              { id: "ALL", label: "Todos" },
              { id: "open", label: "Pendientes" },
              { id: "progress", label: "En Progreso" },
              { id: "resolved", label: "Resueltos" }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${filterStatus === f.id
                  ? "bg-[#003479] text-white shadow-xs"
                  : "bg-[#FAFAFA] text-[#37312E]/70 border border-[#EAEAEA] hover:border-[#003479]/30 hover:text-[#003479]"
                  }`}
              >
                {f.label}
              </button>
            ))}

            {(filterStatus !== "ALL" || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setSearchTerm("");
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#CA1224] hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                title="Limpiar filtros activos"
              >
                <span>✕ Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        <section className="bg-white rounded-xl shadow-xs border border-[#EAEAEA] overflow-hidden animate-fade-in-up delay-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#EAEAEA]">
                  <th className="px-6 py-4 font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-4 font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Solicitante</th>
                  <th className="px-6 py-4 font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Asunto</th>
                  <th className="px-6 py-4 font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Prioridad</th>
                  <th className="px-6 py-4 font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-right font-semibold text-[#37312E]/70 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#37312E]/50">
                      No se encontraron solicitudes con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="hover:bg-[#003479]/[0.03] transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-[#003479] font-mono text-xs font-bold">{ticket.id}</td>
                      <td className="px-6 py-4 font-medium text-[#37312E]">{ticket.user}</td>
                      <td className="px-6 py-4 text-[#37312E]/80 max-w-[280px] truncate">{ticket.title}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md border ${ticket.priority === 'Alta' ? 'bg-[#CA1224]/10 text-[#CA1224] border-[#CA1224]/20' :
                          ticket.priority === 'Media' ? 'bg-orange-50 text-orange-700 border-orange-200/60' :
                            'bg-[#37312E]/5 text-[#37312E]/70 border-[#37312E]/10'
                          }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ticket.status === 'open' ? 'bg-red-50 text-[#CA1224] border-red-200/60' :
                          ticket.status === 'progress' ? 'bg-blue-50 text-[#003479] border-blue-200/60' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'open' ? 'bg-[#CA1224]' :
                            ticket.status === 'progress' ? 'bg-[#003479]' :
                              'bg-emerald-600'
                            }`}></span>
                          <span>
                            {ticket.status === 'open' ? 'Pendiente' : ticket.status === 'resolved' ? 'Resuelto' : 'En Progreso'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#37312E]/60 text-xs">{ticket.date}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#003479]/10 text-[#003479] hover:bg-[#003479] hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Atender</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTicket(ticket.id, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Eliminar este ticket"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#37312E]/60">
            <span>Mostrando {filteredTickets.length} de {tickets.length} solicitudes</span>
            <span>Haga clic en una fila para ver el detalle y actualizar estado</span>
          </div>
        </section>
      </main>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTicket(null);
              setIsReplying(false);
            }
          }}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[#EAEAEA] animate-fade-in-up max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-[#EAEAEA] flex justify-between items-start bg-[#FBFBFB]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#003479] font-mono text-xs font-bold bg-[#003479]/10 px-2 py-0.5 rounded">
                    {selectedTicket.id}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${selectedTicket.priority === 'Alta' ? 'bg-[#CA1224]/10 text-[#CA1224]' :
                    selectedTicket.priority === 'Media' ? 'bg-orange-50 text-orange-700' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                    Prioridad {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="font-semibold text-[#003479] text-xl tracking-tight">{selectedTicket.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTicket(null);
                  setIsReplying(false);
                }}
                className="text-[#37312E]/50 hover:text-[#37312E] p-2 rounded-lg hover:bg-[#EAEAEA]/50 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 overflow-y-auto space-y-6">

              {/* Status & Priority Switcher Toolbar */}
              <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#37312E]/60 block mb-1.5">Cambiar Estado:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, "open")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${selectedTicket.status === "open"
                        ? "bg-[#CA1224] text-white shadow-xs"
                        : "bg-white text-[#CA1224] border border-[#CA1224]/30 hover:bg-[#CA1224]/10"
                        }`}
                    >
                      ● Pendiente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, "progress")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${selectedTicket.status === "progress"
                        ? "bg-[#003479] text-white shadow-xs"
                        : "bg-white text-[#003479] border border-[#003479]/30 hover:bg-[#003479]/10"
                        }`}
                    >
                      ● En Progreso
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${selectedTicket.status === "resolved"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                        }`}
                    >
                      ✓ Resuelto
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#37312E]/60 block mb-1.5">Prioridad:</span>
                  <div className="flex items-center gap-1.5">
                    {["Baja", "Media", "Alta"].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePriorityChange(selectedTicket.id, p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${selectedTicket.priority === p
                          ? "bg-[#37312E] text-white shadow-xs font-semibold"
                          : "bg-white text-[#37312E]/70 border border-[#EAEAEA] hover:border-[#37312E]/30"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <p className="font-semibold text-[#37312E]/60 uppercase tracking-widest mb-1">Solicitante</p>
                  <p className="font-semibold text-[#37312E] text-sm">{selectedTicket.user}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#37312E]/60 uppercase tracking-widest mb-1">Fecha de Ingreso</p>
                  <p className="text-[#37312E]">{selectedTicket.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-0.5">Departamento</p>
                  <p className="font-medium text-[#37312E]">{selectedTicket.departamento}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-0.5">Sucursal</p>
                  <p className="font-medium text-[#37312E]">{selectedTicket.sucursal}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-0.5">IP Remota</p>
                  <p className="font-mono text-[#003479] font-medium">{selectedTicket.ip || "Local"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest mb-2">Detalles del Problema</p>
                <div className="text-[#37312E] text-xs leading-relaxed whitespace-pre-wrap bg-white border border-[#EAEAEA] p-4 rounded-xl">
                  {selectedTicket.detalles}
                </div>
              </div>

              {/* Respuesta o Solución Técnica */}
              {selectedTicket.respuesta && (
                <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-[#003479] uppercase tracking-wider">Respuesta / Dictamen de TI:</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRespuestaTexto(selectedTicket.respuesta || "");
                        setIsReplying(true);
                      }}
                      className="text-[11px] text-[#003479] hover:underline font-semibold cursor-pointer"
                    >
                      Editar Respuesta
                    </button>
                  </div>
                  <p className="text-[#37312E] leading-relaxed">{selectedTicket.respuesta}</p>
                </div>
              )}

              {/* Formulario de Respuesta Rápida */}
              {isReplying && (
                <form onSubmit={handleAddResponse} className="space-y-3 pt-2 bg-[#FAFAFA] p-4 rounded-xl border border-[#003479]/20 animate-fade-in">
                  <label className="block text-xs font-bold text-[#003479] uppercase tracking-wider">
                    Escribir Respuesta o Dictamen Técnico
                  </label>
                  <textarea
                    required
                    value={respuestaTexto}
                    onChange={(e) => setRespuestaTexto(e.target.value)}
                    rows={3}
                    placeholder="Escriba la solución aplicada o instrucciones para el solicitante..."
                    className="w-full p-3 border border-[#EAEAEA] rounded-xl text-xs text-[#37312E] bg-white focus:outline-none focus:border-[#003479]"
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReplying(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#EAEAEA] text-xs font-medium text-[#37312E]/70 hover:bg-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#003479] text-white text-xs font-medium hover:bg-[#00275C] cursor-pointer shadow-xs"
                    >
                      Guardar Dictamen
                    </button>
                  </div>
                </form>
              )}

              {/* Evidencia Fotográfica */}
              <div className="pt-2 border-t border-[#EAEAEA]">
                <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest mb-3">Evidencia del Trabajo (Fotos / Capturas)</p>

                {selectedTicket.evidencias && selectedTicket.evidencias.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {selectedTicket.evidencias.map((imgUrl, i) => (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden border border-[#EAEAEA] bg-black/5 relative group">
                        <img src={imgUrl} alt="Evidencia" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <label className="border-2 border-dashed border-[#EAEAEA] rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 hover:bg-[#003479]/[0.02] hover:border-[#003479]/30 transition-colors cursor-pointer group">
                  <svg className="w-6 h-6 text-[#37312E]/30 group-hover:text-[#003479] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-xs font-medium text-[#37312E]/70 group-hover:text-[#003479]">Haga clic para adjuntar fotos de evidencia</p>
                  <p className="text-[10px] text-[#37312E]/40">PNG o JPG</p>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-[#EAEAEA] bg-[#FBFBFB] flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Eliminar Ticket</span>
              </button>

              <div className="flex gap-2">
                {!isReplying && (
                  <button
                    type="button"
                    onClick={() => {
                      setRespuestaTexto(selectedTicket.respuesta || "");
                      setIsReplying(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003479] bg-white border border-[#003479]/30 px-4 py-2 rounded-xl hover:bg-[#003479]/5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>💬 {selectedTicket.respuesta ? "Editar Dictamen" : "Responder Ticket"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicket(null);
                    setIsReplying(false);
                  }}
                  className="text-xs font-semibold text-white bg-[#003479] hover:bg-[#00275C] px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVA SOLICITUD DESDE EL PANEL DE ADMIN */}
      {isCreateModalOpen && (
        <div
          id="modal-crear-solicitud-backdrop"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-[#EAEAEA] animate-fade-in-up max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 sm:px-8 py-5 border-b border-[#EAEAEA] flex justify-between items-center bg-[#FBFBFB] shrink-0">
              <div>
                <h3 className="font-semibold text-[#003479] text-lg">Registrar Nueva Solicitud</h3>
                <p className="text-xs text-[#37312E]/60">Alta directa de ticket en el sistema</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#37312E]/50 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                      Solicitante <span className="text-[#CA1224]">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTicketForm.user}
                      onChange={(e) => {
                        setNewTicketForm({ ...newTicketForm, user: e.target.value });
                        if (createErrors.user) setCreateErrors({ ...createErrors, user: undefined });
                      }}
                      placeholder="Ej. Juan Pérez"
                      className={`w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none ${createErrors.user ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479]"
                        }`}
                    />
                    {createErrors.user && <p className="text-[11px] text-[#CA1224] mt-1">{createErrors.user}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                      Asunto <span className="text-[#CA1224]">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTicketForm.title}
                      onChange={(e) => {
                        setNewTicketForm({ ...newTicketForm, title: e.target.value });
                        if (createErrors.title) setCreateErrors({ ...createErrors, title: undefined });
                      }}
                      placeholder="Ej. Falla en impresora"
                      className={`w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none ${createErrors.title ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479]"
                        }`}
                    />
                    {createErrors.title && <p className="text-[11px] text-[#CA1224] mt-1">{createErrors.title}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Departamento</label>
                    <select
                      value={newTicketForm.departamento}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, departamento: e.target.value })}
                      className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm focus:outline-none focus:border-[#003479]"
                    >
                      <option value="Soporte de TI">Soporte de TI</option>
                      <option value="Mantenimiento de Instalaciones">Mantenimiento de Instalaciones</option>
                      <option value="Recursos Humanos">Recursos Humanos</option>
                      <option value="Operaciones">Operaciones</option>
                      <option value="Almacén">Almacén</option>
                      <option value="Facturación">Facturación</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Sucursal</label>
                    <select
                      value={newTicketForm.sucursal}
                      onChange={(e) => {
                        const suc = e.target.value;
                        setNewTicketForm({
                          ...newTicketForm,
                          sucursal: suc,
                          ...(suc.trim().toLowerCase() === "chihuahua" ? { ip: "" } : {})
                        });
                        if (createErrors.ip) setCreateErrors({ ...createErrors, ip: undefined });
                      }}
                      className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm focus:outline-none focus:border-[#003479]"
                    >
                      <option value="Chihuahua">Chihuahua</option>
                      <option value="Juárez">Juárez</option>
                      <option value="Parral">Parral</option>
                      <option value="Monterrey">Monterrey</option>
                    </select>
                  </div>
                </div>

                {/* Si es foránea, mostrar campo de acceso remoto / IP */}
                {newTicketForm.sucursal.trim().toLowerCase() !== "chihuahua" && (
                  <div className="p-4 rounded-xl border border-[#003479]/20 bg-[#003479]/[0.02] animate-fade-in space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-[#003479] uppercase tracking-widest">
                        Acceso Remoto / Dirección IP <span className="text-[#CA1224]">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-[#003479] bg-[#003479]/10 px-2.5 py-0.5 rounded-full">
                        Sucursal Foránea ({newTicketForm.sucursal})
                      </span>
                    </div>
                    <input
                      type="text"
                      value={newTicketForm.ip}
                      onChange={(e) => {
                        setNewTicketForm({ ...newTicketForm, ip: e.target.value });
                        if (createErrors.ip) setCreateErrors({ ...createErrors, ip: undefined });
                      }}
                      placeholder="Ej. AnyDesk: 123 456 789 o IP: 192.168.1.45"
                      className={`w-full px-3 py-2 border rounded-lg bg-white text-sm font-mono focus:outline-none ${createErrors.ip ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479]"
                        }`}
                    />
                    {createErrors.ip ? (
                      <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{createErrors.ip}</p>
                    ) : (
                      <p className="text-[11px] text-[#37312E]/60">
                        ID de AnyDesk, TeamViewer o dirección IP requerida para conexión remota a sucursales foráneas.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Prioridad</label>
                    <select
                      value={newTicketForm.priority}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm focus:outline-none focus:border-[#003479]"
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Fecha Esperada</label>
                    <input
                      type="date"
                      value={newTicketForm.fechaEsperada}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, fechaEsperada: e.target.value })}
                      className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm focus:outline-none focus:border-[#003479]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                    Detalles del Problema <span className="text-[#CA1224]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newTicketForm.detalles}
                    onChange={(e) => {
                      setNewTicketForm({ ...newTicketForm, detalles: e.target.value });
                      if (createErrors.detalles) setCreateErrors({ ...createErrors, detalles: undefined });
                    }}
                    placeholder="Describa el problema reportado..."
                    className={`w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none ${createErrors.detalles ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479]"
                      }`}
                  ></textarea>
                  {createErrors.detalles && <p className="text-[11px] text-[#CA1224] mt-1">{createErrors.detalles}</p>}
                </div>
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAEAEA] text-xs font-medium text-[#37312E]/70 hover:bg-white cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-xs font-medium shadow-md cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Registrar Solicitud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Download Toast */}
      {exportSuccess && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-[#003479] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-fade-in-up">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ✓
          </div>
          <div>
            <p className="text-xs font-semibold">Reporte Excel descargado</p>
            <p className="text-[11px] text-white/80 font-mono mt-0.5">{exportSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccess(null)}
            className="text-white/60 hover:text-white ml-2 text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
