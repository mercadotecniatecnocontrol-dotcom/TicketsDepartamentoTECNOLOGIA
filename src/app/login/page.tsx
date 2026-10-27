"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DEPARTAMENTOS, DEPARTAMENTO_INFO, type Departamento } from "@/lib/departamentos";
import { getUsersByDepartment } from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from") || "/admin";

  const { login, user, isAuthenticated } = useAuth();

  const [selectedDept, setSelectedDept] = useState<Departamento>("Marketing");
  const [selectedUser, setSelectedUser] = useState<string>("Glen");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar departamento y usuario con la sesión activa si existe
  useEffect(() => {
    if (user?.departamento) {
      setSelectedDept(user.departamento);
      if (user.nombre) {
        setSelectedUser(user.nombre);
      }
    }
  }, [user]);

  // Cuando cambie el departamento, seleccionar automáticamente el primer usuario de ese departamento
  const handleSelectDept = (dept: Departamento) => {
    setSelectedDept(dept);
    setError(null);
    const usersInDept = getUsersByDepartment(dept);
    if (usersInDept.length > 0) {
      setSelectedUser(usersInDept[0].nombre);
    } else {
      setSelectedUser("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDept) {
      setError("Por favor selecciona un departamento.");
      return;
    }

    if (!selectedUser) {
      setError("Por favor selecciona tu usuario.");
      return;
    }

    if (!password.trim()) {
      setError("Por favor ingresa tu contraseña de acceso.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(selectedDept, password, rememberMe, selectedUser);
    setIsSubmitting(false);

    if (result.success) {
      router.replace(fromUrl);
      router.refresh();
    } else {
      setError(result.error || "Credenciales incorrectas.");
    }
  };

  const handleQuickFill = () => {
    setPassword("admin123");
    setError(null);
  };

  const deptMeta: Record<
    Departamento,
    {
      title: string;
      desc: string;
      icon: (selected: boolean) => React.ReactNode;
      activeBorder: string;
    }
  > = {
    Sistemas: {
      title: "Sistemas y TI",
      desc: "Infraestructura, redes, equipos y software",
      activeBorder: "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40",
      icon: (sel) => (
        <svg className={`w-5 h-5 ${sel ? "text-blue-600" : "text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    Marketing: {
      title: "Marketing y Diseño",
      desc: "Diseño gráfico, campañas y publicidad",
      activeBorder: "border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/40",
      icon: (sel) => (
        <svg className={`w-5 h-5 ${sel ? "text-purple-600" : "text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    Arquitectura: {
      title: "Arquitectura",
      desc: "Planos, renders, instalaciones y obra",
      activeBorder: "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40",
      icon: (sel) => (
        <svg className={`w-5 h-5 ${sel ? "text-emerald-600" : "text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    Gerencia: {
      title: "Gerencia y Dirección",
      desc: "Supervisión general, autorizaciones y reportes",
      activeBorder: "border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/40",
      icon: (sel) => (
        <svg className={`w-5 h-5 ${sel ? "text-amber-600" : "text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  };

  const currentUsers = getUsersByDepartment(selectedDept);

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col justify-between selection:bg-[#003479]/20 selection:text-[#003479]">
      {/* Top Simple Bar */}
      <header className="w-full border-b border-[#EAEAEA] bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logotecno.png"
            alt="Tecnocontrol Logo"
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-[#003479] text-sm tracking-tight leading-tight">
              Tecnocontrol
            </span>
            <span className="text-[10px] text-[#37312E]/60 uppercase tracking-widest font-medium">
              Mesa de Ayuda
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-[#37312E]/70 hover:text-[#003479] border border-[#EAEAEA] hover:border-[#003479]/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Portal de Usuarios</span>
        </Link>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl bg-white border border-[#EAEAEA] rounded-2xl shadow-xl shadow-zinc-200/50 p-6 sm:p-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003479]/10 text-[#003479] text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#003479]" />
              Acceso de Usuarios TI
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#003479] tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-xs sm:text-sm text-[#37312E]/60 mt-1">
              Selecciona tu departamento y tu usuario para ingresar
            </p>
          </div>

          {/* Active Session Info */}
          {isAuthenticated && user && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#003479]/5 border border-[#003479]/20 text-xs flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#003479]">
                  Sesión activa: <span className="font-bold underline">{user.nombre} ({user.departamento})</span>
                </p>
                <p className="text-[11px] text-[#37312E]/70 mt-0.5">
                  Puedes ingresar directamente o cambiar de usuario abajo:
                </p>
              </div>
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg bg-[#003479] hover:bg-[#00275C] text-white font-semibold text-xs whitespace-nowrap shadow-xs active:scale-95 transition-all"
              >
                Ir al Panel →
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2.5 animate-shake">
              <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Paso 1: Department Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest">
                  1. Departamento <span className="text-[#CA1224]">*</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">Elige tu área</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {DEPARTAMENTOS.map((dept) => {
                  const meta = deptMeta[dept];
                  const isSelected = selectedDept === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleSelectDept(dept)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? meta.activeBorder
                          : "border-[#EAEAEA] hover:border-zinc-300 bg-white hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-white shadow-xs" : "bg-zinc-100"}`}>
                        {meta.icon(isSelected)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${isSelected ? "text-[#37312E]" : "text-[#37312E]/80"}`}>
                            {dept}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-[#003479]" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#37312E]/50 line-clamp-1 mt-0.5">
                          {meta.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paso 2: User Selection for the Selected Department */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest">
                  2. Usuario de {selectedDept} <span className="text-[#CA1224]">*</span>
                </label>
                <span className="text-[10px] text-[#003479] font-medium">
                  {currentUsers.length === 1 ? "1 usuario disponible" : `${currentUsers.length} usuarios disponibles`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentUsers.map((u) => {
                  const isUserSelected = selectedUser === u.nombre;
                  const deptStyle = DEPARTAMENTO_INFO[selectedDept];
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u.nombre);
                        setError(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isUserSelected
                          ? "border-[#003479] bg-[#003479]/5 ring-2 ring-[#003479]/15 shadow-2xs"
                          : "border-[#EAEAEA] bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
                      }`}
                    >
                      {/* Avatar with initial */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-transform ${
                          isUserSelected
                            ? "bg-[#003479] text-white scale-105"
                            : `${deptStyle.bg} ${deptStyle.color}`
                        }`}
                      >
                        {u.nombre.charAt(0)}
                      </div>

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm font-bold ${isUserSelected ? "text-[#003479]" : "text-[#37312E]"}`}>
                            {u.nombre}
                          </span>
                          {isUserSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#003479] text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paso 3: Password Input */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#37312E]/70 uppercase tracking-widest">
                  3. Contraseña de Acceso <span className="text-[#CA1224]">*</span>
                </label>
                {/* Quick Fill Demo Button */}
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[10px] font-medium text-[#003479] hover:underline cursor-pointer flex items-center gap-1"
                  title="Rellena la contraseña maestra para pruebas rápidas"
                >
                  <span>🔑 Usar: <strong>admin123</strong></span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#37312E]/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Contraseña para ${selectedUser || selectedDept}`}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#EAEAEA] rounded-xl text-sm text-[#37312E] bg-white focus:outline-none focus:border-[#003479] focus:ring-2 focus:ring-[#003479]/10 transition-all placeholder:text-[#37312E]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#37312E]/40 hover:text-[#37312E]/70 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
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

              {/* Password hints */}
              <div className="flex items-center justify-between text-[11px] text-[#37312E]/50 mt-1.5 px-0.5">
                <span>Contraseñas válidas: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">admin123</code> o <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">{selectedUser.toLowerCase()}123</code></span>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#003479] border-zinc-300 focus:ring-[#003479]"
                />
                <span className="text-xs text-[#37312E]/70">Recordar mi sesión (30 días)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#003479] hover:bg-[#00275C] text-white font-semibold text-sm transition-all shadow-md shadow-[#003479]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar como {selectedUser} ({selectedDept})</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Quick User Directory Info */}
          <div className="mt-6 pt-5 border-t border-[#EAEAEA] text-center">
            <p className="text-[11px] font-semibold text-[#003479] uppercase tracking-wider mb-2">
              Directorio de Usuarios por Departamento
            </p>
            <div className="grid grid-cols-2 gap-2 text-left text-[11px] text-[#37312E]/70 bg-[#F9F9F9] p-3 rounded-xl border border-[#EAEAEA]">
              <div>
                <span className="font-semibold text-blue-700">Sistemas:</span> Kevin, Alan
              </div>
              <div>
                <span className="font-semibold text-purple-700">Marketing:</span> Glen, Erika
              </div>
              <div>
                <span className="font-semibold text-emerald-700">Arquitectura:</span> Aldo
              </div>
              <div>
                <span className="font-semibold text-amber-700">Gerencia:</span> Glen
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#EAEAEA] bg-white py-3 px-6 text-center text-xs text-[#37312E]/50">
        Tecnocontrol TI &copy; {new Date().getFullYear()} &mdash; Sistema de Mesa de Ayuda y Control de Activos
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-[#003479]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
