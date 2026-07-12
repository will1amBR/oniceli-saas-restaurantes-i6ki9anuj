migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var restId, suppId

    try {
      restId = app.findAuthRecordByEmail('_pb_users_auth_', 'restaurante@demo.oniceli.com').id
    } catch (_) {
      var restUser = new Record(usersCol)
      restUser.setEmail('restaurante@demo.oniceli.com')
      restUser.setPassword('Skip@Pass')
      restUser.setVerified(true)
      restUser.set('name', 'Restaurante Demo')
      restUser.set('role', 'restaurant')
      app.save(restUser)
      restId = restUser.id
    }

    try {
      suppId = app.findAuthRecordByEmail('_pb_users_auth_', 'fornecedor@demo.oniceli.com').id
    } catch (_) {
      var suppUser = new Record(usersCol)
      suppUser.setEmail('fornecedor@demo.oniceli.com')
      suppUser.setPassword('Skip@Pass')
      suppUser.setVerified(true)
      suppUser.set('name', 'Fornecedor Demo')
      suppUser.set('role', 'supplier')
      app.save(suppUser)
      suppId = suppUser.id
    }

    var now = new Date()
    var dayMs = 86400000
    var d = function (days) {
      return new Date(now.getTime() + days * dayMs).toISOString().split('T')[0]
    }

    var supCol = app.findCollectionByNameOrId('suppliers')
    var supplierData = [
      {
        name: 'Peixes do Atlântico',
        cat: 'Peixes e Frutos do Mar',
        products: '["Salmão","Camarão","Lula","Polvo","Atum"]',
        lead: 2,
        rating: 4.8,
        phone: '(11) 3456-7890',
        email: 'contato@peixesatlantico.com',
      },
      {
        name: 'Hortifruti Vale Verde',
        cat: 'Frutas e Verduras',
        products: '["Tomate","Cebola","Alho","Morango","Alface"]',
        lead: 1,
        rating: 4.5,
        phone: '(11) 2345-6789',
        email: 'vendas@valeverde.com',
      },
      {
        name: 'Laticínios Santa Clara',
        cat: 'Laticínios e Queijos',
        products: '["Leite","Queijo","Manteiga","Creme de Leite","Requeijão"]',
        lead: 3,
        rating: 4.7,
        phone: '(11) 4567-8901',
        email: 'pedidos@santaclara.com',
      },
      {
        name: 'Carnes Boi Norte',
        cat: 'Carnes',
        products: '["Filé Mignon","Picanha","Alcatra","Costela","Maminha"]',
        lead: 2,
        rating: 4.6,
        phone: '(11) 5678-9012',
        email: 'comercial@boinorte.com',
      },
      {
        name: 'Bebidas Premium Sul',
        cat: 'Bebidas',
        products: '["Vinho","Cerveja","Refrigerante","Suco","Água"]',
        lead: 4,
        rating: 4.4,
        phone: '(11) 6789-0123',
        email: 'vendas@premiumsul.com',
      },
    ]
    var supplierIds = {}
    supplierData.forEach(function (s) {
      try {
        app.findFirstRecordByData('suppliers', 'name', s.name)
      } catch (_) {
        var r = new Record(supCol)
        r.set('name', s.name)
        r.set('categories', s.cat)
        r.set('products', s.products)
        r.set('delivery_lead_time', s.lead)
        r.set('rating', s.rating)
        r.set('phone', s.phone)
        r.set('email', s.email)
        r.set('contact', 'Contato')
        r.set('status', 'active')
        r.set('user_id', restId)
        app.save(r)
      }
      supplierIds[s.name] = app.findFirstRecordByData('suppliers', 'name', s.name).id
    })

    var miCol = app.findCollectionByNameOrId('menu_items')
    var menuData = [
      {
        name: 'Salmão Grelhado',
        price: 89.9,
        cost: 28.5,
        margin: 68.3,
        cat: 'Prato Principal',
        ing: '[{"item":"Salmão","qty":0.2,"unit":"kg"},{"item":"Limão","qty":0.05,"unit":"kg"}]',
      },
      {
        name: 'Risoto de Funghi',
        price: 65.0,
        cost: 18.2,
        margin: 72.0,
        cat: 'Prato Principal',
        ing: '[{"item":"Arroz","qty":0.15,"unit":"kg"},{"item":"Funghi","qty":0.05,"unit":"kg"}]',
      },
      {
        name: 'Torta de Morango',
        price: 22.0,
        cost: 6.5,
        margin: 70.4,
        cat: 'Sobremesa',
        ing: '[{"item":"Morango","qty":0.1,"unit":"kg"},{"item":"Cream Cheese","qty":0.05,"unit":"kg"}]',
      },
      {
        name: 'Filé Mignon ao Molho',
        price: 95.0,
        cost: 35.0,
        margin: 63.2,
        cat: 'Prato Principal',
        ing: '[{"item":"Filé Mignon","qty":0.25,"unit":"kg"},{"item":"Manteiga","qty":0.02,"unit":"kg"}]',
      },
      {
        name: 'Salada Caesar',
        price: 38.0,
        cost: 9.5,
        margin: 75.0,
        cat: 'Entrada',
        ing: '[{"item":"Alface","qty":0.1,"unit":"kg"},{"item":"Queijo","qty":0.03,"unit":"kg"}]',
      },
    ]
    var menuIds = {}
    menuData.forEach(function (m) {
      try {
        app.findFirstRecordByData('menu_items', 'name', m.name)
      } catch (_) {
        var r = new Record(miCol)
        r.set('name', m.name)
        r.set('price', m.price)
        r.set('cost', m.cost)
        r.set('margin', m.margin)
        r.set('category', m.cat)
        r.set('ingredients', m.ing)
        r.set('active', true)
        r.set('user_id', restId)
        app.save(r)
      }
      menuIds[m.name] = app.findFirstRecordByData('menu_items', 'name', m.name).id
    })

    var invCol = app.findCollectionByNameOrId('inventory')
    var invData = [
      {
        name: 'Salmão Fresco',
        cat: 'Peixes',
        loc: 'Câmara Fria',
        qty: 2,
        unit: 'kg',
        cost: 85.0,
        min: 5,
        exp: d(2),
        status: 'critical',
        sup: 'Peixes do Atlântico',
      },
      {
        name: 'Tomate',
        cat: 'Hortifruti',
        loc: 'Geladeira',
        qty: 25,
        unit: 'kg',
        cost: 6.5,
        min: 10,
        exp: d(8),
        status: 'healthy',
        sup: 'Hortifruti Vale Verde',
      },
      {
        name: 'Leite Integral',
        cat: 'Laticínios',
        loc: 'Geladeira',
        qty: 12,
        unit: 'L',
        cost: 4.5,
        min: 20,
        exp: d(2),
        status: 'warning',
        sup: 'Laticínios Santa Clara',
      },
      {
        name: 'Filé Mignon',
        cat: 'Carnes',
        loc: 'Câmara Fria',
        qty: 8,
        unit: 'kg',
        cost: 45.0,
        min: 5,
        exp: d(5),
        status: 'healthy',
        sup: 'Carnes Boi Norte',
      },
      {
        name: 'Morango Fresco',
        cat: 'Hortifruti',
        loc: 'Geladeira',
        qty: 5,
        unit: 'kg',
        cost: 15.0,
        min: 3,
        exp: d(1),
        status: 'warning',
        sup: 'Hortifruti Vale Verde',
      },
    ]
    var invIds = {}
    invData.forEach(function (item) {
      try {
        app.findFirstRecordByData('inventory', 'name', item.name)
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
        r.set('supplier_id', supplierIds[item.sup])
        r.set('status', item.status)
        r.set('user_id', restId)
        app.save(r)
      }
      invIds[item.name] = app.findFirstRecordByData('inventory', 'name', item.name).id
    })

    var sdCol = app.findCollectionByNameOrId('sales_data')
    var salesData = [
      { item: 'Salmão Grelhado', qty: 5, date: d(-1), price: 449.5 },
      { item: 'Risoto de Funghi', qty: 8, date: d(-1), price: 520.0 },
      { item: 'Torta de Morango', qty: 12, date: d(-1), price: 264.0 },
      { item: 'Filé Mignon ao Molho', qty: 4, date: d(-1), price: 380.0 },
      { item: 'Salada Caesar', qty: 10, date: d(-2), price: 380.0 },
    ]
    salesData.forEach(function (s, i) {
      try {
        app.findFirstRecordByData('sales_data', 'date', s.date + ' ' + i)
      } catch (_) {
        var r = new Record(sdCol)
        r.set('item_id', menuIds[s.item])
        r.set('quantity_sold', s.qty)
        r.set('date', s.date)
        r.set('total_price', s.price)
        r.set('user_id', restId)
        app.save(r)
      }
    })

    var wlCol = app.findCollectionByNameOrId('waste_logs')
    var wasteData = [
      { item: 'Morango Fresco', qty: 2, reason: 'Vencimento', loss: 30.0 },
      { item: 'Salmão Fresco', qty: 0.5, reason: 'Preparação', loss: 42.5 },
      { item: 'Tomate', qty: 1, reason: 'Deterioração', loss: 6.5 },
      { item: 'Leite Integral', qty: 3, reason: 'Vencimento', loss: 13.5 },
      { item: 'Filé Mignon', qty: 0.3, reason: 'Preparação', loss: 13.5 },
    ]
    wasteData.forEach(function (w) {
      try {
        app.findFirstRecordByData('waste_logs', 'reason', w.reason + w.item)
      } catch (_) {
        var r = new Record(wlCol)
        r.set('item_id', invIds[w.item])
        r.set('quantity', w.qty)
        r.set('reason', w.reason)
        r.set('financial_loss', w.loss)
        r.set('date', d(0))
        r.set('user_id', restId)
        app.save(r)
      }
    })

    var notCol = app.findCollectionByNameOrId('notifications')
    var notifData = [
      {
        type: 'stock_rupture',
        title: 'Ruptura: Salmão Fresco',
        msg: 'Estoque crítico: 2kg. Mínimo: 5kg.',
        priority: 'critical',
        channel: 'internal',
      },
      {
        type: 'expiry_warning',
        title: 'Alerta: Morango Fresco',
        msg: 'Vence em 1 dia. 5kg em estoque.',
        priority: 'critical',
        channel: 'push',
      },
      {
        type: 'expiry_warning',
        title: 'Alerta: Leite Integral',
        msg: 'Vence em 2 dias. 12L em estoque.',
        priority: 'warning',
        channel: 'push',
      },
      {
        type: 'purchase_needed',
        title: 'Compra Sugerida',
        msg: 'Solicitar 30L de Leite Integral à Santa Clara.',
        priority: 'warning',
        channel: 'sms',
      },
      {
        type: 'promotion',
        title: 'Promoção Sugerida',
        msg: 'Combo Torta de Morango + Café a R$ 28,00.',
        priority: 'success',
        channel: 'internal',
      },
    ]
    notifData.forEach(function (n) {
      try {
        app.findFirstRecordByData('notifications', 'title', n.title)
      } catch (_) {
        var r = new Record(notCol)
        r.set('user_id', restId)
        r.set('type', n.type)
        r.set('title', n.title)
        r.set('message', n.msg)
        r.set('priority', n.priority)
        r.set('channel', n.channel)
        r.set('read', false)
        app.save(r)
      }
    })

    try {
      app.findFirstRecordByData('suppliers', 'name', 'Fornecedor Demo')
    } catch (_) {
      var suppRecord = new Record(supCol)
      suppRecord.set('name', 'Fornecedor Demo')
      suppRecord.set('categories', 'Peixes, Hortifruti, Laticínios')
      suppRecord.set('products', JSON.stringify(['Salmão', 'Camarão', 'Tomate', 'Leite', 'Queijo']))
      suppRecord.set('delivery_lead_time', 2)
      suppRecord.set('rating', 4.6)
      suppRecord.set('phone', '(11) 9999-8888')
      suppRecord.set('email', 'fornecedor@demo.oniceli.com')
      suppRecord.set('contact', 'Contato Demo')
      suppRecord.set('status', 'active')
      suppRecord.set('user_id', suppId)
      app.save(suppRecord)
    }
  },
  (app) => {},
)
