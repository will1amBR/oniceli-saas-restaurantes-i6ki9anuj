// Normalização de unidades para baixa de estoque conforme ficha técnica.
// Garante que quantidades escritas na ficha na unidade do INGREDIENTE sejam
// convertidas para a unidade de COMPRA/ESTOQUE do insumo (ex.: dose 50 ml
// desconta 0,05 L de uma garrafa de 1 L — nunca a garrafa inteira).

const MASS = { mg: 0.000001, g: 0.001, kg: 1 } as const
const VOLUME = { ml: 0.001, l: 1, lt: 1, litro: 1, litros: 1 } as const

/** Converte um valor para a unidade base da família (kg ou L). -1 se desconhecida. */
export function toBaseUnits(value: number, unit: string): number {
  if (!isFinite(value) || value <= 0) return -1
  const u = (unit || '').trim().toLowerCase()
  if (u in MASS) return value * (MASS as any)[u]
  if (u in VOLUME) return value * (VOLUME as any)[u]
  if (u === 'un' || u === 'unidade' || u === 'unidades') return value
  return -1
}

/** Família da unidade: 'mass' | 'volume' | 'unit' | 'other' */
export function unitFamily(unit: string): 'mass' | 'volume' | 'unit' | 'other' {
  const u = (unit || '').trim().toLowerCase()
  if (u in MASS) return 'mass'
  if (u in VOLUME) return 'volume'
  if (u === 'un' || u === 'unidade' || u === 'unidades') return 'unit'
  return 'other'
}

/**
 * Converte `qty` (expresso em `fromUnit`, ex.: unidade da ficha técnica do
 * ingrediente) para `toUnit` (unidade do estoque). Retorna null quando a
 * conversão é impossível (famílias diferentes / unidades desconhecidas).
 */
export function convertUnit(qty: number, fromUnit: string, toUnit: string): number | null {
  const to = (toUnit || '').trim().toLowerCase()
  if (!isFinite(qty) || qty <= 0) return null
  if (!to || to === (fromUnit || '').trim().toLowerCase()) return qty

  const baseFrom = toBaseUnits(qty, fromUnit)
  if (baseFrom < 0) return null

  // família da unidade de destino
  const famTo = unitFamily(to)
  const famFrom = unitFamily(fromUnit)
  if (famFrom !== famTo) return null

  // desmonta o destino para a base
  if (famTo === 'unit') return baseFrom
  if (famTo === 'mass') {
    if (to === 'kg') return baseFrom
    if (to === 'g') return baseFrom / 0.001
    if (to === 'mg') return baseFrom / 0.000001
  }
  if (famTo === 'volume') {
    if (to === 'l' || to === 'lt' || to === 'litro' || to === 'litros') return baseFrom
    if (to === 'ml') return baseFrom / 0.001
  }
  return null
}

/** Rótulo legível da família, para exibição (kg→g, ml→L etc.) */
export function formatQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 1000) / 1000
  return `${rounded} ${unit}`
}
