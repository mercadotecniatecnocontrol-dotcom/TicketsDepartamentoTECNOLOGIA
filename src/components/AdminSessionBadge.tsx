"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DEPARTAMENTOS, DEPARTAMENTO_INFO, type Departamento } from "@/lib/departamentos";
import { USERS, canManageInventory, type UserAccount } from "@/lib/auth";

export default function AdminSessionBadge() {
  const { user, login, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserAccount | null>(null);
  const [modalPassword, setModalPassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Asegurar que el componente esté montado antes de usar React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Foco automático en el input de contraseña cuando se abre el modal
  useEffect(() => {
    if (targetUser) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [targetUser]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-20 sm:w-24 h-8 rounded-lg bg-zinc-100 animate-pulse" />
      </div>
    );
  }

  const dept = user.departamento as Departamento;
  const userName = user.nombre || "Usuario";
  const info = DEPARTAMENTO_INFO[dept] || {
    bg: "bg-blue-50",
    color: "text-blue-700",
    dot: "bg-blue-600",
    desc: "Departamento",
  };
  const hasInventory = canManageInventory(dept);

  // Al hacer clic en un usuario, se abre el modal para pedir contraseña
  const handleSelectUserToSwitch = (candidate: UserAccount) => {
    if (candidate.nombre === user.nombre && candidate.departamento === user.departamento) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setTargetUser(candidate);
    setModalPassword("");
    setModalError(null);
  };

  const handleCancelModal = () => {
    setTargetUser(null);
    setModalPassword("");
    setModalError(null);
    setIsVerifying(false);
  };

  const handleConfirmSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    if (!modalPassword.trim()) {
      setModalError(`Ingresa la contraseña de ${targetUser.nombre}.`);
      return;
    }

    setIsVerifying(true);
    setModalError(null);

    const result = await login(
      targetUser.departamento,
      modalPassword,
      true,
      targetUser.nombre
    );

    setIsVerifying(false);

    if (result.success) {
      // Si el nuevo usuario no tiene permisos para inventario y está en una ruta de inventario, redirigir a /admin
      const targetHasInventory = canManageInventory(targetUser.departamento);
      const isInventoryPage =
        pathname?.includes("/admin/computadoras") ||
        pathname?.includes("/admin/telefonos");

      if (isInventoryPage && !targetHasInventory) {
        router.push("/admin");
      } else {
        router.refresh();
      }

      setTargetUser(null);
      setModalPassword("");
    } else {
      setModalError(result.error || "Contraseña incorrecta.");
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0" ref={menuRef}>
        {/* Botón interactivo con el usuario y departamento activo */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#EAEAEA] ${info.bg} ${info.color} text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 max-w-[140px] sm:max-w-none`}
          title="Opciones de usuario y cambio de cuenta"
        >
          <span className={`w-2 h-2 rounded-full ${info.dot} shrink-0`} />
          <span className="font-bold truncate">{userName}</span>
          <span className="text-[10px] opacity-70 hidden sm:inline shrink-0">({dept})</span>
          <svg
            className={`w-3 h-3 text-[#37312E]/40 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Indicador sutil para Marketing o Arquitectura */}
        {!hasInventory && (
          <span className="hidden xl:inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
            Solo Tickets
          </span>
        )}

        {/* Menú desplegable para cambiar de usuario */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white rounded-xl shadow-xl border border-[#EAEAEA] p-2.5 z-50 animate-fade-in-up">
            <div className="px-2 py-1.5 border-b border-[#F0F0F0] mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#003479] uppercase tracking-wider">
                  Cambiar de Usuario
                </p>
                <p className="text-[10px] text-[#37312E]/60 mt-0.5">
                  Sesión activa: <strong>{userName}</strong> ({dept})
                </p>
              </div>
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold px-1.5 py-0.5 rounded shrink-0">
                Requiere clave
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {DEPARTAMENTOS.map((d) => {
                const dInfo = DEPARTAMENTO_INFO[d];
                const dHasInventory = canManageInventory(d);
                const deptUsers = USERS.filter((u) => u.departamento === d);

                return (
                  <div key={d} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <span className="text-[10px] font-bold text-[#003479] uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dInfo.dot}`} />
                        {d}
                      </span>
                      <span className="text-[9px] text-[#37312E]/50 font-medium">
                        {dHasInventory ? "+ Inventario" : "Sin Inventario"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {deptUsers.map((u) => {
                        const isCurrent = u.nombre === userName && u.departamento === dept;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectUserToSwitch(u)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isCurrent
                                ? "bg-[#003479]/10 font-bold text-[#003479]"
                                : "hover:bg-[#F7F8FA] text-[#37312E]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                                {u.nombre.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs leading-tight truncate block">{u.nombre}</span>
                                <span className="text-[10px] text-[#37312E]/60 truncate block leading-tight">{u.cargo}</span>
                              </div>
                            </div>

                            {isCurrent ? (
                              <span className="text-[10px] bg-[#003479] text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                                En uso
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-medium shrink-0 flex items-center gap-1">
                                🔒 Cambiar
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#F0F0F0] mt-2.5 pt-2">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* Botón Salir directo */}
        <button
          type="button"
          onClick={() => logout()}
          className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
          title="Cerrar sesión actual"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      {/* Modal de Autenticación para Cambiar de Usuario usando createPortal para evitar cortes de backdrop-blur en nav */}
      {mounted &&
        targetUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isVerifying) {
                handleCancelModal();
              }
            }}
          >
            <div
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#EAEAEA] p-6 my-auto animate-scale-up"
              role="dialog"
              aria-modal="true"
            >
              {/* Botón X de cerrar */}
              <button
                type="button"
                onClick={handleCancelModal}
                disabled={isVerifying}
                className="absolute top-4 right-4 text-[#37312E]/40 hover:text-[#37312E] p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-30"
                title="Cerrar ventana"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Encabezado del modal */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-[#003479]/10 text-[#003479] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                <h3 className="text-base font-bold text-[#003479] tracking-tight">
                  Confirmar Cambio de Usuario
                </h3>
                <p className="text-xs text-[#37312E]/70 mt-1 leading-relaxed">
                  Ingresa la contraseña de <strong>{targetUser.nombre}</strong> ({targetUser.cargo}) para acceder al departamento de{" "}
                  <strong>{targetUser.departamento}</strong>.
                </p>
              </div>

              {/* Error si la contraseña es incorrecta */}
              {modalError && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{modalError}</span>
                </div>
              )}

              {/* Formulario de contraseña */}
              <form onSubmit={handleConfirmSwitch} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-wider mb-1.5">
                    Contraseña de {targetUser.nombre}
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showModalPassword ? "text" : "password"}
                      value={modalPassword}
                      onChange={(e) => setModalPassword(e.target.value)}
                      placeholder="Escribe la contraseña..."
                      disabled={isVerifying}
                      className="w-full pl-3.5 pr-10 py-2.5 border border-[#EAEAEA] rounded-xl text-sm text-[#37312E] bg-white focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all placeholder:text-[#37312E]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#37312E]/40 hover:text-[#37312E]/70 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showModalPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelModal}
                    disabled={isVerifying}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#EAEAEA] text-xs font-semibold text-[#37312E]/70 hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Validando...</span>
                      </>
                    ) : (
                      <span>Confirmar Cambio</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
