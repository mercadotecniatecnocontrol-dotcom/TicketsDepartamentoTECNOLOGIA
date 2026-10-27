"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canManageInventory } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

interface Telefono {
  id: string;
  usuario: string;
  departamento: string;
  numero: string;
  marca: string;
  modelo: string;
  imei: string;
  observaciones: "NUEVO" | "USADO" | "EN REPARACIÓN" | "BAJA";
}

const INITIAL_TELEFONOS: Telefono[] = [
  {
    id: "TEL-1",
    usuario: "GARDEA GIRON OMAR RICARDO",
    departamento: "CHIHUAHUA ALMACEN",
    numero: "6143849069",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195292272",
    observaciones: "NUEVO"
  },
  {
    id: "TEL-2",
    usuario: "SOTO GARCIA CRUZ FRANCISCO",
    departamento: "ALMACEN",
    numero: "6142504774",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195286316",
    observaciones: "NUEVO"
  },
  {
    id: "TEL-3",
    usuario: "CONTRERAS NIDIA",
    departamento: "ABASTECIMIENTO- ALMACEN",
    numero: "6141635895",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195288973",
    observaciones: "NUEVO"
  },
  {
    id: "TEL-4",
    usuario: "BLANCO MUÑOZ CRISTINA LIZETH",
    departamento: "GESTORIA",
    numero: "6144545125",
    marca: "IPHONE",
    modelo: "11",
    imei: "353979106874991",
    observaciones: "USADO"
  },
  {
    id: "TEL-5",
    usuario: "CANO CORRAL HECCTOR ADRIAN",
    departamento: "OPERACIONES",
    numero: "6143429806",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195291324",
    observaciones: "NUEVO"
  },
  {
    id: "TEL-6",
    usuario: "ESCALANTE JARAMILLO ANA KAREN",
    departamento: "GESTORIA",
    numero: "6145941097",
    marca: "SAMSUNG",
    modelo: "A10S",
    imei: "357079102388363",
    observaciones: "USADO"
  },
  {
    id: "TEL-7",
    usuario: "JAIME RUEL LUNA ESPINOZA",
    departamento: "OPERACIONES",
    numero: "6142781803",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "337443195283602",
    observaciones: "NUEVO"
  },
  {
    id: "TEL-8",
    usuario: "SAUL ISMAEL BARRAZA LUYA",
    departamento: "OPERACIONES",
    numero: "6141568460",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195291274",
    observaciones: "NUEVO"
  },
  {
    id: "TEL-9",
    usuario: "EVA ALEJANDRA ESPINOZA",
    departamento: "FACTURACION",
    numero: "6141414198",
    marca: "OUKITEL",
    modelo: "G1",
    imei: "354964201551933",
    observaciones: "USADO"
  },
  {
    id: "TEL-10",
    usuario: "KENIA GUZMAN",
    departamento: "GESTORIA",
    numero: "6142567708",
    marca: "OUKITEL",
    modelo: "G1",
    imei: "354964201157939",
    observaciones: "USADO"
  },
  {
    id: "TEL-11",
    usuario: "SERGIO CARMONA LAGUNA",
    departamento: "OPERACIONES",
    numero: "6143499380",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195283487",
    observaciones: "USADO"
  },
  {
    id: "TEL-12",
    usuario: "Josue Hernandez Prieto",
    departamento: "OPERACIONES",
    numero: "6141918610",
    marca: "SAMSUNG",
    modelo: "A57 5G",
    imei: "357443195267258",
    observaciones: "NUEVO"
  }
];

const INITIAL_FORM_DATA: Omit<Telefono, "id"> = {
  usuario: "",
  departamento: "OPERACIONES",
  numero: "",
  marca: "SAMSUNG",
  modelo: "A57 5G",
  imei: "",
  observaciones: "NUEVO"
};

export default function TelefonosDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirigir si no tiene permisos de inventario
  useEffect(() => {
    if (!authLoading && user && !canManageInventory(user.departamento)) {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  const [telefonos, setTelefonos] = useState<Telefono[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterObservacion, setFilterObservacion] = useState<string>("ALL");
  const [filterDepto, setFilterDepto] = useState<string>("ALL");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedTelefono, setSelectedTelefono] = useState<Telefono | null>(null);
  const [editingTelefono, setEditingTelefono] = useState<Telefono | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<string>("" );
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ usuario?: string; numero?: string; imei?: string }>({});
  const [formData, setFormData] = useState<Omit<Telefono, "id">>(INITIAL_FORM_DATA);

  // ─── APERTURA DE MODAL DE REGISTRO DE TELÉFONOS ──────────
  const handleOpenRegisterModal = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setFormErrors({});
    setIsRegisterModalOpen(true);
  };

  // Prevent background scroll when any modal is open
  useEffect(() => {
    if (isRegisterModalOpen || selectedTelefono || editingTelefono) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isRegisterModalOpen, selectedTelefono, editingTelefono]);

  const sanitizeTelefono = (t: Record<string, unknown>, index: number): Telefono => ({
    id: t?.id ? String(t.id) : `TEL-${100 + index}`,
    usuario: String(t?.usuario || "SIN ASIGNAR").toUpperCase(),
    departamento: String(t?.departamento || "GENERAL").toUpperCase(),
    numero: String(t?.numero || ""),
    marca: String(t?.marca || "SAMSUNG").toUpperCase(),
    modelo: String(t?.modelo || "").toUpperCase(),
    imei: String(t?.imei || ""),
    observaciones: typeof t?.observaciones === "string" && ["NUEVO", "USADO", "EN REPARACIÓN", "BAJA"].includes(t.observaciones)
      ? (t.observaciones as Telefono["observaciones"])
      : "NUEVO"
  });

  // Load from API & check query params
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/telefonos");
        if (!res.ok) throw new Error("Error cargando teléfonos");
        const data = await res.json();
        setTelefonos(Array.isArray(data) ? data.map((item: Record<string, unknown>, idx: number) => sanitizeTelefono(item, idx)) : INITIAL_TELEFONOS);
      } catch (e) {
        console.error(e);
        setApiError("No se pudo cargar el inventario de teléfonos. Mostrando datos locales.");
        setTelefonos(INITIAL_TELEFONOS);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Auto-abrir modal si se navega con ?register=true o ?action=registrar
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("register") === "true" || params.get("action") === "registrar") {
        setTimeout(() => handleOpenRegisterModal(), 100);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { usuario?: string; numero?: string; imei?: string } = {};
    if (!formData.usuario.trim()) {
      errors.usuario = "El nombre del usuario o colaborador es obligatorio.";
    }
    const cleanNum = formData.numero.trim();
    if (!cleanNum || cleanNum.length < 4) {
      errors.numero = "Ingrese un número telefónico o extensión válido (mínimo 4 dígitos).";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newTelefono: Telefono = {
      id: `TEL-${Date.now().toString().slice(-4)}`,
      usuario: formData.usuario.trim().toUpperCase(),
      departamento: (formData.departamento.trim() || "GENERAL").toUpperCase(),
      numero: cleanNum,
      marca: formData.marca.trim().toUpperCase(),
      modelo: formData.modelo.trim().toUpperCase() || "GENÉRICO",
      imei: formData.imei.trim() || "PENDIENTE",
      observaciones: formData.observaciones
    };

    setSaving(true);
    try {
      const res = await fetch("/api/telefonos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTelefono),
      });
      if (!res.ok) throw new Error("Error al registrar teléfono");
      setTelefonos(prev => [newTelefono, ...prev]);
      setLastRegistered(`${newTelefono.usuario} (${newTelefono.numero})`);
      setShowSuccessAlert(true);
      setFilterObservacion("ALL");
      setFilterDepto("ALL");
      setSearchTerm("");
      setIsRegisterModalOpen(false);
      setFormData({ ...INITIAL_FORM_DATA });
      setFormErrors({});
    } catch {
      setApiError("Error al registrar el teléfono. Intente de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTelefono) return;

    const cleanNum = (editingTelefono.numero || "").trim();
    const updatedTel: Telefono = {
      ...editingTelefono,
      usuario: (editingTelefono.usuario || "").trim().toUpperCase(),
      departamento: ((editingTelefono.departamento || "").trim() || "GENERAL").toUpperCase(),
      numero: cleanNum || editingTelefono.numero,
      marca: (editingTelefono.marca || "").trim().toUpperCase(),
      modelo: (editingTelefono.modelo || "").trim().toUpperCase(),
      imei: (editingTelefono.imei || "").trim() || "PENDIENTE",
    };

    setSaving(true);
    try {
      const res = await fetch("/api/telefonos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTel),
      });
      if (!res.ok) throw new Error("Error al actualizar teléfono");
      setTelefonos(prev => prev.map(t => t.id === updatedTel.id ? updatedTel : t));
      if (selectedTelefono?.id === updatedTel.id) {
        setSelectedTelefono(updatedTel);
      }
      setEditingTelefono(null);
    } catch {
      setApiError("Error al actualizar el teléfono.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("¿Estás seguro de eliminar este registro telefónico del inventario?")) return;
    try {
      const res = await fetch(`/api/telefonos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setTelefonos(prev => prev.filter(item => item.id !== id));
      if (selectedTelefono?.id === id) setSelectedTelefono(null);
      if (editingTelefono?.id === id) setEditingTelefono(null);
    } catch {
      setApiError("Error al eliminar el teléfono del servidor.");
    }
  };


  const exportToExcel = () => {
    try {
      const headers = [
        "ID",
        "USUARIO",
        "DEPARTAMENTO",
        "NUMERO",
        "MARCA",
        "MODELO",
        "IMEI",
        "OBSERVACIONES"
      ];

      const csvRows = [headers.join(",")];

      telefonos.forEach(item => {
        const row = [
          `"${(item.id || "").replace(/"/g, '""')}"`,
          `"${(item.usuario || "").replace(/"/g, '""')}"`,
          `"${(item.departamento || "").replace(/"/g, '""')}"`,
          `"${(item.numero || "").replace(/"/g, '""')}"`,
          `"${(item.marca || "").replace(/"/g, '""')}"`,
          `"${(item.modelo || "").replace(/"/g, '""')}"`,
          `"${(item.imei || "").replace(/"/g, '""')}"`,
          `"${(item.observaciones || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Inventario_Telefonos_${new Date().toISOString().split("T")[0]}.csv`;
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

  const departamentosUnicos = Array.from(
    new Set(telefonos.map(t => String(t.departamento || "GENERAL").trim()).filter(Boolean))
  ).sort();

  const filteredTelefonos = telefonos.filter(item => {
    const term = searchTerm.toLowerCase().trim();
    const numStr = String(item.numero || "").toLowerCase();
    const imeiStr = String(item.imei || "").toLowerCase();
    const userStr = String(item.usuario || "").toLowerCase();
    const modelStr = String(item.modelo || "").toLowerCase();
    const deptoStr = String(item.departamento || "").toLowerCase();

    const matchesSearch =
      !term ||
      userStr.includes(term) ||
      numStr.includes(term) ||
      modelStr.includes(term) ||
      imeiStr.includes(term) ||
      deptoStr.includes(term);

    const matchesObservacion = filterObservacion === "ALL" || item.observaciones === filterObservacion;
    const matchesDepto = filterDepto === "ALL" || item.departamento === filterDepto;

    return matchesSearch && matchesObservacion && matchesDepto;
  });

  const totalTelefonos = telefonos.length;
  const nuevos = telefonos.filter(t => t.observaciones === "NUEVO").length;
  const usados = telefonos.filter(t => t.observaciones === "USADO").length;
  const departamentosCount = departamentosUnicos.length;

  if (!authLoading && user && !canManageInventory(user.departamento)) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl border border-[#EAEAEA] shadow-md max-w-sm">
          <p className="text-sm font-semibold text-[#003479]">Acceso restringido</p>
          <p className="text-xs text-[#37312E]/60 mt-1">
            El departamento de {user.departamento} no tiene acceso a Teléfonos. Redirigiendo al panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-16" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Unified Navbar */}
      <AdminNav currentTab="telefonos" />

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

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#003479] bg-[#003479]/10 px-2.5 py-0.5 rounded-full">
                Inventario de Telefonía Móvil
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#003479] tracking-tight">
              Entrada de Teléfonos
            </h1>
            <p className="text-sm text-[#37312E]/70 mt-1">
              Control de líneas corporativas, asignaciones a usuarios, modelos e IMEI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportToExcel}
              className={`text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98 ${
                exportSuccess
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

            {/* BOTÓN PRINCIPAL PARA ABRIR MODAL */}
            <button
              type="button"
              id="btn-registrar-telefono-header"
              onClick={handleOpenRegisterModal}
              className="text-xs sm:text-sm font-medium px-4 sm:px-5 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Teléfono</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Stats Grid (Clickable Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in-up delay-100">
          <button
            type="button"
            onClick={() => {
              setFilterObservacion("ALL");
              setFilterDepto("ALL");
            }}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${
              filterObservacion === "ALL" && filterDepto === "ALL" && !searchTerm
                ? "border-[#003479] ring-2 ring-[#003479]/20"
                : "border-[#EAEAEA] hover:border-[#003479]/30 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Total Líneas</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#003479]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#003479]">{totalTelefonos}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Ver todas las líneas</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterObservacion(filterObservacion === "NUEVO" ? "ALL" : "NUEVO")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${
              filterObservacion === "NUEVO"
                ? "border-emerald-600 ring-2 ring-emerald-600/30 bg-emerald-50/20"
                : "border-[#EAEAEA] hover:border-emerald-600/40 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Equipos Nuevos</p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-emerald-600">{nuevos}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar nuevos</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterObservacion(filterObservacion === "USADO" ? "ALL" : "USADO")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${
              filterObservacion === "USADO"
                ? "border-amber-600 ring-2 ring-amber-600/30 bg-amber-50/20"
                : "border-[#EAEAEA] hover:border-amber-600/40 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Equipos Usados</p>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-amber-600">{usados}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar usados</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterDepto(filterDepto === "ALL" ? departamentosUnicos[0] || "ALL" : "ALL")}
            className="p-5 rounded-xl border border-[#EAEAEA] hover:border-[#37312E]/30 text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs hover:shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Departamentos</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#37312E]/40"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#37312E]">{departamentosCount}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Áreas con líneas asignadas</p>
          </button>
        </div>

        {/* Success Alert */}
        {showSuccessAlert && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <p className="font-semibold text-sm">¡Teléfono registrado correctamente!</p>
                <p className="text-xs text-emerald-800">El dispositivo de <span className="font-bold">{lastRegistered}</span> ya aparece en la lista de abajo.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessAlert(false)}
              className="text-emerald-700 hover:text-emerald-950 p-1.5 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* TABLA DE INVENTARIO REGISTRADO */}
        <div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-[#003479] flex items-center gap-2">
              <span>Inventario Registrado</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#003479]/10 text-[#003479] font-bold">
                {filteredTelefonos.length} teléfonos
              </span>
            </h2>

            <button
              type="button"
              id="btn-anadir-telefono-tabla"
              onClick={handleOpenRegisterModal}
              className="text-xs font-semibold text-[#003479] bg-[#003479]/10 hover:bg-[#003479] hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Teléfono</span>
            </button>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-[#EAEAEA] shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Usuario, Teléfono, Modelo o IMEI..."
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

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-medium text-[#37312E]/60">Condición:</span>
              {[
                { id: "ALL", label: "Todos" },
                { id: "NUEVO", label: "Nuevos" },
                { id: "USADO", label: "Usados" },
                { id: "EN REPARACIÓN", label: "En Reparación" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterObservacion(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                    filterObservacion === f.id
                      ? "bg-[#003479] text-white shadow-xs"
                      : "bg-[#FAFAFA] text-[#37312E]/70 border border-[#EAEAEA] hover:border-[#003479]/30 hover:text-[#003479]"
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <div className="relative">
                <select
                  value={filterDepto}
                  onChange={(e) => setFilterDepto(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAFAFA] text-[#37312E] border border-[#EAEAEA] focus:outline-none focus:border-[#003479] cursor-pointer"
                >
                  <option value="ALL">Todos Deptos</option>
                  {departamentosUnicos.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {(filterObservacion !== "ALL" || filterDepto !== "ALL" || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterObservacion("ALL");
                    setFilterDepto("ALL");
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

          {/* Table */}
          <section className="bg-white rounded-xl shadow-xs border border-[#EAEAEA] overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#EAEAEA] font-semibold text-[#37312E]/70 uppercase tracking-wider">
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Usuario (Titular)</th>
                    <th className="px-5 py-3.5">Departamento</th>
                    <th className="px-5 py-3.5">Número Telefónico</th>
                    <th className="px-5 py-3.5">Marca</th>
                    <th className="px-5 py-3.5">Modelo</th>
                    <th className="px-5 py-3.5">IMEI</th>
                    <th className="px-5 py-3.5">Observaciones</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {filteredTelefonos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-[#37312E]/60">
                        <p className="mb-3 font-medium">No se encontraron teléfonos o líneas registrados con los criterios seleccionados.</p>
                        <div className="flex items-center justify-center gap-3">
                          {(filterObservacion !== "ALL" || filterDepto !== "ALL" || searchTerm) && (
                            <button
                              type="button"
                              onClick={() => {
                                setFilterObservacion("ALL");
                                setFilterDepto("ALL");
                                setSearchTerm("");
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#003479] bg-[#003479]/10 hover:bg-[#003479]/20 transition-all cursor-pointer"
                            >
                              Ver todas las líneas
                            </button>
                          )}
                          <button
                            type="button"
                            id="btn-anadir-telefono-empty"
                            onClick={handleOpenRegisterModal}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#003479] hover:bg-[#00275C] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Registrar Nuevo Teléfono</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTelefonos.map((tel) => {
                      const isNuevo = tel.observaciones === "NUEVO";
                      const isUsado = tel.observaciones === "USADO";

                      return (
                        <tr
                          key={tel.id}
                          onClick={() => setSelectedTelefono(tel)}
                          className={`transition-colors cursor-pointer group hover:bg-[#003479]/[0.03] ${
                            isNuevo ? "bg-emerald-50/15" : isUsado ? "bg-amber-50/15" : ""
                          }`}
                        >
                          <td className="px-5 py-3.5 font-mono text-[11px] text-[#37312E]/60 font-semibold">{tel.id}</td>
                          <td className="px-5 py-3.5 font-medium text-[#37312E]">{tel.usuario}</td>
                          <td className="px-5 py-3.5 text-[#37312E]/80">
                            <span className="bg-[#FAFAFA] border border-[#EAEAEA] px-2 py-0.5 rounded text-[11px]">
                              {tel.departamento}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-[#003479] tracking-wider">{tel.numero}</td>
                          <td className="px-5 py-3.5 text-[#37312E]">{tel.marca}</td>
                          <td className="px-5 py-3.5 font-medium text-[#37312E]">{tel.modelo}</td>
                          <td className="px-5 py-3.5 font-mono text-zinc-600 text-[11px] tracking-wider">{tel.imei}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                                tel.observaciones === "NUEVO"
                                  ? "bg-emerald-100/70 text-emerald-800 border-emerald-200"
                                  : tel.observaciones === "USADO"
                                  ? "bg-amber-100/70 text-amber-800 border-amber-200"
                                  : tel.observaciones === "EN REPARACIÓN"
                                  ? "bg-blue-100/70 text-blue-800 border-blue-200"
                                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
                              }`}
                            >
                              {tel.observaciones}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedTelefono(tel)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#003479]/10 text-[#003479] hover:bg-[#003479] hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Ver ficha del teléfono"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTelefono({ ...tel })}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200/60 transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Editar línea o equipo"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(tel.id, e)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Eliminar registro"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#37312E]/60">
              <span>Mostrando {filteredTelefonos.length} de {telefonos.length} registros</span>
              <span>Haga clic en una fila o en los botones para interactuar</span>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE REGISTRO DE TELÉFONO - Z-Index 9999 garantizado */}
      {isRegisterModalOpen && (
        <div
          id="modal-registro-telefono-backdrop"
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRegisterModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 sm:px-8 py-5 border-b border-[#EAEAEA] bg-[#FBFBFB] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-[#003479]">Registrar Nuevo Teléfono</h2>
                <p className="text-xs text-[#37312E]/60 mt-0.5">Ingrese los datos de la línea y equipo móvil para guardarlo en el inventario</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-[#37312E]/50 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                {/* Sección 1 */}
                <div>
                  <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider mb-3 pb-1 border-b border-[#F0F0F0]">
                    1. Datos del Colaborador y Departamento
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Usuario (Nombre Completo) <span className="text-[#CA1224]">*</span>
                      </label>
                      <input
                        type="text"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleInputChange}
                        placeholder="Ej. GARDEA GIRON OMAR RICARDO"
                        className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] uppercase focus:outline-none transition-all ${
                          formErrors.usuario ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20"
                        }`}
                      />
                      {formErrors.usuario && (
                        <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{formErrors.usuario}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Departamento / Área
                      </label>
                      <input
                        type="text"
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleInputChange}
                        placeholder="Ej. CHIHUAHUA ALMACEN / OPERACIONES / GESTORIA"
                        className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 2 */}
                <div>
                  <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider mb-3 pb-1 border-b border-[#F0F0F0]">
                    2. Línea y Dispositivo Móvil
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Número Telefónico <span className="text-[#CA1224]">*</span>
                      </label>
                      <input
                        type="tel"
                        name="numero"
                        value={formData.numero}
                        onChange={handleInputChange}
                        placeholder="Ej. 6143849069"
                        className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] font-mono tracking-wider focus:outline-none transition-all ${
                          formErrors.numero ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20"
                        }`}
                      />
                      {formErrors.numero && (
                        <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{formErrors.numero}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Marca <span className="text-[#CA1224]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="marca"
                          value={formData.marca}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] appearance-none cursor-pointer focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all pr-8 font-medium"
                        >
                          <option value="SAMSUNG">SAMSUNG</option>
                          <option value="IPHONE">IPHONE / APPLE</option>
                          <option value="OUKITEL">OUKITEL</option>
                          <option value="XIAOMI">XIAOMI</option>
                          <option value="MOTOROLA">MOTOROLA</option>
                          <option value="OTRA">OTRA</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#37312E]/50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Modelo
                      </label>
                      <input
                        type="text"
                        name="modelo"
                        value={formData.modelo}
                        onChange={handleInputChange}
                        placeholder="Ej. A57 5G o 11 o A10S"
                        className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 3 */}
                <div>
                  <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider mb-3 pb-1 border-b border-[#F0F0F0]">
                    3. Identificador IMEI y Estado
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Código IMEI (15 dígitos) <span className="text-[#CA1224]">*</span>
                      </label>
                      <input
                        type="text"
                        name="imei"
                        value={formData.imei}
                        onChange={handleInputChange}
                        placeholder="Ej. 357443195292272"
                        className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-sm text-[#37312E] font-mono tracking-widest focus:outline-none transition-all ${
                          formErrors.imei ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20"
                        }`}
                      />
                      {formErrors.imei && (
                        <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{formErrors.imei}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Observaciones (Condición)
                      </label>
                      <div className="relative">
                        <select
                          name="observaciones"
                          value={formData.observaciones}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] appearance-none cursor-pointer focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all pr-8 font-medium"
                        >
                          <option value="NUEVO">NUEVO</option>
                          <option value="USADO">USADO</option>
                          <option value="EN REPARACIÓN">EN REPARACIÓN</option>
                          <option value="BAJA">BAJA</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#37312E]/50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de envío del modal (Docked at bottom) */}
              <div className="px-6 sm:px-8 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-xs font-semibold text-[#37312E]/70 hover:bg-white cursor-pointer active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-xs font-semibold text-white transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Registrar Teléfono</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL TELÉFONO */}
      {selectedTelefono && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTelefono(null);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FBFBFB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#003479]/10 flex items-center justify-center text-[#003479]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#003479]">{selectedTelefono.usuario}</h3>
                  <p className="text-xs font-mono text-[#37312E]/60">Línea: {selectedTelefono.numero}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTelefono(null)}
                className="text-[#37312E]/50 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Departamento:</span>
                  <span className="font-semibold text-[#37312E] text-sm">{selectedTelefono.departamento}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Número Telefónico:</span>
                  <span className="font-mono font-bold text-[#003479] text-sm">{selectedTelefono.numero}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Marca y Modelo:</span>
                  <span className="font-semibold text-[#37312E]">{selectedTelefono.marca} {selectedTelefono.modelo}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Condición / Observación:</span>
                  <span className={`font-semibold ${
                    selectedTelefono.observaciones === "NUEVO" ? "text-emerald-700" :
                    selectedTelefono.observaciones === "USADO" ? "text-amber-700" : "text-blue-700"
                  }`}>
                    {selectedTelefono.observaciones}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAFAFA] p-3.5 rounded-lg border border-[#EAEAEA] text-xs">
                <span className="text-[#37312E]/60 block mb-1">Código IMEI:</span>
                <p className="font-mono font-bold text-[#37312E] tracking-widest text-sm">{selectedTelefono.imei}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedTelefono.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTelefono({ ...selectedTelefono });
                      setSelectedTelefono(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EAEAEA] text-xs font-medium text-[#37312E] hover:bg-[#FAFAFA] cursor-pointer shadow-xs active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 text-[#003479]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTelefono(null)}
                    className="px-5 py-2 rounded-xl bg-[#003479] text-white text-xs font-medium hover:bg-[#00275C] cursor-pointer shadow-xs active:scale-95"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR TELÉFONO (TODOS LOS 7 CAMPOS) */}
      {editingTelefono && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTelefono(null);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FBFBFB] shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#003479]">Editar Línea / Teléfono</h3>
                <p className="text-xs text-[#37312E]/60">{editingTelefono.usuario}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTelefono(null)}
                className="text-[#37312E]/50 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Usuario (Titular)</label>
                <input
                  type="text"
                  required
                  value={editingTelefono.usuario}
                  onChange={(e) => setEditingTelefono({ ...editingTelefono, usuario: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Departamento</label>
                  <input
                    type="text"
                    required
                    value={editingTelefono.departamento}
                    onChange={(e) => setEditingTelefono({ ...editingTelefono, departamento: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Número Telefónico</label>
                  <input
                    type="text"
                    required
                    value={editingTelefono.numero}
                    onChange={(e) => setEditingTelefono({ ...editingTelefono, numero: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] font-mono focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Marca</label>
                  <div className="relative">
                    <select
                      value={editingTelefono.marca}
                      onChange={(e) => setEditingTelefono({ ...editingTelefono, marca: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] appearance-none focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all pr-8"
                    >
                      <option value="SAMSUNG">SAMSUNG</option>
                      <option value="IPHONE">IPHONE / APPLE</option>
                      <option value="OUKITEL">OUKITEL</option>
                      <option value="XIAOMI">XIAOMI</option>
                      <option value="MOTOROLA">MOTOROLA</option>
                      <option value="OTRA">OTRA</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#37312E]/50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Modelo</label>
                  <input
                    type="text"
                    required
                    value={editingTelefono.modelo}
                    onChange={(e) => setEditingTelefono({ ...editingTelefono, modelo: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Código IMEI</label>
                  <input
                    type="text"
                    required
                    value={editingTelefono.imei}
                    onChange={(e) => setEditingTelefono({ ...editingTelefono, imei: e.target.value.trim() })}
                    className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] font-mono tracking-wider focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">Observaciones</label>
                  <div className="relative">
                    <select
                      value={editingTelefono.observaciones}
                      onChange={(e) => setEditingTelefono({ ...editingTelefono, observaciones: e.target.value as Telefono["observaciones"] })}
                      className="w-full px-3.5 py-2.5 border border-[#EAEAEA] rounded-xl bg-white text-sm text-[#37312E] appearance-none focus:outline-none focus:border-[#003479] focus:ring-1 focus:ring-[#003479]/20 transition-all pr-8"
                    >
                      <option value="NUEVO">NUEVO</option>
                      <option value="USADO">USADO</option>
                      <option value="EN REPARACIÓN">EN REPARACIÓN</option>
                      <option value="BAJA">BAJA</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#37312E]/50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-2.5 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setEditingTelefono(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-xs font-semibold text-[#37312E]/70 hover:bg-[#FAFAFA] cursor-pointer active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-xs font-semibold text-white transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Guardar Cambios</span>
                    </>
                  )}
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
