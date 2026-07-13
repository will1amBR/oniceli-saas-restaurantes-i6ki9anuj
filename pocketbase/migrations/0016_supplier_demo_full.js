migrate(
  (app) => {
    var user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste1.com.br')
    } catch (_) {
      var usersCol0 = app.findCollectionByNameOrId('_pb_users_auth_')
      user = new Record(usersCol0)
      user.setEmail('serena@teste1.com.br')
      user.setPassword('vaiterron@')
      user.setVerified(true)
      user.set('name', 'Serena Café Fornecedor')
      app.saveNoValidate(user)
    }

    if (user.getString('role') !== 'supplier') {
      user.set('role', 'supplier')
      user.set('name', 'Serena Café Fornecedor')
      app.saveNoValidate(user)
    }

    var userId = user.id

    var supplier
    try {
      supplier = app.findFirstRecordByFilter('suppliers', 'user_id = "' + userId + '"')
    } catch (_) {
      var supCol = app.findCollectionByNameOrId('suppliers')
      supplier = new Record(supCol)
      supplier.set('name', 'Serena Café Fornecedor')
      supplier.set('categories', 'Peixes, Frutas, Laticínios, Padaria, Secos, Carnes')
      supplier.set('delivery_lead_time', 2)
      supplier.set('rating', 4.7)
      supplier.set('status', 'active')
      supplier.set('user_id', userId)
      supplier.set(
        'products',
        JSON.stringify([
          { name: 'Salmão Fresco', sku: 'PEX-001', price: 85.0 },
          { name: 'Camarão', sku: 'PEX-002', price: 65.0 },
          { name: 'Tomate', sku: 'HORT-001', price: 6.5 },
          { name: 'Alface', sku: 'HORT-002', price: 4.0 },
          { name: 'Leite Integral', sku: 'LAT-001', price: 4.5 },
          { name: 'Queijo Mussarela', sku: 'LAT-002', price: 28.0 },
          { name: 'Arroz', sku: 'SEC-001', price: 5.2 },
          { name: 'Feijão', sku: 'SEC-002', price: 8.0 },
        ]),
      )
      app.save(supplier)
    }

    var restaurantUsers = []
    try {
      restaurantUsers = app.findRecordsByFilter('_pb_users_auth_', "role = 'restaurant'", '', 10, 0)
    } catch (_) {}

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var demoRestaurants = [
      { name: 'Bistrô La Maison', email: 'bistro@demo.oniceli.com' },
      { name: 'Cantina Italiana', email: 'cantina@demo.oniceli.com' },
      { name: 'Sushi Bar Yamato', email: 'sushi@demo.oniceli.com' },
      { name: 'Burger House SP', email: 'burger@demo.oniceli.com' },
      { name: 'Café Central', email: 'cafe@demo.oniceli.com' },
    ]
    demoRestaurants.forEach(function (dr) {
      try {
        var existing = app.findAuthRecordByEmail('_pb_users_auth_', dr.email)
        var has = restaurantUsers.some(function (u) {
          return u.id === existing.id
        })
        if (!has) restaurantUsers.push(existing)
      } catch (_) {
        var r = new Record(usersCol)
        r.setEmail(dr.email)
        r.setPassword('Skip@Pass')
        r.setVerified(true)
        r.set('name', dr.name)
        r.set('role', 'restaurant')
        app.save(r)
        restaurantUsers.push(r)
      }
    })

    if (restaurantUsers.length === 0) return

    var ordCol = app.findCollectionByNameOrId('orders')
    var statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    var itemTemplates = [
      [
        { name: 'Salmão Fresco', quantity: 5, unit: 'kg', price: 85.0 },
        { name: 'Camarão', quantity: 3, unit: 'kg', price: 65.0 },
      ],
      [
        { name: 'Tomate', quantity: 20, unit: 'kg', price: 6.5 },
        { name: 'Alface', quantity: 10, unit: 'kg', price: 4.0 },
      ],
      [
        { name: 'Leite Integral', quantity: 30, unit: 'L', price: 4.5 },
        { name: 'Queijo Mussarela', quantity: 8, unit: 'kg', price: 28.0 },
      ],
      [
        { name: 'Arroz', quantity: 50, unit: 'kg', price: 5.2 },
        { name: 'Feijão', quantity: 20, unit: 'kg', price: 8.0 },
      ],
      [
        { name: 'Salmão Fresco', quantity: 10, unit: 'kg', price: 85.0 },
        { name: 'Camarão', quantity: 5, unit: 'kg', price: 65.0 },
      ],
    ]

    statuses.forEach(function (status, idx) {
      var existing = []
      try {
        existing = app.findRecordsByFilter(
          'orders',
          'supplier_id = "' + supplier.id + '" && status = "' + status + '"',
          '',
          1,
          0,
        )
      } catch (_) {}
      if (existing.length > 0) return

      var rest = restaurantUsers[idx % restaurantUsers.length]
      var items = itemTemplates[idx]
      var total = items.reduce(function (sum, item) {
        return sum + item.quantity * item.price
      }, 0)

      var ord = new Record(ordCol)
      ord.set('restaurant_id', rest.id)
      ord.set('supplier_id', supplier.id)
      ord.set('items', JSON.stringify(items))
      ord.set('total_amount', Math.round(total * 100) / 100)
      ord.set('status', status)
      ord.set('payment_method', idx % 3 === 0 ? 'pix' : idx % 3 === 1 ? 'card' : 'installments')
      if (idx % 3 === 2) {
        ord.set('payment_terms', '30/60/90')
        ord.set('interest_applied', true)
        ord.set('interest_rate', 5)
      }
      app.save(ord)
    })

    var extraOrders = [
      { restIdx: 0, multiplier: 3, status: 'delivered' },
      { restIdx: 1, multiplier: 2, status: 'delivered' },
      { restIdx: 2, multiplier: 1, status: 'delivered' },
      { restIdx: 3, multiplier: 4, status: 'delivered' },
      { restIdx: 0, multiplier: 2, status: 'delivered' },
      { restIdx: 1, multiplier: 1, status: 'shipped' },
      { restIdx: 4, multiplier: 2, status: 'delivered' },
    ]

    extraOrders.forEach(function (ao) {
      if (ao.restIdx >= restaurantUsers.length) return
      var rest = restaurantUsers[ao.restIdx]
      var items = itemTemplates[ao.restIdx % itemTemplates.length]
      var total = items.reduce(function (sum, item) {
        return sum + item.quantity * item.price
      }, 0)
      total = total * ao.multiplier

      var ord = new Record(ordCol)
      ord.set('restaurant_id', rest.id)
      ord.set('supplier_id', supplier.id)
      ord.set('items', JSON.stringify(items))
      ord.set('total_amount', Math.round(total * 100) / 100)
      ord.set('status', ao.status)
      ord.set('payment_method', 'pix')
      app.save(ord)
    })
  },
  (app) => {},
)
