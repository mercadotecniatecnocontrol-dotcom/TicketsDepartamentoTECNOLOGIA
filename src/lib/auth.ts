import { DEPARTAMENTOS, type Departamento } from "@/lib/departamentos";
import { type SessionUser } from "./auth-token";

export const SESSION_COOKIE_NAME = "tc_session";

export interface UserAccount {
  id: string;
  nombre: string;
  departamento: Departamento;
  email: string;
  role: "admin" | "departamento";
  cargo: string;
  allowedPasswords: string[];
}

export const USERS: UserAccount[] = [
  // Sistemas
  {
    id: "usr-kevin-sistemas",
    nombre: "Kevin",
    departamento: "Sistemas",
    email: "kevin@tecnocontrol.com.mx",
    role: "admin",
    cargo: "Soporte TI e Infraestructura",
    allowedPasswords: ["Desarrollador@@2026."],
  },
  {
    id: "usr-alan-sistemas",
    nombre: "Alan",
    departamento: "Sistemas",
    email: "alan@tecnocontrol.com.mx",
    role: "admin",
    cargo: "Soporte TI y Redes",
    allowedPasswords: ["Sistemas@@1."],
  },
  // Arquitectura
  {
    id: "usr-aldo-arquitectura",
    nombre: "Aldo",
    departamento: "Arquitectura",
    email: "aldo@tecnocontrol.com.mx",
    role: "departamento",
    cargo: "Arquitectura y Mantenimiento",
    allowedPasswords: ["AS250599."],
  },
  // Marketing
  {
    id: "usr-glen-marketing",
    nombre: "Glen",
    departamento: "Marketing",
    email: "glen@tecnocontrol.com.mx",
    role: "departamento",
    cargo: "Marketing y Comunicación",
    allowedPasswords: ["TecnoControl@@2026."],
  },
  {
    id: "usr-erika-marketing",
    nombre: "Erika",
    departamento: "Marketing",
    email: "erika@tecnocontrol.com.mx",
    role: "departamento",
    cargo: "Diseño Gráfico y Publicidad",
    allowedPasswords: ["Eriso139"],
  },
  // Gerencia
  {
    id: "usr-glen-gerencia",
    nombre: "Glen",
    departamento: "Gerencia",
    email: "glen.gerencia@tecnocontrol.com.mx",
    role: "admin",
    cargo: "Dirección General y Gerencia",
    allowedPasswords: ["Admin2027."],
  },
];

/**
 * Obtiene la lista de usuarios pertenecientes a un departamento dado.
 */
export function getUsersByDepartment(departamento: Departamento): UserAccount[] {
  return USERS.filter((u) => u.departamento === departamento);
}

/**
 * Busca un usuario por su identificador único.
 */
export function getUserById(id: string): UserAccount | undefined {
  return USERS.find((u) => u.id === id);
}

/**
 * Valida las credenciales de un usuario específico dentro de un departamento.
 */
export async function authenticateUser(
  departamento: string,
  usuarioNombre: string,
  password: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  if (!departamento || typeof departamento !== "string") {
    return { success: false, error: "Selecciona un departamento válido." };
  }

  const deptKey = departamento.trim() as Departamento;
  if (!DEPARTAMENTOS.includes(deptKey)) {
    return { success: false, error: `El departamento '${departamento}' no está registrado.` };
  }

  const deptUsers = getUsersByDepartment(deptKey);
  if (deptUsers.length === 0) {
    return { success: false, error: "No hay usuarios registrados para este departamento." };
  }

  // Si se especificó un nombre de usuario, buscar coincidencia (insensible a mayúsculas/minúsculas)
  const cleanUserName = (usuarioNombre || "").trim().toLowerCase();
  let userAccount = deptUsers.find((u) => u.nombre.toLowerCase() === cleanUserName);

  // Si no se envió nombre de usuario pero solo hay uno en el depto, usarlo por defecto
  if (!userAccount && !usuarioNombre && deptUsers.length === 1) {
    userAccount = deptUsers[0];
  }

  if (!userAccount) {
    return {
      success: false,
      error: `Por favor selecciona un usuario válido para ${departamento}.`,
    };
  }

  const cleanPassword = (password || "").trim();
  const isValidPassword = userAccount.allowedPasswords.some(
    (p) => p === cleanPassword
  );

  if (!isValidPassword) {
    return {
      success: false,
      error: `Contraseña incorrecta para ${userAccount.nombre} (${departamento}).`,
    };
  }

  const sessionUser: SessionUser = {
    id: userAccount.id,
    departamento: userAccount.departamento,
    nombre: userAccount.nombre,
    email: userAccount.email,
    role: userAccount.role,
  };

  return { success: true, user: sessionUser };
}

/**
 * Compatibilidad: valida login a nivel departamento seleccionando el primer usuario si no se especifica.
 */
export async function authenticateDepartment(
  departamento: string,
  password: string,
  usuarioNombre?: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  return authenticateUser(departamento, usuarioNombre || "", password);
}

/**
 * Determina si un departamento tiene permisos para ver o editar el inventario
 * (entrada de computadoras y teléfonos).
 * REGLA ESTRICTA: Solo Sistemas y Gerencia tienen acceso.
 * Marketing y Arquitectura NUNCA tienen acceso ni visibilidad de computadoras ni teléfonos.
 */
export function canManageInventory(departamento: string | undefined | null): boolean {
  if (!departamento || typeof departamento !== "string") return false;
  const clean = departamento.trim().toLowerCase();
  // Exclusión explícita para Marketing y Arquitectura
  if (clean === "marketing" || clean === "arquitectura") {
    return false;
  }
  return clean === "sistemas" || clean === "gerencia";
}
