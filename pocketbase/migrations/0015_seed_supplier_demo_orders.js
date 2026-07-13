migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var restaurantUsers = []
    try {
      restaurantUsers = app.findRecordsByFilter('_pb_users_auth_', "role = 'restaurant'", '', 20, 0)
    } catch (_) {}
    try {
      var w = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      var hasW = restaurantUsers.some(function (u) {
        return u.id === w.id
      })
      if (!hasW) restaurantUsers.push(w)
    } catch (_) {}
    try {
      var d = app.findAuthRecordByEmail('_pb_users_auth_', 'restaurante@demo.oniceli.com')
      var hasD = restaurantUsers.some(function (u) {
        return u.id === d.id
      })
      if (!hasD) restaurantUsers.push(d)
    } catch (_) {}

    var demoRestaurants = [
      { name: 'Bistrô La Maison', email: 'bistro@demo.oniceli.com' },
      { name: 'Cantina Italiana', email: 'cantina@demo.oniceli.com' },
      { name: 'Sushi Bar Yamato', email: 'sushi@demo.oniceli.com' },
      { name: 'Burger House SP', email: 'burger@demo.oniceli.com' },
    ]
    demoRestaurants.forEach(function (dr) {
      if (restaurantUsers.length >= 5) return
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', dr.email)
      } catch (_) {
        var r = new Record(usersCol)
        r.setEmail(dr.email)
        r.setPassword('Skip@Pass')
        r.setVerified(true)
        r.set('name', dr.name)
        r.set('role', 'restaurant')
        app.save(r)
      }
      try {
        var found = app.findAuthRecordByEmail('_pb_users_auth_', dr.email)
        var has = restaurantUsers.some(function (u) {
          return u.id === found.id
        })
        if (!has) restaurantUsers.push(found)
      } catch (_) {}
    })

    if (restaurantUsers.length === 0) return

    var suppliers = []
    try {
      suppliers = app.findRecordsByFilter('suppliers', '', '-created', 20, 0)
    } catch (_) {}
    if (suppliers.length === 0) return

    var supplier = suppliers[0]
    var supUserId = supplier.getString('user_id')
    if (!supUserId) {
      var supplierUser = null
      try {
        supplierUser = app.findAuthRecordByEmail('_pb_users_auth_', 'fornecedor@demo.oniceli.com')
      } catch (_) {
        var su = new Record(usersCol)
        su.setEmail('fornecedor@demo.oniceli.com')
        su.setPassword('Skip@Pass')
        su.setVerified(true)
        su.set('name', supplier.getString('name') || 'Fornecedor Demo')
        su.set('role', 'supplier')
        app.save(su)
        supplierUser = su
      }
      supplier.set('user_id', supplierUser.id)
      app.save(supplier)
    }

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
        { name: 'Filé Mignon', quantity: 10, unit: 'kg', price: 45.0 },
        { name: 'Picanha', quantity: 8, unit: 'kg', price: 52.0 },
      ],
    ]

    var now = new Date()
    var dayMs = 86400000

    statuses.forEach(function (status, idx) {
      var restaurant = restaurantUsers[idx % restaurantUsers.length]
      var existing = []
      try {
        existing = app.findRecordsByFilter(
          'orders',
          'restaurant_id = "' +
            restaurant.id +
            '" && supplier_id = "' +
            supplier.id +
            '" && status = "' +
            status +
            '"',
          '',
          1,
          0,
        )
      } catch (_) {}
      if (existing.length > 0) return

      var items = itemTemplates[idx % itemTemplates.length]
      var totalAmount = items.reduce(function (sum, item) {
        return sum + item.quantity * item.price
      }, 0)

      var ord = new Record(ordCol)
      ord.set('restaurant_id', restaurant.id)
      ord.set('supplier_id', supplier.id)
      ord.set('items', JSON.stringify(items))
      ord.set('total_amount', Math.round(totalAmount * 100) / 100)
      ord.set('status', status)
      ord.set('payment_method', idx % 3 === 0 ? 'pix' : idx % 3 === 1 ? 'card' : 'installments')
      if (idx % 3 === 2) {
        ord.set('payment_terms', '30/60/90')
        ord.set('interest_applied', true)
        ord.set('interest_rate', 5)
      }
      app.save(ord)
    })

    restaurantUsers.forEach(function (rest, i) {
      if (i < 2) return
      var existing = []
      try {
        existing = app.findRecordsByFilter(
          'orders',
          'restaurant_id = "' + rest.id + '" && supplier_id = "' + supplier.id + '"',
          '',
          1,
          0,
        )
      } catch (_) {}
      if (existing.length > 0) return

      var items = itemTemplates[i % itemTemplates.length]
      var totalAmount = items.reduce(function (sum, item) {
        return sum + item.quantity * item.price
      }, 0)
      var multiplier = i + 1

      var ord = new Record(ordCol)
      ord.set('restaurant_id', rest.id)
      ord.set('supplier_id', supplier.id)
      ord.set('items', JSON.stringify(items))
      ord.set('total_amount', Math.round(totalAmount * multiplier * 100) / 100)
      ord.set('status', 'delivered')
      ord.set('payment_method', i % 2 === 0 ? 'pix' : 'card')
      app.save(ord)
    })
  },
  (app) => {},
)
