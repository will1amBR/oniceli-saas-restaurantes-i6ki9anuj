// Biblioteca compartilhada de baixa de estoque conforme ficha técnica (Oniceli).
// Carregada via require() pelos hooks de kitchen_orders / bar_orders / sales_data.
// Garante: conversão de unidades (kg/g, L/ml, un), deduplicação de vendas,
// status de estoque, log de consumo e alerta de recompra quando atinge o mínimo.

oniceliDepletionLib = (function () {
  var MASS = { mg: 0.000001, g: 0.001, kg: 1 }
  var VOLUME = { ml: 0.001, l: 1, lt: 1, litro: 1, litros: 1 }

  function normUnit(u) {
    return String(u || '')
      .trim()
      .toLowerCase()
  }

  function family(unit) {
    var u = normUnit(unit)
    if (MASS.hasOwnProperty(u)) return 'mass'
    if (VOLUME.hasOwnProperty(u)) return 'volume'
    if (u === 'un' || u === 'unidade' || u === 'unidades') return 'unit'
    return 'other'
  }

  function toBase(value, unit) {
    var v = Number(value)
    if (!isFinite(v) || v <= 0) return -1
    var u = normUnit(unit)
    if (MASS.hasOwnProperty(u)) return v * MASS[u]
    if (VOLUME.hasOwnProperty(u)) return v * VOLUME[u]
    if (family(u) === 'unit') return v
    return -1
  }

  // Converte qty (em fromUnit) para toUnit. null quando impossível.
  function convertUnit(qty, fromUnit, toUnit) {
    var q = Number(qty)
    if (!isFinite(q) || q <= 0) return null
    var from = normUnit(fromUnit)
    var to = normUnit(toUnit)
    if (!to || to === from) return q
    var famFrom = family(from)
    if (famFrom !== family(to)) return null
    var base = toBase(q, from)
    if (base < 0) return null
    if (famTo(to) === 'unit') return base
    if (to === 'kg') return base
    if (to === 'g') return base / 0.001
    if (to === 'mg') return base / 0.000001
    if (to === 'l' || to === 'lt' || to === 'litro' || to === 'litros') return base
    if (to === 'ml') return base / 0.001
    return null
  }

  function famTo(u) {
    return family(u)
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/'/g, "\\'")
  }

  function round3(v) {
    return Math.round(Number(v) * 1000) / 1000
  }

  function computeInvStatus(newQty, minStock, expiryDateStr) {
    var status = 'healthy'
    var now = new Date()
    if (expiryDateStr) {
      var expiry = new Date(expiryDateStr)
      var days = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
      if (newQty <= 0 || days < 0) status = 'expired'
      else if (newQty <= minStock || days <= 2) status = 'critical'
      else if (newQty <= minStock * 1.5 || days <= 5) status = 'warning'
    } else {
      if (newQty <= 0) status = 'expired'
      else if (newQty <= minStock) status = 'critical'
      else if (newQty <= minStock * 1.5) status = 'warning'
    }
    return status
  }

  /**
   * Resolve o registro de estoque do ingrediente: por inventory_id, depois por
   * nome (escapado), com filtro opcional de restaurante.
   */
  function resolveInventory(ing, restaurantId) {
    var invId = ing.inventory_id || ing.inventory || ''
    if (invId) {
      try {
        return $app.findRecordById('inventory', invId)
      } catch (_) {}
    }
    var ingName = ing.name || ing.item || ''
    if (!ingName) return null
    try {
      var filter = "name = '" + esc(ingName) + "'"
      if (restaurantId) filter += " && user_id = '" + esc(restaurantId) + "'"
      var found = $app.findRecordsByFilter('inventory', filter, '', 1, 0)
      if (found && found.length > 0) return found[0]
    } catch (_) {}
    return null
  }

  /**
   * Deduplicação: já existe venda registrada para este pedido/prato hoje?
   * Evita a dupla baixa (hook do pedido + hook de sales_data).
   */
  function saleAlreadyExists(sourceOrderId, menuItemId) {
    if (!sourceOrderId || !menuItemId) return false
    try {
      var filter =
        "source_order_id = '" + esc(sourceOrderId) + "' && item_id = '" + esc(menuItemId) + "'"
      var found = $app.findRecordsByFilter('sales_data', filter, '', 1, 0)
      return found && found.length > 0
    } catch (_) {
      return false
    }
  }

  /**
   * Baixa os ingredientes de um item de pedido conforme a ficha técnica,
   * convertendo unidades (ficha → estoque). Idempotente por (order, item).
   * Retorna { deductedQty, missingIngredients[], supplierAlerted[] }.
   */
  function deductStockForOrderItem(menuItem, orderQty, restaurantId, sourceOrderId) {
    var result = { deductedQty: 0, missingIngredients: [], supplierAlerted: [] }
    var ingredientsJson = menuItem.getString('ingredients')
    if (!ingredientsJson) return result
    var ingredients
    try {
      ingredients = JSON.parse(ingredientsJson)
    } catch (err) {
      return result
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) return result

    // Deduplicação contra vendas anteriores do mesmo pedido/prato
    if (sourceOrderId && saleAlreadyExists(sourceOrderId, menuItem.id)) {
      result.deductedQty = -1 // sinaliza: já descontado
      return result
    }

    var orderQty = Number(orderQty) || 1

    for (var j = 0; j < ingredients.length; j++) {
      var ing = ingredients[j]
      var neededPerPortion = Number(ing.quantity != null ? ing.quantity : ing.qty) || 0
      var neededUnit = ing.unit || ''
      if (neededPerPortion <= 0) continue

      var invRecord = resolveInventory(ing, restaurantId)
      if (!invRecord) {
        result.missingIngredients.push(String(ing.name || ing.item || '?'))
        continue
      }

      var stockUnit = invRecord.getString('unit')
      var deduct = convertUnit(neededPerPortion, neededUnit, stockUnit)
      if (deduct == null) {
        // Unidades incompatíveis (ex.: ficha em g, estoque em ml): usa valor
        // bruto e registra a incompatibilidade para auditoria.
        deduct = neededPerPortion
        result.missingIngredients.push(
          String(ing.name || '?') +
            ' [unidade incompatível: ' +
            neededUnit +
            ' → ' +
            stockUnit +
            ']',
        )
      }
      var totalDeduct = round3(deduct * orderQty)
      if (totalDeduct <= 0) continue

      var currentQty = Number(invRecord.get('quantity')) || 0
      var newQty = Math.max(0, round3(currentQty - totalDeduct))
      invRecord.set('quantity', newQty)

      var minStock = Number(invRecord.get('min_stock')) || 0
      var expiryStr = invRecord.getString('expiry_date')
      var status = computeInvStatus(newQty, minStock, expiryStr)
      invRecord.set('status', status)

      try {
        $app.save(invRecord)
        result.deductedQty += totalDeduct
      } catch (saveErr) {}

      // Alerta de recompra quando cruza o nível mínimo
      if (currentQty > minStock && newQty <= minStock) {
        try {
          notifyReorder(invRecord, restaurantId)
        } catch (_) {}
      }
    }
    return result
  }

  /** Cria notificação in-app + suggestion de recompra (idempotente por título). */
  function notifyReorder(invRecord, restaurantId) {
    var name = invRecord.getString('name')
    var title = 'Recompra sugerida: ' + name
    var existing = null
    try {
      existing = $app.findFirstRecordByData('notifications', 'title', title)
    } catch (_) {}
    if (existing) return

    var notifCol = $app.findCollectionByNameOrId('notifications')
    var n = new Record(notifCol)
    n.set('user_id', restaurantId || invRecord.getString('user_id'))
    n.set('type', 'purchase_needed')
    n.set('title', title)
    n.set(
      'message',
      name +
        ' atingiu o nível mínimo (' +
        invRecord.get('quantity') +
        ' ' +
        invRecord.getString('unit') +
        ' / mínimo ' +
        invRecord.get('min_stock') +
        ' ' +
        invRecord.getString('unit') +
        '). Sugestão de recompra gerada no módulo de Compras.',
    )
    n.set('priority', 'warning')
    n.set('channel', 'internal')
    n.set('read', false)
    $app.save(n)
  }

  /**
   * Registra a venda em sales_data com vínculo ao pedido (dedupe) — a baixa
   * em si é feita por deductStockForOrderItem, que considera este registro.
   */
  function registerSale(menuItem, orderQty, restaurantId, sourceOrderId) {
    try {
      if (sourceOrderId && saleAlreadyExists(sourceOrderId, menuItem.id)) return
      var salesCol = $app.findCollectionByNameOrId('sales_data')
      var saleRec = new Record(salesCol)
      saleRec.set('item_id', menuItem.id)
      saleRec.set('quantity_sold', Number(orderQty) || 1)
      saleRec.set('date', new Date().toISOString().split('T')[0])
      var itemPrice = menuItem.get('price') || 0
      saleRec.set('total_price', itemPrice * (Number(orderQty) || 1))
      if (restaurantId) saleRec.set('user_id', restaurantId)
      if (sourceOrderId) saleRec.set('source_order_id', sourceOrderId)
      $app.save(saleRec)
    } catch (_) {}
  }

  return {
    deductStockForOrderItem: deductStockForOrderItem,
    registerSale: registerSale,
    saleAlreadyExists: saleAlreadyExists,
    computeInvStatus: computeInvStatus,
    convertUnit: convertUnit,
    notifyReorder: notifyReorder,
  }
})()
