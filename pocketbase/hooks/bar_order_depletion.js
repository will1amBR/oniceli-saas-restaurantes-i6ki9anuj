onRecordAfterUpdateSuccess((e) => {
  var order = e.record
  var currentStatus = order.getString('status')
  var isStockDeducted = order.getBool('stock_deducted')

  // Executa baixa somente quando status vira 'ready' ou 'delivered' e ainda não foi descontado
  if ((currentStatus !== 'ready' && currentStatus !== 'delivered') || isStockDeducted) {
    return e.next()
  }

  var itemsJson = order.getString('items')
  if (!itemsJson) return e.next()

  var items
  try {
    items = JSON.parse(itemsJson)
  } catch (err) {
    return e.next()
  }

  if (!Array.isArray(items) || items.length === 0) return e.next()

  var restaurantId = order.getString('restaurant_id')

  for (var i = 0; i < items.length; i++) {
    var orderItem = items[i]
    var menuItemId = orderItem.menu_item_id || orderItem.id
    var orderQty = orderItem.quantity || orderItem.qty || 1

    if (!menuItemId || orderQty <= 0) continue

    var menuItem
    try {
      menuItem = $app.findRecordById('menu_items', menuItemId)
    } catch (err) {
      // Se não achar por id, tenta buscar por nome
      if (orderItem.name) {
        try {
          var filter = "name = '" + orderItem.name.replace(/'/g, "\\'") + "'"
          if (restaurantId) {
            filter += " && user_id = '" + restaurantId + "'"
          }
          var found = $app.findRecordsByFilter('menu_items', filter, '', 1, 0)
          if (found && found.length > 0) {
            menuItem = found[0]
          }
        } catch (_) {}
      }
    }

    if (!menuItem) continue

    // Registra a venda em sales_data para histórico e relatórios de faturamento
    try {
      var salesCol = $app.findCollectionByNameOrId('sales_data')
      var saleRec = new Record(salesCol)
      saleRec.set('item_id', menuItem.id)
      saleRec.set('quantity_sold', orderQty)
      saleRec.set('date', new Date().toISOString().split('T')[0])
      var itemPrice = menuItem.get('price') || orderItem.price || 0
      saleRec.set('total_price', itemPrice * orderQty)
      if (restaurantId) {
        saleRec.set('user_id', restaurantId)
      }
      $app.save(saleRec)
    } catch (_) {}

    var ingredientsJson = menuItem.getString('ingredients')
    if (!ingredientsJson) continue

    var ingredients
    try {
      ingredients = JSON.parse(ingredientsJson)
    } catch (err) {
      continue
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) continue

    for (var j = 0; j < ingredients.length; j++) {
      var ing = ingredients[j]
      var invId = ing.inventory_id
      var neededPerPortion = ing.quantity || ing.qty || 0

      if (!neededPerPortion || neededPerPortion <= 0) continue

      var invRecord = null
      if (invId) {
        try {
          invRecord = $app.findRecordById('inventory', invId)
        } catch (_) {}
      }

      // Se não achou por inventory_id, tenta achar por nome do ingrediente
      if (!invRecord && (ing.name || ing.item)) {
        var ingName = ing.name || ing.item
        try {
          var invFilter = "name = '" + ingName.replace(/'/g, "\\'") + "'"
          if (restaurantId) {
            invFilter += " && user_id = '" + restaurantId + "'"
          }
          var invFound = $app.findRecordsByFilter('inventory', invFilter, '', 1, 0)
          if (invFound && invFound.length > 0) {
            invRecord = invFound[0]
          }
        } catch (_) {}
      }

      if (!invRecord) continue

      var currentQty = invRecord.get('quantity') || 0
      var totalDeduct = neededPerPortion * orderQty
      var newQty = currentQty - totalDeduct
      if (newQty < 0) newQty = 0

      invRecord.set('quantity', newQty)

      var minStock = invRecord.get('min_stock') || 0
      var expiryDateStr = invRecord.getString('expiry_date')
      var status = 'healthy'
      var now = new Date()

      if (expiryDateStr) {
        var expiry = new Date(expiryDateStr)
        var daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
        if (newQty <= 0 || daysUntilExpiry < 0) status = 'expired'
        else if (newQty <= minStock || daysUntilExpiry <= 2) status = 'critical'
        else if (newQty <= minStock * 1.5 || daysUntilExpiry <= 5) status = 'warning'
      } else {
        if (newQty <= 0) status = 'expired'
        else if (newQty <= minStock) status = 'critical'
        else if (newQty <= minStock * 1.5) status = 'warning'
      }

      invRecord.set('status', status)

      try {
        $app.save(invRecord)
      } catch (saveErr) {
        // ignora erro de salvamento de item isolado
      }
    }
  }

  // Marca que o estoque já foi descontado neste pedido
  try {
    order.set('stock_deducted', true)
    $app.save(order)
  } catch (_) {}

  return e.next()
}, 'bar_orders')
