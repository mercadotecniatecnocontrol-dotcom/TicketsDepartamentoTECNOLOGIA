-- ============================================================================
-- TECNOCONTROL - SISTEMA DE SEGUIMIENTO DE TICKETS & INVENTARIO
-- Esquema y Migración Inicial para Supabase (PostgreSQL)
-- ============================================================================
-- Este script es idempotente (se puede ejecutar múltiples veces sin error).
-- Para aplicarlo:
-- 1. Ve a tu proyecto de Supabase (https://supabase.com/dashboard).
-- 2. Abre el apartado "SQL Editor" en el menú lateral izquierdo.
-- 3. Pega todo el contenido de este archivo y haz clic en "Run".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA: tickets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "user" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'progress', 'resolved')),
  date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Media',
  departamento TEXT NOT NULL,
  sucursal TEXT NOT NULL DEFAULT 'Chihuahua',
  ip TEXT DEFAULT '',
  detalles TEXT DEFAULT '',
  "fechaInicio" TEXT DEFAULT '',
  "fechaEsperada" TEXT DEFAULT '',
  respuesta TEXT DEFAULT '',
  evidencias TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_tickets_departamento ON public.tickets (departamento);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets (created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. TABLA: computadoras
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.computadoras (
  id TEXT PRIMARY KEY,
  equipo TEXT NOT NULL DEFAULT 'LAPTOP',
  ns TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  procesador TEXT NOT NULL,
  ram TEXT NOT NULL,
  "discoDuro" TEXT NOT NULL,
  estatus TEXT NOT NULL DEFAULT 'SIN ASIGNAR' CHECK (estatus IN ('SIN ASIGNAR', 'ASIGNADA', 'EN REPARACIÓN', 'BAJA')),
  usuario TEXT NOT NULL DEFAULT 'N/D',
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_computadoras_estatus ON public.computadoras (estatus);
CREATE INDEX IF NOT EXISTS idx_computadoras_usuario ON public.computadoras (usuario);

-- ----------------------------------------------------------------------------
-- 3. TABLA: telefonos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telefonos (
  id TEXT PRIMARY KEY,
  usuario TEXT NOT NULL,
  departamento TEXT NOT NULL,
  numero TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  imei TEXT NOT NULL,
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telefonos_departamento ON public.telefonos (departamento);
CREATE INDEX IF NOT EXISTS idx_telefonos_numero ON public.telefonos (numero);

-- ----------------------------------------------------------------------------
-- 4. SEGURIDAD Y POLÍTICAS (Row Level Security - RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telefonos ENABLE ROW LEVEL SECURITY;

-- Políticas para tickets
DROP POLICY IF EXISTS "tc_tickets_all_access" ON public.tickets;
CREATE POLICY "tc_tickets_all_access"
  ON public.tickets
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para computadoras
DROP POLICY IF EXISTS "tc_computadoras_all_access" ON public.computadoras;
CREATE POLICY "tc_computadoras_all_access"
  ON public.computadoras
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para telefonos
DROP POLICY IF EXISTS "tc_telefonos_all_access" ON public.telefonos;
CREATE POLICY "tc_telefonos_all_access"
  ON public.telefonos
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. SEMILLAS DE DATOS INICIALES (Inventario Base)
-- ----------------------------------------------------------------------------
INSERT INTO public.computadoras (id, equipo, ns, marca, modelo, procesador, ram, "discoDuro", estatus, usuario, observaciones)
VALUES
  ('COMP-1', 'LAPTOP', 'DYM26J4', 'DELL', 'LDC15250', 'INTEL CORE I5 1334', '16GB', 'SSD 512GB', 'SIN ASIGNAR', 'N/D', 'NUEVA LISTA PARA USAR'),
  ('COMP-2', 'LAPTOP', '1HK26J4', 'DELL', 'LDC15250', 'INTEL CORE I5 1334', '16GB', 'SSD 512GB', 'SIN ASIGNAR', 'N/D', 'NUEVA LISTA PARA USAR'),
  ('COMP-3', 'LAPTOP', '9J1DTH4', 'DELL', 'LDC15250', 'INTEL CORE I5 1334', '16GB', 'SSD 512GB', 'ASIGNADA', 'MAGALY CHAVEZ', 'NUEVA EN USO'),
  ('COMP-4', 'LAPTOP', '6MVD5J4', 'DELL', 'LDC15250', 'INTEL CORE I5H1334', '16GB', 'SSD 512GB', 'SIN ASIGNAR', 'N/D', 'NUEVA LISTA PARA USAR'),
  ('COMP-5', 'LAPTOP', 'C5GFTH4', 'DELL', 'LDC15250', 'INTEL CORE I5 1334', '16GB', 'SSD 512GB', 'SIN ASIGNAR', 'N/D', 'NUEVA LISTA PARA USAR'),
  ('COMP-6', 'LAPTOP', 'C2ZJXH4', 'DELL', 'LDC15250', 'INTEL CORE I5 1334', '16GB', 'SSD 512GB', 'ASIGNADA', 'OMAR RICARDO GARDEA G', 'NUEVA EN USO'),
  ('COMP-7', 'LAPTOP', '3CRCTH4', 'DELL', 'LDC15250', 'INTEL CORE I5 1334', '16GB', 'SSD 512GB', 'ASIGNADA', 'ADRIAN CANO', 'EN USO'),
  ('COMP-8', 'LAPTOP', '7M467M3', 'DELL', 'LATITUDE 5420', 'INTEL CORE I7 11TH', '16GB', 'SSD 512GB', 'ASIGNADA', 'KEVIN', 'NUEVA EN USO'),
  ('COMP-9', 'LAPTOP', '5TLS4M3', 'DELL', 'LATITUDE 5420', 'INTEL CORE I7 11TH', '16GB', 'SSD 512GB', 'SIN ASIGNAR', 'N/D', 'NUEVA EN USO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.telefonos (id, usuario, departamento, numero, marca, modelo, imei, observaciones)
VALUES
  ('TEL-1', 'GARDEA GIRON OMAR RICARDO', 'CHIHUAHUA ALMACEN', '6143849069', 'SAMSUNG', 'A57 5G', '357443195292272', 'NUEVO'),
  ('TEL-2', 'SOTO GARCIA CRUZ FRANCISCO', 'ALMACEN', '6142504774', 'SAMSUNG', 'A57 5G', '357443195286316', 'NUEVO'),
  ('TEL-3', 'CONTRERAS NIDIA', 'ABASTECIMIENTO- ALMACEN', '6141635895', 'SAMSUNG', 'A57 5G', '357443195288973', 'NUEVO'),
  ('TEL-4', 'BLANCO MUÑOZ CRISTINA LIZETH', 'GESTORIA', '6144545125', 'IPHONE', '11', '353979106874991', 'USADO'),
  ('TEL-5', 'CANO CORRAL HECTOR ADRIAN', 'OPERACIONES', '6143429806', 'SAMSUNG', 'A57 5G', '357443195291324', 'NUEVO'),
  ('TEL-6', 'ESCALANTE JARAMILLO ANA KAREN', 'GESTORIA', '6145941097', 'SAMSUNG', 'A10S', '357079102388363', 'USADO'),
  ('TEL-7', 'JAIME RUEL LUNA ESPINOZA', 'OPERACIONES', '6142781803', 'SAMSUNG', 'A57 5G', '337443195283602', 'NUEVO'),
  ('TEL-8', 'SAUL ISMAEL BARRAZA LUYA', 'OPERACIONES', '6141568460', 'SAMSUNG', 'A57 5G', '357443195291274', 'NUEVO'),
  ('TEL-9', 'EVA ALEJANDRA ESPINOZA', 'FACTURACION', '6141414198', 'OUKITEL', 'G1', '354964201551933', 'USADO'),
  ('TEL-10', 'KENIA GUZMAN', 'GESTORIA', '6142567708', 'OUKITEL', 'G1', '354964201157939', 'USADO'),
  ('TEL-11', 'SERGIO CARMONA LAGUNA', 'OPERACIONES', '6143499380', 'SAMSUNG', 'A57 5G', '357443195283487', 'USADO'),
  ('TEL-12', 'JOSUE HERNANDEZ PRIETO', 'OPERACIONES', '6141918610', 'SAMSUNG', 'A57 5G', '357443195267258', 'NUEVO')
ON CONFLICT (id) DO NOTHING;
