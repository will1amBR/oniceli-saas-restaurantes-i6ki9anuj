onRecordAfterCreateSuccess((e) => {
  var sale = e.record
  var menuItemId = sale.getString('item_id')
  var quantitySold = sale.get('quantity_sold')

  if (!menuItemId || !quantitySold || quantitySold <= 0) return e.next()

  var menuItem
  try {
    menuItem = $app.findRecordById('menu_items', menuItemId)
  } catch (err) {
    return e.next()
  }

  var ingredientsJson = menuItem.getString('ingredients')
  if (!ingredientsJson) return e.next()

  var ingredients
  try {
    ingredients = JSON.parse(ingredientsJson)
  } catch (err) {
    return e.next()
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) return e.next()

  for (var i = 0; i < ingredients.length; i++) {
    var ing = ingredients[i]
    if (!ing.inventory_id || !ing.quantity) continue

    var invRecord
    try {
      invRecord = $app.findRecordById('inventory', ing.inventory_id)
    } catch (err) {
      continue
    }

    var currentQty = invRecord.get('quantity') || 0
    var deductQty = quantitySold * ing.quantity
    var newQty = currentQty - deductQty
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
    } catch (err) {
      // skip save errors
    }
  }

  return e.next()
}, 'sales_data')
