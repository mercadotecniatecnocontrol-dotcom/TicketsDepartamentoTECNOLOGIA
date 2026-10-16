"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Computadora {
  id: string;
  equipo: string;
  ns: string;
  marca: string;
  modelo: string;
  procesador: string;
  ram: string;
  discoDuro: string;
  estatus: "SIN ASIGNAR" | "ASIGNADA" | "EN REPARACIÓN" | "BAJA";
  usuario: string;
  observaciones: string;
}

const INITIAL_COMPUTADORAS: Computadora[] = [
  {
    id: "COMP-1",
    equipo: "LAPTOP",
    ns: "DYM26J4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5 1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "SIN ASIGNAR",
    usuario: "N/D",
    observaciones: "NUEVA LISTA PARA USAR"
  },
  {
    id: "COMP-2",
    equipo: "LAPTOP",
    ns: "1HK26J4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5 1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "SIN ASIGNAR",
    usuario: "N/D",
    observaciones: "NUEVA LISTA PARA USAR"
  },
  {
    id: "COMP-3",
    equipo: "LAPTOP",
    ns: "9J1DTH4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5 1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "ASIGNADA",
    usuario: "MAGALY CHAVEZ",
    observaciones: "NUEVA EN USO"
  },
  {
    id: "COMP-4",
    equipo: "LAPTOP",
    ns: "6MVD5J4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5H1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "SIN ASIGNAR",
    usuario: "N/D",
    observaciones: "NUEVA LISTA PARA USAR"
  },
  {
    id: "COMP-5",
    equipo: "LAPTOP",
    ns: "C5GFTH4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5 1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "SIN ASIGNAR",
    usuario: "N/D",
    observaciones: "NUEVA LISTA PARA USAR"
  },
  {
    id: "COMP-6",
    equipo: "LAPTOP",
    ns: "C2ZJXH4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5 1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "ASIGNADA",
    usuario: "Omar Ricardo Gardea G",
    observaciones: "NUEVA EN USO"
  },
  {
    id: "COMP-7",
    equipo: "LAPTOP",
    ns: "3CRCTH4",
    marca: "DELL",
    modelo: "LDC15250",
    procesador: "INTEL CORE I5 1334",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "ASIGNADA",
    usuario: "ADRIAN CANO",
    observaciones: "EN USO"
  },
  {
    id: "COMP-8",
    equipo: "LAPTOP",
    ns: "7M467M3",
    marca: "DELL",
    modelo: "LATITUDE 5420",
    procesador: "INTEL CORE I7 11TH",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "ASIGNADA",
    usuario: "KEVIN",
    observaciones: "NUEVA EN USO"
  },
  {
    id: "COMP-9",
    equipo: "LAPTOP",
    ns: "5TLS4M3",
    marca: "DELL",
    modelo: "LATITUDE 5420",
    procesador: "INTEL CORE I7 11TH",
    ram: "16GB",
    discoDuro: "SSD 512GB",
    estatus: "SIN ASIGNAR",
    usuario: "N/D",
    observaciones: "NUEVA EN USO"
  }
];

const INITIAL_FORM_DATA: Omit<Computadora, "id"> = {
  equipo: "LAPTOP",
  ns: "",
  marca: "DELL",
  modelo: "LDC15250",
  procesador: "INTEL CORE I5 1334",
  ram: "16GB",
  discoDuro: "SSD 512GB",
  estatus: "SIN ASIGNAR",
  usuario: "N/D",
  observaciones: "NUEVA LISTA PARA USAR"
};

export default function ComputadorasDashboard() {
  const [computadoras, setComputadoras] = useState<Computadora[]>(INITIAL_COMPUTADORAS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string>("ALL");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Computadora | null>(null);
  const [editingEquipo, setEditingEquipo] = useState<Computadora | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<string>("");
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ ns?: string; modelo?: string }>({});
  const [formData, setFormData] = useState<Omit<Computadora, "id">>(INITIAL_FORM_DATA);

  const handleOpenRegisterModal = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setFormErrors({});
    setIsRegisterModalOpen(true);
  };

  // Prevent background scroll when any modal is open
  useEffect(() => {
    if (isRegisterModalOpen || selectedEquipo || editingEquipo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isRegisterModalOpen, selectedEquipo, editingEquipo]);

  const sanitizeComputadora = (c: any, index: number): Computadora => ({
    id: c?.id ? String(c.id) : `COMP-${100 + index}`,
    equipo: String(c?.equipo || "LAPTOP").toUpperCase(),
    ns: String(c?.ns || "").toUpperCase(),
    marca: String(c?.marca || "DELL").toUpperCase(),
    modelo: String(c?.modelo || "").toUpperCase(),
    procesador: String(c?.procesador || "").toUpperCase(),
    ram: String(c?.ram || "16GB"),
    discoDuro: String(c?.discoDuro || "SSD 512GB"),
    estatus: ["SIN ASIGNAR", "ASIGNADA", "EN REPARACIÓN", "BAJA"].includes(c?.estatus)
      ? c.estatus
      : "SIN ASIGNAR",
    usuario: String(c?.usuario || "N/D").toUpperCase(),
    observaciones: String(c?.observaciones || "").toUpperCase()
  });

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tecnocontrol_computadoras");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setComputadoras(parsed.map(sanitizeComputadora));
        } else {
          setComputadoras(INITIAL_COMPUTADORAS);
        }
      } else {
        localStorage.setItem("tecnocontrol_computadoras", JSON.stringify(INITIAL_COMPUTADORAS));
      }
    } catch (e) {
      console.error(e);
      setComputadoras(INITIAL_COMPUTADORAS);
    }
  }, []);

  const saveComputadoras = (updated: Computadora[]) => {
    setComputadoras(updated);
    try {
      localStorage.setItem("tecnocontrol_computadoras", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "estatus" && value === "SIN ASIGNAR" && prev.usuario !== "N/D" ? { usuario: "N/D" } : {})
    }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { ns?: string; modelo?: string } = {};
    if (!formData.ns.trim()) {
      errors.ns = "El Número de Serie (NS) es obligatorio.";
    }
    if (!formData.modelo.trim()) {
      errors.modelo = "El Modelo del equipo es obligatorio.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newComputadora: Computadora = {
      id: `COMP-${Date.now().toString().slice(-4)}`,
      equipo: formData.equipo || "LAPTOP",
      ns: formData.ns.trim().toUpperCase(),
      marca: formData.marca.trim().toUpperCase(),
      modelo: formData.modelo.trim().toUpperCase(),
      procesador: formData.procesador.trim().toUpperCase() || "INTEL CORE I5 1334",
      ram: formData.ram || "16GB",
      discoDuro: formData.discoDuro.trim().toUpperCase() || "SSD 512GB",
      estatus: formData.estatus,
      usuario: formData.estatus === "SIN ASIGNAR" && (!formData.usuario.trim() || formData.usuario.trim() === "N/D")
        ? "N/D"
        : (formData.usuario.trim().toUpperCase() || "N/D"),
      observaciones: formData.observaciones.trim().toUpperCase() || "NUEVA LISTA PARA USAR"
    };

    const updated = [newComputadora, ...computadoras];
    saveComputadoras(updated);
    setLastRegistered(newComputadora.ns);
    setShowSuccessAlert(true);
    setFilterEstatus("ALL");
    setSearchTerm("");
    setIsRegisterModalOpen(false);
    setFormData({ ...INITIAL_FORM_DATA });
    setFormErrors({});
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipo) return;

    const updated = computadoras.map(c => c.id === editingEquipo.id ? {
      ...editingEquipo,
      ns: (editingEquipo.ns || "").trim().toUpperCase(),
      modelo: (editingEquipo.modelo || "").trim().toUpperCase(),
      marca: (editingEquipo.marca || "").trim().toUpperCase(),
      procesador: (editingEquipo.procesador || "").trim().toUpperCase(),
      ram: (editingEquipo.ram || "16GB").trim().toUpperCase(),
      discoDuro: (editingEquipo.discoDuro || "SSD 512GB").trim().toUpperCase(),
      usuario: editingEquipo.estatus === "SIN ASIGNAR" && (!editingEquipo.usuario?.trim() || editingEquipo.usuario.trim() === "N/D")
        ? "N/D"
        : (editingEquipo.usuario || "").trim().toUpperCase(),
      observaciones: (editingEquipo.observaciones || "").trim().toUpperCase()
    } : c);

    saveComputadoras(updated);
    if (selectedEquipo?.id === editingEquipo.id) {
      setSelectedEquipo(editingEquipo);
    }
    setEditingEquipo(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este registro del inventario?")) {
      const updated = computadoras.filter(item => item.id !== id);
      saveComputadoras(updated);
      if (selectedEquipo?.id === id) setSelectedEquipo(null);
      if (editingEquipo?.id === id) setEditingEquipo(null);
    }
  };

  const exportToExcel = () => {
    try {
      const headers = [
        "Equipo",
        "NS (Número de Serie)",
        "Marca",
        "Modelo",
        "Procesador",
        "RAM",
        "Disco duro",
        "ESTATUS",
        "USUARIO",
        "OBSERVACIONES"
      ];

      const csvRows = [headers.join(",")];

      computadoras.forEach(item => {
        const row = [
          `"${(item.equipo || "").replace(/"/g, '""')}"`,
          `"${(item.ns || "").replace(/"/g, '""')}"`,
          `"${(item.marca || "").replace(/"/g, '""')}"`,
          `"${(item.modelo || "").replace(/"/g, '""')}"`,
          `"${(item.procesador || "").replace(/"/g, '""')}"`,
          `"${(item.ram || "").replace(/"/g, '""')}"`,
          `"${(item.discoDuro || "").replace(/"/g, '""')}"`,
          `"${(item.estatus || "").replace(/"/g, '""')}"`,
          `"${(item.usuario || "").replace(/"/g, '""')}"`,
          `"${(item.observaciones || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Inventario_Computadoras_${new Date().toISOString().split("T")[0]}.csv`;
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

  const filteredComputadoras = computadoras.filter(item => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (item.ns || "").toLowerCase().includes(term) ||
      (item.usuario || "").toLowerCase().includes(term) ||
      (item.modelo || "").toLowerCase().includes(term) ||
      (item.marca || "").toLowerCase().includes(term) ||
      (item.procesador || "").toLowerCase().includes(term) ||
      (item.observaciones || "").toLowerCase().includes(term) ||
      (item.equipo || "").toLowerCase().includes(term);

    const matchesEstatus = filterEstatus === "ALL" || item.estatus === filterEstatus;

    return matchesSearch && matchesEstatus;
  });

  const totalEquipos = computadoras.length;
  const sinAsignar = computadoras.filter(c => c.estatus === "SIN ASIGNAR").length;
  const asignadas = computadoras.filter(c => c.estatus === "ASIGNADA").length;
  const enReparacion = computadoras.filter(c => c.estatus === "EN REPARACIÓN").length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#003479]/20 selection:text-[#003479] pb-16">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-[#EAEAEA] bg-white/95 backdrop-blur-xl animate-fade-in-up shadow-xs">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <img src="/logotecno.png" alt="Tecnocontrol Logo" style={{ height: "42px", width: "auto", objectFit: "contain", flexShrink: 0 }} />
              <span className="font-semibold text-[#003479] text-base tracking-tight hidden sm:inline-block">Tecnocontrol TI</span>
            </div>

            {/* Desktop Nav Pills */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/admin"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#37312E]/70 hover:text-[#003479] hover:bg-[#FAFAFA] border border-transparent hover:border-[#EAEAEA] transition-all"
              >
                Historial de Tickets
              </Link>
              <Link
                href="/admin/computadoras"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#003479] text-white shadow-xs transition-all"
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
            className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap text-[#37312E]/70 hover:text-[#003479] bg-white border border-[#EAEAEA]"
          >
            Historial
          </Link>
          <Link
            href="/admin/computadoras"
            className="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#003479] text-white"
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
                Inventario de Cómputo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#003479] tracking-tight">
              Entrada de Computadoras
            </h1>
            <p className="text-sm text-[#37312E]/70 mt-1">
              Registro y control de inventario de equipos tecnológicos de la empresa.
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

            {/* BOTÓN PRINCIPAL PARA ABRIR EL MODAL DE REGISTRO */}
            <button
              type="button"
              id="btn-registrar-computadora-header"
              onClick={handleOpenRegisterModal}
              className="text-xs sm:text-sm font-medium px-4 sm:px-5 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Computadora</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Stats Grid (Clickable Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in-up delay-100">
          <button
            type="button"
            onClick={() => setFilterEstatus("ALL")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterEstatus === "ALL" && !searchTerm
                ? "border-[#003479] ring-2 ring-[#003479]/20"
                : "border-[#EAEAEA] hover:border-[#003479]/30 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Total Registrados</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#003479]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#003479]">{totalEquipos}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Ver todos los equipos</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterEstatus(filterEstatus === "SIN ASIGNAR" ? "ALL" : "SIN ASIGNAR")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterEstatus === "SIN ASIGNAR"
                ? "border-emerald-600 ring-2 ring-emerald-600/30 bg-emerald-50/20"
                : "border-[#EAEAEA] hover:border-emerald-600/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Sin Asignar</p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-emerald-600">{sinAsignar}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar disponibles</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterEstatus(filterEstatus === "ASIGNADA" ? "ALL" : "ASIGNADA")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterEstatus === "ASIGNADA"
                ? "border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/20"
                : "border-[#EAEAEA] hover:border-blue-600/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">Asignadas</p>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-blue-600">{asignadas}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar en uso</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterEstatus(filterEstatus === "EN REPARACIÓN" ? "ALL" : "EN REPARACIÓN")}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer active:scale-98 bg-white shadow-xs ${filterEstatus === "EN REPARACIÓN"
                ? "border-[#CA1224] ring-2 ring-[#CA1224]/30 bg-red-50/20"
                : "border-[#EAEAEA] hover:border-[#CA1224]/40 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#37312E]/60 uppercase tracking-widest">En Reparación</p>
              <span className="w-2.5 h-2.5 rounded-full bg-[#CA1224]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#CA1224]">{enReparacion}</p>
            <p className="text-[11px] text-[#37312E]/50 mt-1">Clic para filtrar en taller</p>
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
                <p className="font-semibold text-sm">¡Computadora registrada correctamente!</p>
                <p className="text-xs text-emerald-800">El equipo con número de serie <span className="font-mono font-bold">{lastRegistered}</span> ya aparece en la lista de abajo.</p>
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
                {filteredComputadoras.length} equipos
              </span>
            </h2>

            <button
              type="button"
              id="btn-anadir-computadora-tabla"
              onClick={handleOpenRegisterModal}
              className="text-xs font-semibold text-[#003479] bg-[#003479]/10 hover:bg-[#003479] hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Computadora</span>
            </button>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-[#EAEAEA] shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por NS, Usuario, Modelo, Procesador..."
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
                { id: "SIN ASIGNAR", label: "Sin Asignar" },
                { id: "ASIGNADA", label: "Asignada" },
                { id: "EN REPARACIÓN", label: "En Reparación" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterEstatus(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${filterEstatus === f.id
                      ? "bg-[#003479] text-white shadow-xs"
                      : "bg-[#FAFAFA] text-[#37312E]/70 border border-[#EAEAEA] hover:border-[#003479]/30 hover:text-[#003479]"
                    }`}
                >
                  {f.label}
                </button>
              ))}

              {(filterEstatus !== "ALL" || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterEstatus("ALL");
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
                    <th className="px-5 py-3.5">Equipo</th>
                    <th className="px-5 py-3.5">NS (Serie)</th>
                    <th className="px-5 py-3.5">Marca</th>
                    <th className="px-5 py-3.5">Modelo</th>
                    <th className="px-5 py-3.5">Procesador</th>
                    <th className="px-5 py-3.5">RAM</th>
                    <th className="px-5 py-3.5">Disco Duro</th>
                    <th className="px-5 py-3.5">Estatus</th>
                    <th className="px-5 py-3.5">Usuario</th>
                    <th className="px-5 py-3.5">Observaciones</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {filteredComputadoras.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-sm text-[#37312E]/60">
                        <p className="mb-3 font-medium">No se encontraron equipos registrados con los criterios seleccionados.</p>
                        <div className="flex items-center justify-center gap-3">
                          {(filterEstatus !== "ALL" || searchTerm) && (
                            <button
                              type="button"
                              onClick={() => {
                                setFilterEstatus("ALL");
                                setSearchTerm("");
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#003479] bg-[#003479]/10 hover:bg-[#003479]/20 transition-all cursor-pointer"
                            >
                              Ver todos los equipos
                            </button>
                          )}
                          <button
                            type="button"
                            id="btn-anadir-computadora-empty"
                            onClick={handleOpenRegisterModal}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#003479] hover:bg-[#00275C] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Registrar Nueva Computadora</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredComputadoras.map((comp) => {
                      const isSinAsignar = comp.estatus === "SIN ASIGNAR";
                      const isAsignada = comp.estatus === "ASIGNADA";

                      return (
                        <tr
                          key={comp.id}
                          onClick={() => setSelectedEquipo(comp)}
                          className={`transition-colors cursor-pointer group hover:bg-[#003479]/[0.03] ${isSinAsignar ? "bg-emerald-50/20" : isAsignada ? "bg-blue-50/15" : ""
                            }`}
                        >
                          <td className="px-5 py-3.5 font-medium text-[#37312E]">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#003479]/60"></span>
                              {comp.equipo}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-[#003479]">{comp.ns}</td>
                          <td className="px-5 py-3.5 text-[#37312E]">{comp.marca}</td>
                          <td className="px-5 py-3.5 font-medium text-[#37312E]">{comp.modelo}</td>
                          <td className="px-5 py-3.5 text-[#37312E]/80">{comp.procesador}</td>
                          <td className="px-5 py-3.5 text-[#37312E] font-medium">{comp.ram}</td>
                          <td className="px-5 py-3.5 text-[#37312E]">{comp.discoDuro}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${comp.estatus === "SIN ASIGNAR"
                                  ? "bg-emerald-100/70 text-emerald-800 border-emerald-200"
                                  : comp.estatus === "ASIGNADA"
                                    ? "bg-blue-100/70 text-blue-800 border-blue-200"
                                    : comp.estatus === "EN REPARACIÓN"
                                      ? "bg-amber-100/70 text-amber-800 border-amber-200"
                                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                                }`}
                            >
                              {comp.estatus}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`font-medium ${comp.usuario === "N/D" ? "text-[#37312E]/40" : "text-[#37312E]"}`}>
                              {comp.usuario}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[#37312E]/70 max-w-[200px] truncate" title={comp.observaciones}>
                            {comp.observaciones}
                          </td>
                          <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedEquipo(comp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#003479]/10 text-[#003479] hover:bg-[#003479] hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Ver ficha técnica completa"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingEquipo({ ...comp })}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200/60 transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Editar datos del equipo"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(comp.id, e)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#CA1224] hover:bg-[#CA1224] hover:text-white border border-red-200/60 transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Eliminar este equipo"
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
              <span>Mostrando {filteredComputadoras.length} de {computadoras.length} computadoras</span>
              <span>Haga clic en una fila o en los botones para interactuar</span>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE REGISTRO DE COMPUTADORA */}
      {isRegisterModalOpen && (
        <div
          id="modal-registro-computadora-backdrop"
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRegisterModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 sm:px-8 py-5 border-b border-[#EAEAEA] bg-[#FBFBFB] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-[#003479]">Registrar Nueva Computadora</h2>
                <p className="text-xs text-[#37312E]/60 mt-0.5">Ingrese las especificaciones del equipo para agregarlo al inventario</p>
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
                    1. Identificación del Equipo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Tipo de Equipo <span className="text-[#CA1224]">*</span>
                      </label>
                      <select
                        name="equipo"
                        value={formData.equipo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479]"
                      >
                        <option value="LAPTOP">LAPTOP</option>
                        <option value="DESKTOP">DESKTOP</option>
                        <option value="TODO EN UNO">TODO EN UNO (All-in-One)</option>
                        <option value="SERVIDOR">SERVIDOR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Número de Serie (NS) <span className="text-[#CA1224]">*</span>
                      </label>
                      <input
                        type="text"
                        name="ns"
                        value={formData.ns}
                        onChange={handleInputChange}
                        placeholder="Ej. DYM26J4"
                        className={`w-full px-3 py-2 border rounded-lg bg-white text-sm text-[#37312E] uppercase font-mono tracking-wider focus:outline-none ${formErrors.ns ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479]"
                          }`}
                      />
                      {formErrors.ns && (
                        <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{formErrors.ns}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección 2 */}
                <div>
                  <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider mb-3 pb-1 border-b border-[#F0F0F0]">
                    2. Fabricante y Modelo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Marca <span className="text-[#CA1224]">*</span>
                      </label>
                      <select
                        name="marca"
                        value={formData.marca}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479]"
                      >
                        <option value="DELL">DELL</option>
                        <option value="HP">HP</option>
                        <option value="LENOVO">LENOVO</option>
                        <option value="APPLE">APPLE</option>
                        <option value="ASUS">ASUS</option>
                        <option value="ACER">ACER</option>
                        <option value="OTRA">OTRA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Modelo <span className="text-[#CA1224]">*</span>
                      </label>
                      <input
                        type="text"
                        name="modelo"
                        value={formData.modelo}
                        onChange={handleInputChange}
                        placeholder="Ej. LDC15250 o LATITUDE 5420"
                        className={`w-full px-3 py-2 border rounded-lg bg-white text-sm text-[#37312E] uppercase focus:outline-none ${formErrors.modelo ? "border-[#CA1224] bg-red-50/20" : "border-[#EAEAEA] focus:border-[#003479]"
                          }`}
                      />
                      {formErrors.modelo && (
                        <p className="text-[11px] text-[#CA1224] mt-1 font-medium">{formErrors.modelo}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección 3 */}
                <div>
                  <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider mb-3 pb-1 border-b border-[#F0F0F0]">
                    3. Especificaciones Técnicas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Procesador
                      </label>
                      <input
                        type="text"
                        name="procesador"
                        value={formData.procesador}
                        onChange={handleInputChange}
                        placeholder="Ej. INTEL CORE I5 1334"
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        RAM
                      </label>
                      <select
                        name="ram"
                        value={formData.ram}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479]"
                      >
                        <option value="8GB">8GB</option>
                        <option value="16GB">16GB</option>
                        <option value="32GB">32GB</option>
                        <option value="64GB">64GB</option>
                        <option value="4GB">4GB</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Disco Duro
                      </label>
                      <input
                        type="text"
                        name="discoDuro"
                        value={formData.discoDuro}
                        onChange={handleInputChange}
                        placeholder="Ej. SSD 512GB"
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 4 */}
                <div>
                  <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider mb-3 pb-1 border-b border-[#F0F0F0]">
                    4. Estatus y Asignación
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Estatus del Equipo
                      </label>
                      <select
                        name="estatus"
                        value={formData.estatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] focus:outline-none focus:border-[#003479]"
                      >
                        <option value="SIN ASIGNAR">SIN ASIGNAR</option>
                        <option value="ASIGNADA">ASIGNADA</option>
                        <option value="EN REPARACIÓN">EN REPARACIÓN</option>
                        <option value="BAJA">BAJA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                        Usuario Asignado
                      </label>
                      <input
                        type="text"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleInputChange}
                        placeholder="Ej. MAGALY CHAVEZ o N/D"
                        className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 5 */}
                <div>
                  <label className="block text-xs font-semibold text-[#37312E]/80 uppercase tracking-widest mb-1.5">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    placeholder="Ej. NUEVA LISTA PARA USAR / NUEVA EN USO / EN USO"
                    className="w-full px-3 py-2 border border-[#EAEAEA] rounded-lg bg-white text-sm text-[#37312E] uppercase focus:outline-none focus:border-[#003479]"
                  />
                </div>
              </div>

              {/* Botón de envío del modal (Docked at bottom) */}
              <div className="px-6 sm:px-8 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#EAEAEA] text-sm font-medium text-[#37312E]/70 hover:bg-white cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 sm:px-7 py-2.5 rounded-xl bg-[#003479] hover:bg-[#00275C] text-sm font-medium text-white transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Registrar Computadora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL EQUIPO */}
      {selectedEquipo && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEquipo(null);
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#003479]">Detalle del Equipo</h3>
                  <p className="text-xs font-mono text-[#37312E]/60">NS: {selectedEquipo.ns}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEquipo(null)}
                className="text-[#37312E]/50 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Tipo de Equipo:</span>
                  <span className="font-semibold text-[#37312E] text-sm">{selectedEquipo.equipo}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Marca / Modelo:</span>
                  <span className="font-semibold text-[#37312E] text-sm">{selectedEquipo.marca} {selectedEquipo.modelo}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Procesador:</span>
                  <span className="font-medium text-[#37312E]">{selectedEquipo.procesador}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Memoria & Disco:</span>
                  <span className="font-medium text-[#37312E]">{selectedEquipo.ram} | {selectedEquipo.discoDuro}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Estatus:</span>
                  <span className={`font-semibold ${selectedEquipo.estatus === "SIN ASIGNAR" ? "text-emerald-700" :
                      selectedEquipo.estatus === "ASIGNADA" ? "text-blue-700" : "text-amber-700"
                    }`}>
                    {selectedEquipo.estatus}
                  </span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#EAEAEA]">
                  <span className="text-[#37312E]/60 block mb-0.5">Usuario Asignado:</span>
                  <span className="font-semibold text-[#37312E]">{selectedEquipo.usuario}</span>
                </div>
              </div>

              <div className="bg-[#FAFAFA] p-3.5 rounded-lg border border-[#EAEAEA] text-xs">
                <span className="text-[#37312E]/60 block mb-1">Observaciones:</span>
                <p className="text-[#37312E] font-medium leading-relaxed">{selectedEquipo.observaciones}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedEquipo.id)}
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
                      setEditingEquipo({ ...selectedEquipo });
                      setSelectedEquipo(null);
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
                    onClick={() => setSelectedEquipo(null)}
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

      {/* MODAL EDITAR EQUIPO (TODOS LOS CAMPOS) */}
      {editingEquipo && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingEquipo(null);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FBFBFB] shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#003479]">Editar Equipo: {editingEquipo.ns}</h3>
                <p className="text-xs text-[#37312E]/60">Modifique los datos técnicos o asignación de inventario</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEquipo(null)}
                className="text-[#37312E]/50 hover:text-[#37312E] p-1.5 rounded-lg hover:bg-[#EAEAEA]/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Tipo de Equipo</label>
                  <select
                    value={editingEquipo.equipo}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, equipo: e.target.value })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white"
                  >
                    <option value="LAPTOP">LAPTOP</option>
                    <option value="DESKTOP">DESKTOP</option>
                    <option value="TODO EN UNO">TODO EN UNO</option>
                    <option value="SERVIDOR">SERVIDOR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Número de Serie (NS)</label>
                  <input
                    type="text"
                    required
                    value={editingEquipo.ns}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, ns: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={editingEquipo.marca}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, marca: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    value={editingEquipo.modelo}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, modelo: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Procesador</label>
                  <input
                    type="text"
                    value={editingEquipo.procesador}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, procesador: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">RAM</label>
                  <select
                    value={editingEquipo.ram}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, ram: e.target.value })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white"
                  >
                    <option value="8GB">8GB</option>
                    <option value="16GB">16GB</option>
                    <option value="32GB">32GB</option>
                    <option value="64GB">64GB</option>
                    <option value="4GB">4GB</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Disco Duro</label>
                  <input
                    type="text"
                    value={editingEquipo.discoDuro}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, discoDuro: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Estatus</label>
                  <select
                    value={editingEquipo.estatus}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingEquipo({
                        ...editingEquipo,
                        estatus: val,
                        ...(val === "SIN ASIGNAR" && editingEquipo.usuario !== "N/D" ? { usuario: "N/D" } : {})
                      });
                    }}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white"
                  >
                    <option value="SIN ASIGNAR">SIN ASIGNAR</option>
                    <option value="ASIGNADA">ASIGNADA</option>
                    <option value="EN REPARACIÓN">EN REPARACIÓN</option>
                    <option value="BAJA">BAJA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#37312E]/80 mb-1">Usuario Asignado</label>
                  <input
                    type="text"
                    value={editingEquipo.usuario}
                    onChange={(e) => setEditingEquipo({ ...editingEquipo, usuario: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#37312E]/80 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={editingEquipo.observaciones}
                  onChange={(e) => setEditingEquipo({ ...editingEquipo, observaciones: e.target.value.toUpperCase() })}
                  className="w-full p-2 border border-[#EAEAEA] rounded-lg bg-white uppercase"
                />
              </div>

              <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setEditingEquipo(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAEAEA] font-medium text-[#37312E]/70 hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003479] text-white font-medium hover:bg-[#00275C] cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Guardar Cambios</span>
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
