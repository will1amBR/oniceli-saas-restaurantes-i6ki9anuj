// Baixa de estoque para vendas registradas DIRETO em sales_data (sem passar
// por kitchen_orders/bar_orders — ex.: venda avulsa do cardápio digital).
// Se a venda veio de um pedido (source_order_id preenchido), a baixa já foi
// feita pelo hook do pedido — aqui só registra a dedupe e não desconta de novo.

onRecordAfterCreateSuccess((e) => {
  var sale = e.record
  var menuItemId = sale.getString('item_id')
  var quantitySold = Number(sale.get('quantity_sold')) || 0
  var sourceOrderId = sale.getString('source_order_id')

  if (!menuItemId || quantitySold <= 0) return e.next()

  var menuItem
  try {
    menuItem = $app.findRecordById('menu_items', menuItemId)
  } catch (err) {
    return e.next()
  }

  // Venda originada de pedido: baixa já feita (idempotência por dedupe na lib)
  if (sourceOrderId && oniceliDepletionLib.saleAlreadyExists(sourceOrderId, menuItemId)) {
    return e.next()
  }

  var restaurantId = sale.getString('user_id')
  var dedupeKey = sourceOrderId || 'sale:' + sale.getId()

  var res = oniceliDepletionLib.deductStockForOrderItem(
    menuItem,
    quantitySold,
    restaurantId,
    dedupeKey,
  )
  if (res.missingIngredients.length > 0) {
    console.log(
      '[oniceli] sales depletion incompleta prato ' +
        menuItem.getString('name') +
        ': ' +
        res.missingIngredients.join(', '),
    )
  }

  return e.next()
}, 'sales_data')
