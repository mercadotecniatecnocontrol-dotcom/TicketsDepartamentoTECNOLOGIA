"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { getUsersByDepartment } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import AdminNav from "@/components/AdminNav";

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
  asignadoA?: string;
}

const INITIAL_NEW_TICKET_FORM = {
  user: "", title: "", departamento: "Sistemas", asignadoA: "Kevin", sucursal: "Chihuahua",
  ip: "", priority: "Media", detalles: ""
};

// ──── Helpers ────────────────────────────────────────────────────────────────
const statusLabel = (s: string) => s === "open" ? "Pendiente" : s === "progress" ? "En Progreso" : "Resuelto";
const statusColors = (s: string) => ({
  open: "bg-red-50 text-[#CA1224] border-red-200/60",
  progress: "bg-blue-50 text-[#003479] border-blue-200/60",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
}[s] ?? "");
const statusDot = (s: string) => ({ open: "bg-[#CA1224]", progress: "bg-[#003479]", resolved: "bg-emerald-600" }[s] ?? "bg-zinc-400");
const priorityColors = (p: string) => ({
  Alta: "bg-[#CA1224]/10 text-[#CA1224] border-[#CA1224]/20",
  Media: "bg-orange-50 text-orange-700 border-orange-200/60",
  Baja: "bg-zinc-50 text-zinc-600 border-zinc-200"
}[p] ?? "bg-zinc-50 text-zinc-600 border-zinc-200");

// ──── Loading Spinner ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="w-8 h-8 animate-spin text-[#003479]/30" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");
  const [userDeptInitialized, setUserDeptInitialized] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState("");

  // Inicializar filtro de departamento con el departamento del usuario para que cada departamento vea el suyo
  useEffect(() => {
    if (user?.departamento && !userDeptInitialized) {
      if (user.role === "departamento") {
        setFilterDept(user.departamento);
      }
      setUserDeptInitialized(true);
    }
  }, [user, userDeptInitialized]);

  // Si cambia de usuario activo en la sesión, reajustar filtro
  useEffect(() => {
    if (user?.departamento && user.role === "departamento") {
      setFilterDept(user.departamento);
    }
  }, [user?.id, user?.departamento, user?.role]);
  const [isReplying, setIsReplying] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferDept, setTransferDept] = useState<string>("");
  const [transferAssignees, setTransferAssignees] = useState<string[]>([]);
  const [transferReason, setTransferReason] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  const isAssignedToMe = (ticket: Ticket | null, currentUserName?: string | null): boolean => {
    if (!ticket || !currentUserName) return false;
    const me = currentUserName.trim().toLowerCase();
    const asignados = (ticket.asignadoA || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    return asignados.some(a => a === me || a.includes(me) || me.includes(a));
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [createdFolioAlert, setCreatedFolioAlert] = useState<string | null>(null);
  const [copiedAlertFolio, setCopiedAlertFolio] = useState(false);

  const copyAlertFolio = async (text: string) => {
    let success = false;
    if (typeof window !== "undefined" && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {}
    }
    if (!success && typeof document !== "undefined") {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch {}
    }
    if (success) {
      setCopiedAlertFolio(true);
      setTimeout(() => setCopiedAlertFolio(false), 2000);
    }
  };
  const [newTicketForm, setNewTicketForm] = useState(INITIAL_NEW_TICKET_FORM);
  const [createErrors, setCreateErrors] = useState<{ user?: string; title?: string; detalles?: string; ip?: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ──── Load tickets from API ───────────────────────────────────────────────
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Error cargando tickets");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setApiError("No se pudieron cargar los tickets. Refresca la página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Auto-abrir modal si se navega con ?create=true o ?action=crear
  useEffect(() => {
    if (searchParams.get("create") === "true" || searchParams.get("action") === "crear") {
      setNewTicketForm({ ...INITIAL_NEW_TICKET_FORM });
      setCreateErrors({});
      setIsCreateModalOpen(true);
      // Limpia el parámetro para que no se reabra al refrescar
      router.replace("/admin", { scroll: false });
    }
  }, [searchParams, router]);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    document.body.style.overflow = (isCreateModalOpen || selectedTicket) ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isCreateModalOpen, selectedTicket]);

  // ──── CRUD helpers ────────────────────────────────────────────────────────
  const updateTicketApi = async (updated: Ticket) => {
    const res = await fetch("/api/tickets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error("Error al actualizar");
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (selectedTicket?.id === updated.id) setSelectedTicket(updated);
  };

  const handleStatusChange = async (ticketId: string, newStatus: Ticket["status"]) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    try {
      await updateTicketApi({ ...ticket, status: newStatus });
    } catch { setApiError("Error al cambiar estado."); }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    try {
      await updateTicketApi({ ...ticket, priority: newPriority });
    } catch { setApiError("Error al cambiar prioridad."); }
  };

  // El administrador establece la fecha de resolución (la de inicio se registra al crear el ticket)
  const handleResolutionDateChange = async (ticketId: string, fecha: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    if (fecha && ticket.fechaInicio && fecha < ticket.fechaInicio) {
      setApiError("La fecha de resolución no puede ser anterior a la fecha de inicio.");
      return;
    }
    try {
      await updateTicketApi({ ...ticket, fechaEsperada: fecha });
    } catch { setApiError("Error al guardar la fecha de resolución."); }
  };

  const handleAddResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !respuestaTexto.trim()) return;
    setSaving(true);
    try {
      const updated = { ...selectedTicket, respuesta: respuestaTexto.trim(), status: "progress" as const };
      await updateTicketApi(updated);
      setRespuestaTexto("");
      setIsReplying(false);
    } catch { setApiError("Error al guardar respuesta."); }
    finally { setSaving(false); }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTicket || transferAssignees.length === 0) return;
    setIsSubmittingTransfer(true);
    try {
      const now = new Date();
      const fechaHora = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const nuevoDestinatario = transferAssignees.join(", ");
      const auditNote = `\n\n[🔄 Transferido por ${user?.nombre || "Usuario"} a ${nuevoDestinatario} (${transferDept}) el ${fechaHora}${transferReason.trim() ? `: "${transferReason.trim()}"` : ""}]`;

      const updated: Ticket = {
        ...selectedTicket,
        departamento: transferDept,
        asignadoA: nuevoDestinatario,
        detalles: (selectedTicket.detalles || "") + auditNote,
      };

      await updateTicketApi(updated);
      setIsTransferring(false);
      setTransferSuccessMsg(`Ticket transferido exitosamente a ${nuevoDestinatario}.`);
      setTimeout(() => setTransferSuccessMsg(null), 5000);
    } catch {
      setApiError("No se pudo transferir el ticket.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTicket || !e.target.files) return;
    const files = Array.from(e.target.files);
    const newUrls: string[] = [];

    await Promise.all(files.map(file => new Promise<void>(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") newUrls.push(reader.result);
        resolve();
      };
      reader.readAsDataURL(file);
    })));

    try {
      const updatedEvidencias = [...(selectedTicket.evidencias || []), ...newUrls];
      await updateTicketApi({ ...selectedTicket, evidencias: updatedEvidencias });
    } catch { setApiError("Error al subir imágenes."); }
  };

  const handleDeleteTicket = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("¿Estás seguro de eliminar este ticket del historial?")) return;
    try {
      const res = await fetch(`/api/tickets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTickets(prev => prev.filter(t => t.id !== id));
      if (selectedTicket?.id === id) setSelectedTicket(null);
    } catch { setApiError("Error al eliminar ticket."); }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof createErrors = {};
    if (!newTicketForm.user.trim()) errors.user = "El nombre del solicitante es obligatorio.";
    if (!newTicketForm.title.trim()) errors.title = "El asunto del problema es obligatorio.";
    if (!newTicketForm.detalles.trim()) errors.detalles = "Los detalles son obligatorios.";
    const isForanea = newTicketForm.sucursal.toLowerCase() !== "chihuahua";
    const requiresRemoteAccess = newTicketForm.departamento === "Sistemas" && isForanea;
    if (requiresRemoteAccess && !newTicketForm.ip.trim()) {
      errors.ip = "El acceso remoto es obligatorio para solicitudes a Sistemas en sucursales foráneas.";
    }
    if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }

    setSaving(true);
    try {
      const now = new Date();
      const hora = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const newId = `T-${Date.now().toString().slice(-6)}`;
      const created: Ticket = {
        id: newId,
        title: newTicketForm.title.trim(),
        user: newTicketForm.user.trim(),
        status: "open",
        date: `Hoy, ${hora}`,
        priority: newTicketForm.priority,
        departamento: newTicketForm.departamento,
        sucursal: newTicketForm.sucursal,
        ip: requiresRemoteAccess ? newTicketForm.ip.trim() : "",
        detalles: newTicketForm.detalles.trim(),
        fechaInicio: todayYMD,
        fechaEsperada: "",
        evidencias: [],
        asignadoA: newTicketForm.asignadoA || "",
      };
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(created),
      });
      if (!res.ok) throw new Error();
      setTickets(prev => [created, ...prev]);
      setCreatedFolioAlert(newId);
      setFilterStatus("ALL");
      setSearchTerm("");
      setIsCreateModalOpen(false);
      setNewTicketForm({ ...INITIAL_NEW_TICKET_FORM });
      setCreateErrors({});
    } catch { setApiError("Error al crear el ticket."); }
    finally { setSaving(false); }
  };

  const exportToExcel = () => {
    try {
      const headers = ["ID", "Solicitante", "Asunto", "Estado", "Prioridad", "Departamento", "Sucursal", "IP", "Fecha Ingreso", "Fecha Esperada", "Detalles", "Respuesta"];
      const rows = tickets.map(t => [
        t.id,
        `"${(t.user || "").replace(/"/g, '""')}"`,
        `"${(t.title || "").replace(/"/g, '""')}"`,
        statusLabel(t.status),
        t.priority,
        `"${(t.departamento || "").replace(/"/g, '""')}"`,
        t.sucursal, t.ip,
        `"${(t.date || "").replace(/"/g, '""')}"`,
        t.fechaEsperada,
        `"${(t.detalles || "").replace(/\n/g, " ").replace(/"/g, '""')}"`,
        `"${(t.respuesta || "").replace(/\n/g, " ").replace(/"/g, '""')}"`,
      ].join(","));
      const csv = [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `Reporte_Tickets_${new Date().toISOString().split("T")[0]}.csv`;
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      setExportSuccess(filename);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch { setApiError("Error al exportar."); }
  };

  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      t.id?.toLowerCase().includes(term) ||
      t.user?.toLowerCase().includes(term) ||
      t.title?.toLowerCase().includes(term) ||
      t.departamento?.toLowerCase().includes(term) ||
      t.sucursal?.toLowerCase().includes(term) ||
      (t.asignadoA && t.asignadoA.toLowerCase().includes(term));

    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesDept = filterDept === "ALL" || t.departamento?.toLowerCase() === filterDept.toLowerCase();

    return matchesSearch && matchesStatus && matchesDept;
  });

  const deptScopedTickets = filterDept === "ALL"
    ? tickets
    : tickets.filter(t => t.departamento?.toLowerCase() === filterDept.toLowerCase());

  const counts = {
    total: deptScopedTickets.length,
    open: deptScopedTickets.filter(t => t.status === "open").length,
    progress: deptScopedTickets.filter(t => t.status === "progress").length,
    resolved: deptScopedTickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-16" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Unified Navbar */}
      <AdminNav currentTab="tickets" />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* API Error */}
        {apiError && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {apiError}
            </div>
            <button onClick={() => setApiError(null)} className="text-red-700 hover:text-red-900 cursor-pointer font-bold shrink-0">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
          <div>
            <span className="text-[11px] uppercase tracking-widest font-semibold text-[#003479] bg-[#003479]/10 px-2.5 py-0.5 rounded-full inline-block mb-1.5">Sistema de Tickets</span>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#003479] tracking-tight">Historial de Solicitudes</h1>
            <p className="text-sm text-[#37312E]/60 mt-0.5">Monitoreo, atención técnica y seguimiento a los tickets.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={exportToExcel}
              className={`text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer ${exportSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : "bg-white text-[#37312E] hover:text-[#003479] border border-[#EAEAEA] hover:border-[#003479]/30"}`}
            >
              {exportSuccess ? (
                <><span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span><span>¡Descargado!</span></>
              ) : (
                <><svg className="w-4 h-4 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>Exportar Excel</span></>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setNewTicketForm({ ...INITIAL_NEW_TICKET_FORM }); setCreateErrors({}); setIsCreateModalOpen(true); }}
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              Registrar Solicitud
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-fade-in-up delay-50">
          {[
            { label: "Total Solicitudes", value: counts.total, colorClass: "text-[#003479]", dotClass: "bg-[#003479]", filter: "ALL", hint: "Ver todos" },
            { label: "Pendientes", value: counts.open, colorClass: "text-[#CA1224]", dotClass: "bg-[#CA1224]", filter: "open", hint: "Clic para filtrar" },
            { label: "En Progreso", value: counts.progress, colorClass: "text-blue-700", dotClass: "bg-blue-600", filter: "progress", hint: "Clic para filtrar" },
            { label: "Resueltos", value: counts.resolved, colorClass: "text-emerald-600", dotClass: "bg-emerald-600", filter: "resolved", hint: "Clic para filtrar" },
          ].map(stat => (
            <button
              key={stat.filter}
              type="button"
              onClick={() => setFilterStatus(filterStatus === stat.filter && stat.filter !== "ALL" ? "ALL" : stat.filter)}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer bg-white shadow-sm ${filterStatus === stat.filter ? "border-[#003479] ring-2 ring-[#003479]/15" : "border-[#EAEAEA] hover:border-[#003479]/25 hover:shadow-sm"}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] sm:text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest leading-tight">{stat.label}</p>
                <span className={`w-2 h-2 rounded-full ${stat.dotClass}`} />
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${stat.colorClass}`}>{stat.value}</p>
              <p className="text-[10px] text-[#37312E]/40 mt-1">{stat.hint}</p>
            </button>
          ))}
        </div>

        {/* Success alert */}
        {createdFolioAlert && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">✓</span>
              <div>
                <p className="font-semibold text-sm">¡Solicitud registrada!</p>
                <p className="text-xs text-emerald-700/80 flex items-center gap-2 mt-0.5">
                  <span>Folio: <strong className="font-mono font-bold select-all">{createdFolioAlert}</strong> — estado Pendiente.</span>
                  <button
                    type="button"
                    onClick={() => copyAlertFolio(createdFolioAlert)}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedAlertFolio ? "✓ Copiado" : "📋 Copiar"}
                  </button>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setCreatedFolioAlert(null)} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer shrink-0">✕</button>
          </div>
        )}

        {/* Tabla */}
        <div className="animate-fade-in-up delay-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-[#003479] flex items-center gap-2">
                Solicitudes Registradas
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#003479]/10 text-[#003479] font-bold">{filteredTickets.length}</span>
              </h2>

              {filterDept !== "ALL" && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#003479] flex items-center gap-1.5 border border-blue-200">
                  <span>Depto: <strong>{filterDept}</strong></span>
                  <button
                    type="button"
                    onClick={() => setFilterDept("ALL")}
                    className="hover:text-red-600 font-bold ml-0.5 cursor-pointer text-xs"
                    title="Ver todos los departamentos"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            {/* Acceso rápido a mi departamento */}
            {user?.departamento && filterDept !== user.departamento && (
              <button
                type="button"
                onClick={() => setFilterDept(user.departamento)}
                className="text-xs font-semibold text-[#003479] hover:text-[#00275C] bg-[#003479]/10 hover:bg-[#003479]/15 px-3 py-1.5 rounded-xl border border-[#003479]/20 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs active:scale-95"
              >
                <span>📍 Ver solo mi departamento ({user.departamento})</span>
              </button>
            )}
          </div>

          {/* Filtros por Departamento (Tabs) */}
          <div className="bg-white p-2.5 rounded-xl border border-[#EAEAEA] shadow-xs mb-3 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-[#37312E]/60 whitespace-nowrap px-2 flex items-center gap-1 shrink-0">
              <svg className="w-3.5 h-3.5 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Departamento:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilterDept("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterDept === "ALL"
                  ? "bg-[#003479] text-white shadow-xs"
                  : "bg-[#F7F8FA] hover:bg-zinc-100 text-[#37312E]/70 border border-[#EAEAEA]"
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filterDept === "ALL" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"}`}>
                {tickets.length}
              </span>
            </button>

            {DEPARTAMENTOS.map((d) => {
              const count = tickets.filter((t) => t.departamento?.toLowerCase() === d.toLowerCase()).length;
              const isSelected = filterDept.toLowerCase() === d.toLowerCase();
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFilterDept(isSelected ? "ALL" : d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#003479] text-white shadow-xs"
                      : "bg-[#F7F8FA] hover:bg-zinc-100 text-[#37312E]/70 border border-[#EAEAEA]"
                  }`}
                >
                  <span>{d}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Filter toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-[#EAEAEA] shadow-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, nombre, asunto..."
                className="w-full pl-9 pr-8 py-2 border border-[#EAEAEA] rounded-lg bg-[#F7F8FA] text-sm text-[#37312E] placeholder-[#37312E]/35 focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-colors"
              />
              <svg className="w-4 h-4 text-[#37312E]/35 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} className="absolute right-2.5 top-2.5 text-[#37312E]/35 hover:text-[#37312E] cursor-pointer text-xs">✕</button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-medium text-[#37312E]/50 whitespace-nowrap shrink-0">Estado:</span>
              {[{ id: "ALL", label: "Todos" }, { id: "open", label: "Pendientes" }, { id: "progress", label: "En Progreso" }, { id: "resolved", label: "Resueltos" }].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${filterStatus === f.id ? "bg-[#003479] text-white shadow-sm" : "bg-[#F7F8FA] text-[#37312E]/60 border border-[#EAEAEA] hover:border-[#003479]/25 hover:text-[#003479]"}`}
                >{f.label}</button>
              ))}
              {(filterStatus !== "ALL" || filterDept !== "ALL" || searchTerm) && (
                <button
                  type="button"
                  onClick={() => { setFilterStatus("ALL"); setFilterDept("ALL"); setSearchTerm(""); }}
                  className="text-xs text-[#CA1224] hover:bg-red-50 px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer font-medium"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <section className="bg-white rounded-xl shadow-sm border border-[#EAEAEA] overflow-hidden">
            {loading ? <Spinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#EAEAEA]">
                      <th className="px-4 sm:px-5 py-3.5 text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap">Folio</th>
                      <th className="px-4 sm:px-5 py-3.5 text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap">Solicitante</th>
                      <th className="px-4 sm:px-5 py-3.5 text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Asunto</th>
                      <th className="px-4 sm:px-5 py-3.5 text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Prioridad</th>
                      <th className="px-4 sm:px-5 py-3.5 text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap">Estado</th>
                      <th className="px-4 sm:px-5 py-3.5 text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">Fecha</th>
                      <th className="px-4 sm:px-5 py-3.5 text-right text-[11px] font-semibold text-[#37312E]/60 uppercase tracking-wider whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-14 text-center text-sm text-[#37312E]/40">
                          No se encontraron solicitudes con los filtros aplicados.
                        </td>
                      </tr>
                    ) : filteredTickets.map(ticket => (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="hover:bg-[#003479]/[0.025] transition-colors cursor-pointer group"
                      >
                        <td className="px-4 sm:px-5 py-3.5 font-mono text-xs font-bold text-[#003479] whitespace-nowrap">{ticket.id}</td>
                        <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-[#37312E] text-sm">{ticket.user}</p>
                          {ticket.asignadoA && (
                            <span className="text-[10px] text-[#003479] font-semibold bg-[#003479]/5 px-1.5 py-0.5 rounded border border-[#003479]/10 inline-block mt-0.5">
                              👤 {ticket.asignadoA}
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-[#37312E]/70 text-xs max-w-[220px] truncate hidden md:table-cell">{ticket.title}</td>
                        <td className="px-4 sm:px-5 py-3.5 hidden lg:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${priorityColors(ticket.priority)}`}>{ticket.priority}</span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors(ticket.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(ticket.status)}`} />
                            {statusLabel(ticket.status)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-[#37312E]/50 text-xs whitespace-nowrap hidden xl:table-cell">{ticket.date}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(ticket)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#003479]/10 text-[#003479] hover:bg-[#003479] hover:text-white transition-all cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              <span className="hidden sm:inline">Atender</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTicket(ticket.id, e)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all cursor-pointer"
                              title="Eliminar"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-5 py-3 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#37312E]/50">
              <span>Mostrando {filteredTickets.length} de {tickets.length} solicitudes</span>
              <span className="hidden sm:inline">Haga clic en una fila para atender el ticket</span>
            </div>
          </section>
        </div>
      </main>

      {/* ──── MODAL DETALLE TICKET ──────────────────────────────────────────────── */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedTicket(null); setIsReplying(false); } }}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#EAEAEA] animate-fade-in-up max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#EAEAEA] flex justify-between items-start bg-[#FBFBFB] shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[#003479] font-mono text-xs font-bold bg-[#003479]/10 px-2 py-0.5 rounded">{selectedTicket.id}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityColors(selectedTicket.priority)}`}>Prioridad {selectedTicket.priority}</span>
                </div>
                <h3 className="font-semibold text-[#003479] text-base sm:text-lg tracking-tight leading-snug pr-4">{selectedTicket.title}</h3>
              </div>
              <button type="button" onClick={() => { setSelectedTicket(null); setIsReplying(false); }} className="text-[#37312E]/40 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 transition-colors cursor-pointer shrink-0 text-lg">✕</button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
              {/* Mensaje de éxito al transferir */}
              {transferSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between gap-2 animate-fade-in">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span>✓</span> {transferSuccessMsg}
                  </span>
                  <button type="button" onClick={() => setTransferSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">✕</button>
                </div>
              )}

              {/* SECCIÓN DE TRANSFERENCIA (solo si está activa) */}
              {isTransferring && (
                <div className="bg-gradient-to-br from-amber-50/90 to-amber-50/40 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center text-lg shrink-0">
                        🔀
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          Transferir Solicitud
                        </h4>
                        <p className="text-[11px] text-amber-800/80 mt-0.5">
                          Asignado actualmente a: <strong className="text-amber-950">{selectedTicket.asignadoA || "Todo el equipo"}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTransferring(false)}
                      className="text-amber-700 hover:text-amber-950 text-xs font-bold px-2 py-1 rounded-lg hover:bg-amber-100/50 cursor-pointer"
                    >
                      ✕ Cancelar
                    </button>
                  </div>

                  {/* Selector de Departamento y Usuarios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                        Departamento de Destino
                      </label>
                      <select
                        value={transferDept}
                        onChange={(e) => {
                          const nextDept = e.target.value;
                          setTransferDept(nextDept);
                          const users = getUsersByDepartment(nextDept as any);
                          const otherUsers = users.filter(u => u.nombre.toLowerCase() !== user?.nombre?.toLowerCase());
                          setTransferAssignees(otherUsers.length > 0 ? [otherUsers[0].nombre] : (users.length > 0 ? [users[0].nombre] : []));
                        }}
                        className="w-full px-3 py-2 border border-amber-300/70 rounded-xl bg-white text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-2xs font-medium"
                      >
                        {DEPARTAMENTOS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                          Reasignar a (uno o varios) *
                        </label>
                        {getUsersByDepartment(transferDept as any).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allUsers = getUsersByDepartment(transferDept as any).map(u => u.nombre);
                              if (transferAssignees.length === allUsers.length) {
                                setTransferAssignees([allUsers[0]]);
                              } else {
                                setTransferAssignees(allUsers);
                              }
                            }}
                            className="text-[10px] font-bold text-amber-900 hover:underline cursor-pointer"
                          >
                            {transferAssignees.length === getUsersByDepartment(transferDept as any).length ? "Solo 1" : "Todos"}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getUsersByDepartment(transferDept as any).map(u => {
                          const isSel = transferAssignees.includes(u.nombre);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setTransferAssignees(prev => {
                                  if (prev.includes(u.nombre)) {
                                    if (prev.length <= 1) return prev;
                                    return prev.filter(n => n !== u.nombre);
                                  } else {
                                    return [...prev, u.nombre];
                                  }
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSel
                                  ? "bg-[#003479] text-white shadow-xs"
                                  : "bg-white text-zinc-700 border border-amber-200 hover:bg-amber-100/50"
                              }`}
                            >
                              <span>{u.nombre}</span>
                              <span className="text-[11px]">{isSel ? "✓" : "+"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Motivo o Nota */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Motivo o nota de la transferencia (opcional)
                    </label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="Ej: Asignado por error, corresponde a Erika de Marketing..."
                      className="w-full px-3 py-2 border border-amber-300/70 rounded-xl bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs"
                    />
                  </div>

                  {/* Botones de acción de transferencia */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/70">
                    <button
                      type="button"
                      onClick={() => setIsTransferring(false)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-white cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingTransfer || transferAssignees.length === 0}
                      onClick={handleConfirmTransfer}
                      className="px-4 py-2 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>🔀</span>
                      <span>{isSubmittingTransfer ? "Transfiriendo..." : `Transferir a ${transferAssignees.join(", ")}`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Estado + Prioridad */}
              <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#EAEAEA]">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#37312E]/50 block mb-2">Cambiar Estado:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(["open", "progress", "resolved"] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusChange(selectedTicket.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${selectedTicket.status === s
                            ? s === "open" ? "bg-[#CA1224] text-white shadow-sm" : s === "progress" ? "bg-[#003479] text-white shadow-sm" : "bg-emerald-600 text-white shadow-sm"
                            : s === "open" ? "bg-white text-[#CA1224] border border-[#CA1224]/30 hover:bg-red-50" : s === "progress" ? "bg-white text-[#003479] border border-[#003479]/30 hover:bg-blue-50" : "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          {statusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#37312E]/50 block mb-2">Prioridad:</span>
                    <div className="flex items-center gap-1.5">
                      {["Baja", "Media", "Alta"].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePriorityChange(selectedTicket.id, p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${selectedTicket.priority === p ? "bg-[#37312E] text-white shadow-sm" : "bg-white text-[#37312E]/60 border border-[#EAEAEA] hover:border-[#37312E]/30"}`}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-0.5">Solicitante</p><p className="font-semibold text-[#37312E]">{selectedTicket.user}</p></div>
                <div><p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-0.5">Fecha de Ingreso</p><p className="text-[#37312E] text-xs">{selectedTicket.date}</p></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F7F8FA] rounded-xl border border-[#EAEAEA] text-xs">
                <div><p className="text-[9px] font-semibold text-[#37312E]/40 uppercase tracking-widest mb-0.5">Departamento</p><p className="font-medium text-[#37312E]">{selectedTicket.departamento}</p></div>
                <div><p className="text-[9px] font-semibold text-[#37312E]/40 uppercase tracking-widest mb-0.5">Dirigido a</p><p className="font-bold text-[#003479]">{selectedTicket.asignadoA || "Todo el equipo"}</p></div>
                <div><p className="text-[9px] font-semibold text-[#37312E]/40 uppercase tracking-widest mb-0.5">Sucursal</p><p className="font-medium text-[#37312E]">{selectedTicket.sucursal}</p></div>
                <div><p className="text-[9px] font-semibold text-[#37312E]/40 uppercase tracking-widest mb-0.5">IP / Remoto</p><p className="font-mono text-[#003479] font-medium">{selectedTicket.ip || "Local"}</p></div>
              </div>

              {/* Fechas: inicio automático, resolución establecida por el administrador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F7F8FA] rounded-xl border border-[#EAEAEA] text-xs">
                <div>
                  <p className="text-[9px] font-semibold text-[#37312E]/40 uppercase tracking-widest mb-1">Fecha de Inicio (automática)</p>
                  <p className="font-medium text-[#37312E] font-mono">{selectedTicket.fechaInicio || "—"}</p>
                </div>
                <div>
                  <label htmlFor="fecha-resolucion" className="text-[9px] font-semibold text-[#003479] uppercase tracking-widest mb-1 block">Fecha de Resolución</label>
                  <input
                    id="fecha-resolucion"
                    type="date"
                    value={selectedTicket.fechaEsperada || ""}
                    min={selectedTicket.fechaInicio || undefined}
                    onChange={(e) => handleResolutionDateChange(selectedTicket.id, e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-lg bg-white text-xs text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all cursor-pointer"
                  />
                  {!selectedTicket.fechaEsperada && <p className="text-[10px] text-[#37312E]/50 mt-1">Pendiente de establecer</p>}
                </div>
              </div>

              {/* Detalles */}
              <div>
                <p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-2">Detalles del Problema</p>
                <div className="text-[#37312E] text-xs leading-relaxed whitespace-pre-wrap bg-white border border-[#EAEAEA] p-4 rounded-xl">{selectedTicket.detalles}</div>
              </div>

              {/* Respuesta */}
              {selectedTicket.respuesta && (
                <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-bold text-[#003479] uppercase tracking-wide text-[10px]">Respuesta / Dictamen TI:</p>
                    <button type="button" onClick={() => { setRespuestaTexto(selectedTicket.respuesta || ""); setIsReplying(true); }} className="text-[11px] text-[#003479] hover:underline font-semibold cursor-pointer">Editar</button>
                  </div>
                  <p className="text-[#37312E] leading-relaxed">{selectedTicket.respuesta}</p>
                </div>
              )}

              {/* Form respuesta */}
              {isReplying && (
                <form onSubmit={handleAddResponse} className="space-y-3 bg-[#F7F8FA] p-4 rounded-xl border border-[#003479]/20 animate-fade-in">
                  <label className="block text-[10px] font-bold text-[#003479] uppercase tracking-wider">Respuesta / Dictamen Técnico</label>
                  <textarea
                    required
                    value={respuestaTexto}
                    onChange={(e) => setRespuestaTexto(e.target.value)}
                    rows={3}
                    placeholder="Escriba la solución aplicada o instrucciones para el solicitante..."
                    className="w-full p-3 border border-[#EAEAEA] rounded-xl text-xs text-[#37312E] bg-white focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsReplying(false)} className="px-3.5 py-1.5 rounded-lg border border-[#EAEAEA] text-xs font-medium text-[#37312E]/60 hover:bg-white cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-[#003479] text-white text-xs font-medium hover:bg-[#00275C] cursor-pointer shadow-sm disabled:opacity-60">
                      {saving ? "Guardando..." : "Guardar Dictamen"}
                    </button>
                  </div>
                </form>
              )}

              {/* Evidencias */}
              <div className="pt-2 border-t border-[#EAEAEA]">
                <p className="text-[10px] font-semibold text-[#37312E]/50 uppercase tracking-widest mb-3">Evidencia del Trabajo</p>
                {selectedTicket.evidencias && selectedTicket.evidencias.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {selectedTicket.evidencias.map((img, i) => (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden border border-[#EAEAEA] bg-black/5">
                        <img src={img} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <label className="border-2 border-dashed border-[#EAEAEA] rounded-xl p-4 flex flex-col items-center gap-1.5 hover:bg-[#003479]/[0.02] hover:border-[#003479]/30 transition-colors cursor-pointer group">
                  <svg className="w-5 h-5 text-[#37312E]/25 group-hover:text-[#003479] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-xs text-[#37312E]/50 group-hover:text-[#003479]">Adjuntar fotos de evidencia</p>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FBFBFB] flex justify-between items-center gap-3 shrink-0">
              <button type="button" onClick={() => handleDeleteTicket(selectedTicket.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Eliminar
              </button>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* BOTÓN TRANSFERIR: visible ÚNICAMENTE si la persona asignada es el usuario actual */}
                {isAssignedToMe(selectedTicket, user?.nombre) && !isTransferring && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferring(true);
                      setTransferDept(selectedTicket.departamento);
                      const deptUsers = getUsersByDepartment(selectedTicket.departamento as any);
                      const otherUsers = deptUsers.filter(u => u.nombre.toLowerCase() !== user?.nombre?.toLowerCase());
                      setTransferAssignees(otherUsers.length > 0 ? [otherUsers[0].nombre] : (deptUsers.length > 0 ? [deptUsers[0].nombre] : []));
                      setTransferReason("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Transferir este ticket si te fue asignado por error"
                  >
                    <span>🔀 Transferir Ticket</span>
                  </button>
                )}

                {!isReplying && (
                  <button type="button" onClick={() => { setRespuestaTexto(selectedTicket.respuesta || ""); setIsReplying(true); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003479] bg-white border border-[#003479]/25 px-4 py-2 rounded-xl hover:bg-[#003479]/5 transition-colors cursor-pointer shadow-sm">
                    💬 {selectedTicket.respuesta ? "Editar Dictamen" : "Responder"}
                  </button>
                )}
                <button type="button" onClick={() => { setSelectedTicket(null); setIsReplying(false); setIsTransferring(false); }} className="text-xs font-semibold text-white bg-[#003479] hover:bg-[#00275C] px-5 py-2 rounded-xl transition-all cursor-pointer shadow-sm">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL CREAR SOLICITUD ──────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#EAEAEA] animate-fade-in-up max-h-[90vh] flex flex-col my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EAEAEA] flex justify-between items-center bg-[#FBFBFB] shrink-0">
              <div>
                <h3 className="font-semibold text-[#003479] text-base">Registrar Nueva Solicitud</h3>
                <p className="text-xs text-[#37312E]/50 mt-0.5">Alta directa de ticket en el sistema</p>
              </div>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-[#37312E]/40 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-1.5">Nombre Solicitante <span className="text-[#CA1224]">*</span></label>
                    <input type="text" value={newTicketForm.user} onChange={(e) => { setNewTicketForm(p => ({ ...p, user: e.target.value })); if (createErrors.user) setCreateErrors(p => ({ ...p, user: undefined })); }} placeholder="Ej. Juan Pérez" className={`w-full px-3 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] focus:outline-none transition-all ${createErrors.user ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"}`} />
                    {createErrors.user && <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{createErrors.user}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-1.5">Asunto del Problema <span className="text-[#CA1224]">*</span></label>
                    <input type="text" value={newTicketForm.title} onChange={(e) => { setNewTicketForm(p => ({ ...p, title: e.target.value })); if (createErrors.title) setCreateErrors(p => ({ ...p, title: undefined })); }} placeholder="Ej. Falla en impresora" className={`w-full px-3 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] focus:outline-none transition-all ${createErrors.title ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"}`} />
                    {createErrors.title && <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{createErrors.title}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-1.5">Departamento <span className="text-[#CA1224]">*</span></label>
                    <div className="relative">
                      <select
                        value={newTicketForm.departamento}
                        onChange={(e) => {
                          const d = e.target.value;
                          const users = getUsersByDepartment(d as any);
                          const firstUser = users.length > 0 ? users[0].nombre : "";
                          setNewTicketForm(p => ({
                            ...p,
                            departamento: d,
                            asignadoA: firstUser,
                            ...(d !== "Sistemas" ? { ip: "" } : {})
                          }));
                          if (d !== "Sistemas" && createErrors.ip) {
                            setCreateErrors(p => ({ ...p, ip: undefined }));
                          }
                        }}
                        className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all cursor-pointer pr-8"
                      >
                        {DEPARTAMENTOS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#37312E]/40"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-1.5">Sucursal que emite el ticket</label>
                    <div className="relative">
                      <select
                        value={newTicketForm.sucursal}
                        onChange={(e) => {
                          const s = e.target.value;
                          setNewTicketForm(p => ({
                            ...p,
                            sucursal: s,
                            ...(s.toLowerCase() === "chihuahua" ? { ip: "" } : {})
                          }));
                          if (s.toLowerCase() === "chihuahua" && createErrors.ip) {
                            setCreateErrors(p => ({ ...p, ip: undefined }));
                          }
                        }}
                        className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all cursor-pointer pr-8"
                      >
                        <option value="Chihuahua">Chihuahua</option>
                        <option value="Juárez">Juárez</option>
                        <option value="Parral">Parral</option>
                        <option value="Monterrey">Monterrey</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#37312E]/40"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                  </div>
                </div>

                {/* Dirigido a */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#003479] uppercase tracking-wider block">
                        Dirigido a (Personal de {newTicketForm.departamento}) *
                      </label>
                      <p className="text-[10px] text-zinc-500">Selecciona uno o varios encargados</p>
                    </div>
                    {getUsersByDepartment(newTicketForm.departamento as any).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allUsers = getUsersByDepartment(newTicketForm.departamento as any).map(u => u.nombre);
                          const current = (newTicketForm.asignadoA || "").split(",").map(s => s.trim()).filter(Boolean);
                          if (current.length === allUsers.length) {
                            setNewTicketForm(p => ({ ...p, asignadoA: allUsers[0] }));
                          } else {
                            setNewTicketForm(p => ({ ...p, asignadoA: allUsers.join(", ") }));
                          }
                        }}
                        className="text-[10px] font-bold text-[#003479] hover:underline cursor-pointer"
                      >
                        {(newTicketForm.asignadoA || "").split(",").map(s => s.trim()).filter(Boolean).length === getUsersByDepartment(newTicketForm.departamento as any).length
                          ? "Elegir solo 1"
                          : "Seleccionar todos"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getUsersByDepartment(newTicketForm.departamento as any).map((u) => {
                      const currentAssignees = (newTicketForm.asignadoA || "")
                        .split(",")
                        .map(s => s.trim())
                        .filter(Boolean);
                      const sel = currentAssignees.includes(u.nombre);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            let updated: string[];
                            if (sel) {
                              if (currentAssignees.length <= 1) return;
                              updated = currentAssignees.filter(n => n !== u.nombre);
                            } else {
                              updated = [...currentAssignees, u.nombre];
                            }
                            setNewTicketForm(p => ({ ...p, asignadoA: updated.join(", ") }));
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                            sel ? "border-[#003479] bg-white ring-1 ring-[#003479] shadow-xs" : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${sel ? "bg-[#003479] text-white" : "bg-[#003479]/10 text-[#003479]"}`}>
                            {u.nombre.charAt(0)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-xs font-bold truncate ${sel ? "text-[#003479]" : "text-zinc-800"}`}>{u.nombre}</p>
                              <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                sel ? "bg-[#003479] text-white" : "border border-zinc-300 text-transparent"
                              }`}>✓</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 truncate">{u.cargo}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {newTicketForm.departamento === "Sistemas" && newTicketForm.sucursal.toLowerCase() !== "chihuahua" && (
                  <div className="p-3.5 rounded-xl border border-[#003479]/20 bg-[#003479]/[0.02] animate-slide-down space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-semibold text-[#003479] uppercase tracking-widest">
                        Acceso Remoto / IP <span className="text-[#CA1224]">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-[#003479] bg-[#003479]/10 px-2 py-0.5 rounded-full">
                        Sistemas • Sucursal Foránea ({newTicketForm.sucursal})
                      </span>
                    </div>
                    <input
                      type="text"
                      value={newTicketForm.ip}
                      onChange={(e) => {
                        setNewTicketForm(p => ({ ...p, ip: e.target.value }));
                        if (createErrors.ip) setCreateErrors(p => ({ ...p, ip: undefined }));
                      }}
                      placeholder="AnyDesk: 123 456 789 o IP: 192.168.1.45"
                      className={`w-full px-3 py-2 border rounded-xl bg-white text-sm font-mono focus:outline-none transition-all ${
                        createErrors.ip ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"
                      }`}
                    />
                    {createErrors.ip && <p className="text-[11px] text-[#CA1224] font-medium">{createErrors.ip}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-1.5">Prioridad</label>
                    <div className="relative">
                      <select value={newTicketForm.priority} onChange={(e) => setNewTicketForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479] transition-all cursor-pointer pr-8">
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#37312E]/40"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#37312E]/70 uppercase tracking-widest mb-1.5">Detalles del Problema <span className="text-[#CA1224]">*</span></label>
                  <textarea rows={3} value={newTicketForm.detalles} onChange={(e) => { setNewTicketForm(p => ({ ...p, detalles: e.target.value })); if (createErrors.detalles) setCreateErrors(p => ({ ...p, detalles: undefined })); }} placeholder="Describa el problema con información relevante..." className={`w-full px-3 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] focus:outline-none transition-all resize-none ${createErrors.detalles ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10"}`} />
                  {createErrors.detalles && <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{createErrors.detalles}</p>}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl border border-[#EAEAEA] text-xs font-semibold text-[#37312E]/60 hover:bg-white cursor-pointer transition-all">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-xs font-semibold shadow-md cursor-pointer flex items-center gap-2 transition-all disabled:opacity-60">
                  {saving ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Registrando...</> : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>Registrar Solicitud</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast export */}
      {exportSuccess && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-[#003479] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-fade-in-up">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">✓</div>
          <div>
            <p className="text-xs font-semibold">Reporte descargado</p>
            <p className="text-[11px] text-white/70 font-mono mt-0.5">{exportSuccess}</p>
          </div>
          <button type="button" onClick={() => setExportSuccess(null)} className="text-white/50 hover:text-white text-xs cursor-pointer p-1 ml-1">✕</button>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  );
}
