// Baixa de estoque conforme a ficha técnica quando um pedido de cozinha fica
// pronto. Requer o campo stock_deducted (idempotência) — já no schema.
// Unidades normalizadas pela lib compartilhada (kg/g, L/ml, un).

onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  if (record.getString('status') !== 'ready') return
  if (record.getBool('stock_deducted') === true) return

  const items = JSON.parse(record.getString('items') || '[]')
  const restaurantId = record.getString('user_id')
  const orderId = record.getId()

  let deducted = false
  for (const item of items) {
    let menuItem = null
    try {
      menuItem = $app.findRecordById('menu_items', item.menu_item_id)
    } catch (_) {
      // Fallback por nome — cardápio digital pode não enviar o id
      try {
        const found = $app.findRecordsByFilter(
          'menu_items',
          "name = '" + String(item.name || '').replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (found.length > 0) menuItem = found[0]
      } catch (_) {}
    }
    if (!menuItem) continue
    try {
      const res = oniceliDepletionLib.deductStockForOrderItem(
        menuItem,
        item.quantity,
        restaurantId,
        orderId + ':' + menuItem.id,
      )
      if (res.deductedQty > 0 || res.missingIngredients.length > 0) deducted = true
      if (res.missingIngredients.length > 0) {
        console.log(
          '[oniceli] kitchen depletion incompleta pedido ' +
            orderId +
            ' prato ' +
            menuItem.getString('name') +
            ': ' +
            res.missingIngredients.join(', '),
        )
      }
    } catch (err) {
      console.log('[oniceli] kitchen depletion error:', err)
    }
  }

  if (deducted) {
    record.set('stock_deducted', true)
    $app.save(record)
  }
}, 'kitchen_orders')
