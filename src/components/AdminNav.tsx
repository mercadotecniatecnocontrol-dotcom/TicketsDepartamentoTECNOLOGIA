"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { canManageInventory } from "@/lib/auth";
import AdminSessionBadge from "./AdminSessionBadge";

export type AdminTab = "tickets" | "computadoras" | "telefonos" | "calendario";

interface AdminNavProps {
  currentTab: AdminTab;
}

export default function AdminNav({ currentTab }: AdminNavProps) {
  const { user, isLoading } = useAuth();

  // Solo Gerencia y Sistemas pueden ver la entrada de computadoras y teléfonos.
  // Mientras cargue la sesión o si el usuario pertenece a Marketing o Arquitectura, es estrictamente FALSE.
  const canAccessInventory = !isLoading && Boolean(user && canManageInventory(user.departamento));

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#EAEAEA] bg-white/95 backdrop-blur-xl shadow-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Desktop Nav Pills */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/logotecno.png"
              alt="Tecnocontrol Logo"
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
              className="transition-transform group-hover:scale-102"
            />
            <span className="font-semibold text-[#003479] text-sm tracking-tight hidden sm:inline">
              Tecnocontrol TI
            </span>
          </Link>

          {/* Desktop Nav Pills */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                currentTab === "tickets"
                  ? "bg-[#003479] text-white shadow-xs"
                  : "text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA]"
              }`}
            >
              Historial de Tickets
            </Link>

            {canAccessInventory && (
              <>
                <Link
                  href="/admin/computadoras"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    currentTab === "computadoras"
                      ? "bg-[#003479] text-white shadow-xs"
                      : "text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA]"
                  }`}
                >
                  Computadoras
                </Link>

                <Link
                  href="/admin/telefonos"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    currentTab === "telefonos"
                      ? "bg-[#003479] text-white shadow-xs"
                      : "text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA]"
                  }`}
                >
                  Teléfonos
                </Link>
              </>
            )}

            <Link
              href="/admin/calendario"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === "calendario"
                  ? "bg-[#003479] text-white shadow-xs"
                  : "text-[#37312E]/70 hover:text-[#003479] hover:bg-[#F0F4FA]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Calendario</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
          </div>
        </div>

        {/* Right: Session Badge + Portal Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <AdminSessionBadge />
          <Link
            href="/"
            className="text-xs font-medium text-[#37312E]/70 hover:text-[#003479] border border-[#EAEAEA] hover:border-[#003479]/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs shrink-0 bg-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Portal de Usuarios</span>
          </Link>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden border-t border-[#EAEAEA] px-4 py-2 bg-[#FBFBFB] overflow-x-auto gap-2">
        <Link
          href="/admin"
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            currentTab === "tickets"
              ? "bg-[#003479] text-white"
              : "text-[#37312E]/70 bg-white border border-[#EAEAEA]"
          }`}
        >
          Historial
        </Link>

        {canAccessInventory && (
          <>
            <Link
              href="/admin/computadoras"
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                currentTab === "computadoras"
                  ? "bg-[#003479] text-white"
                  : "text-[#37312E]/70 bg-white border border-[#EAEAEA]"
              }`}
            >
              Computadoras
            </Link>

            <Link
              href="/admin/telefonos"
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                currentTab === "telefonos"
                  ? "bg-[#003479] text-white"
                  : "text-[#37312E]/70 bg-white border border-[#EAEAEA]"
              }`}
            >
              Teléfonos
            </Link>
          </>
        )}

        <Link
          href="/admin/calendario"
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
            currentTab === "calendario"
              ? "bg-[#003479] text-white"
              : "text-[#37312E]/70 bg-white border border-[#EAEAEA]"
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendario
        </Link>
      </div>
    </nav>
  );
}
