migrate(
  (app) => {
    var restId = ''
    var suppRecordId = ''

    try {
      restId = app.findAuthRecordByEmail('_pb_users_auth_', 'restaurante@demo.oniceli.com').id
    } catch (_) {}
    try {
      suppRecordId = app.findFirstRecordByData('suppliers', 'name', 'Fornecedor Demo').id
    } catch (_) {}

    if (!restId) return

    var now = new Date()
    var dayMs = 86400000
    var d = function (days) {
      return new Date(now.getTime() + days * dayMs).toISOString().split('T')[0]
    }

    var invCol = app.findCollectionByNameOrId('inventory')
    var hortifrutiSupId = ''
    var carnesSupId = ''
    try {
      hortifrutiSupId = app.findFirstRecordByData('suppliers', 'name', 'Hortifruti Vale Verde').id
    } catch (_) {}
    try {
      carnesSupId = app.findFirstRecordByData('suppliers', 'name', 'Carnes Boi Norte').id
    } catch (_) {}

    var newInvItems = [
      {
        name: 'Arroz',
        cat: 'Secos',
        loc: 'Estoque Seco',
        qty: 50,
        unit: 'kg',
        cost: 5.2,
        min: 20,
        exp: d(180),
        status: 'healthy',
        sup: hortifrutiSupId,
      },
      {
        name: 'Pato',
        cat: 'Carnes',
        loc: 'Câmara Fria',
        qty: 10,
        unit: 'kg',
        cost: 35.0,
        min: 5,
        exp: d(5),
        status: 'healthy',
        sup: carnesSupId,
      },
      {
        name: 'Quinoa',
        cat: 'Secos',
        loc: 'Estoque Seco',
        qty: 5,
        unit: 'kg',
        cost: 18.0,
        min: 2,
        exp: d(120),
        status: 'healthy',
        sup: hortifrutiSupId,
      },
    ]

    var invIds = {}
    newInvItems.forEach(function (item) {
      try {
        invIds[item.name] = app.findFirstRecordByData('inventory', 'name', item.name).id
      } catch (_) {
        var r = new Record(invCol)
        r.set('name', item.name)
        r.set('category', item.cat)
        r.set('location', item.loc)
        r.set('quantity', item.qty)
        r.set('unit', item.unit)
        r.set('unit_cost', item.cost)
        r.set('min_stock', item.min)
        r.set('expiry_date', item.exp)
        if (item.sup) r.set('supplier_id', item.sup)
        r.set('status', item.status)
        r.set('user_id', restId)
        app.save(r)
        invIds[item.name] = r.id
      }
    })

    var miCol = app.findCollectionByNameOrId('menu_items')
    try {
      app.findFirstRecordByData('menu_items', 'name', 'Arroz de Pato')
    } catch (_) {
      var ingredients = JSON.stringify([
        { inventory_id: invIds['Arroz'], name: 'Arroz', quantity: 0.2, unit: 'kg' },
        { inventory_id: invIds['Pato'], name: 'Pato', quantity: 0.2, unit: 'kg' },
        { inventory_id: invIds['Quinoa'], name: 'Quinoa', quantity: 0.08, unit: 'kg' },
      ])
      var totalCost = 0.2 * 5.2 + 0.2 * 35.0 + 0.08 * 18.0
      var margin = 65.0
      var price = totalCost / (1 - margin / 100)

      var mi = new Record(miCol)
      mi.set('name', 'Arroz de Pato')
      mi.set('price', Math.round(price * 100) / 100)
      mi.set('cost', Math.round(totalCost * 100) / 100)
      mi.set('margin', margin)
      mi.set('category', 'Prato Principal')
      mi.set('ingredients', ingredients)
      mi.set('active', true)
      mi.set('user_id', restId)
      app.save(mi)
    }

    if (suppRecordId) {
      var ordCol = app.findCollectionByNameOrId('orders')

      var existingPending = app.findRecordsByFilter(
        'orders',
        'restaurant_id = "' + restId + '" && status = "pending"',
        '',
        1,
        0,
      )
      if (existingPending.length === 0) {
        var ord1 = new Record(ordCol)
        ord1.set('restaurant_id', restId)
        ord1.set('supplier_id', suppRecordId)
        ord1.set(
          'items',
          JSON.stringify([
            { name: 'Salmão', quantity: 5, unit: 'kg', price: 85.0 },
            { name: 'Camarão', quantity: 3, unit: 'kg', price: 65.0 },
          ]),
        )
        ord1.set('total_amount', 5 * 85.0 + 3 * 65.0)
        ord1.set('status', 'pending')
        app.save(ord1)
      }

      var existingProcessing = app.findRecordsByFilter(
        'orders',
        'restaurant_id = "' + restId + '" && status = "processing"',
        '',
        1,
        0,
      )
      if (existingProcessing.length === 0) {
        var ord2 = new Record(ordCol)
        ord2.set('restaurant_id', restId)
        ord2.set('supplier_id', suppRecordId)
        ord2.set(
          'items',
          JSON.stringify([
            { name: 'Leite', quantity: 20, unit: 'L', price: 4.5 },
            { name: 'Queijo', quantity: 5, unit: 'kg', price: 45.0 },
          ]),
        )
        ord2.set('total_amount', 20 * 4.5 + 5 * 45.0)
        ord2.set('status', 'processing')
        app.save(ord2)
      }

      var existingShipped = app.findRecordsByFilter(
        'orders',
        'restaurant_id = "' + restId + '" && status = "shipped"',
        '',
        1,
        0,
      )
      if (existingShipped.length === 0) {
        var ord3 = new Record(ordCol)
        ord3.set('restaurant_id', restId)
        ord3.set('supplier_id', suppRecordId)
        ord3.set(
          'items',
          JSON.stringify([{ name: 'Filé Mignon', quantity: 8, unit: 'kg', price: 45.0 }]),
        )
        ord3.set('total_amount', 8 * 45.0)
        ord3.set('status', 'shipped')
        app.save(ord3)
      }
    }
  },
  (app) => {},
)
