"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DEPARTAMENTOS, DEPARTAMENTO_INFO, type Departamento } from "@/lib/departamentos";
import { USERS, canManageInventory, type UserAccount } from "@/lib/auth";

export default function AdminSessionBadge() {
  const { user, login, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-20 h-7 rounded-lg bg-zinc-100 animate-pulse" />
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

  const handleSwitchUser = async (targetUser: UserAccount) => {
    if (targetUser.nombre === user.nombre && targetUser.departamento === user.departamento) {
      setIsOpen(false);
      return;
    }
    setIsSwitching(true);
    await login(targetUser.departamento, "admin123", true, targetUser.nombre);
    setIsSwitching(false);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {/* Botón interactivo con el usuario y departamento activo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#EAEAEA] ${info.bg} ${info.color} text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer`}
        title="Clic para cambiar de usuario rápidamente"
      >
        <span className={`w-2 h-2 rounded-full ${info.dot}`} />
        <span className="font-bold">{userName}</span>
        <span className="text-[10px] opacity-70">({dept})</span>
        <svg
          className={`w-3 h-3 text-[#37312E]/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Indicador sutil para Marketing o Arquitectura */}
      {!hasInventory && (
        <span className="hidden xl:inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
          Solo Tickets
        </span>
      )}

      {/* Menú desplegable para cambiar de usuario */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#EAEAEA] p-2.5 z-50 animate-fade-in-up">
          <div className="px-2 py-1.5 border-b border-[#F0F0F0] mb-2">
            <p className="text-[11px] font-semibold text-[#003479] uppercase tracking-wider">
              Cambiar de Usuario
            </p>
            <p className="text-[10px] text-[#37312E]/60 mt-0.5">
              Sesión activa: <strong>{userName}</strong> ({dept})
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
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
                          onClick={() => handleSwitchUser(u)}
                          disabled={isSwitching}
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
                            <span className="font-semibold text-xs leading-tight">{u.nombre}</span>
                          </div>

                          {isCurrent ? (
                            <span className="text-[10px] bg-[#003479] text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                              Activo
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#003479] opacity-0 group-hover:opacity-100 font-medium">
                              Cambiar →
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
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
        title="Cerrar sesión actual"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  );
}
