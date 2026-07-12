migrate(
  (app) => {
    var users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
    } catch (_) {
      var record = new Record(users)
      record.setEmail('william@korenambiental.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      app.save(record)
    }
    var adminId = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com').id
    var now = new Date()
    var dayMs = 86400000
    var d = function (days) {
      return new Date(now.getTime() + days * dayMs).toISOString().split('T')[0]
    }

    var supCol = app.findCollectionByNameOrId('suppliers')
    var supplierDefs = [
      {
        name: 'Distribuidora Pescados Mar',
        contact: 'Contato',
        phone: '(11) 3456-7890',
        email: 'contato@pescadosmar.com',
        categories: 'Peixes e Frutos do Mar',
        products: '["Salmão","Camarão","Lula","Polvo"]',
        delivery_lead_time: 2,
        rating: 4.8,
        status: 'active',
      },
      {
        name: 'Hortifruti Central',
        contact: 'Contato',
        phone: '(11) 2345-6789',
        email: 'vendas@hortifruticentral.com',
        categories: 'Frutas e Verduras',
        products: '["Tomate","Cebola","Alho","Morango","Verduras"]',
        delivery_lead_time: 1,
        rating: 4.5,
        status: 'active',
      },
      {
        name: 'Laticínios Bom Campo',
        contact: 'Contato',
        phone: '(11) 4567-8901',
        email: 'pedidos@bomcampo.com',
        categories: 'Laticínios e Queijos',
        products: '["Leite","Queijo","Manteiga","Creme de Leite"]',
        delivery_lead_time: 3,
        rating: 4.7,
        status: 'active',
      },
      {
        name: 'Distribuidora Grãos Sul',
        contact: 'Contato',
        phone: '(11) 5678-9012',
        email: 'comercial@graosul.com',
        categories: 'Grãos e Cereais',
        products: '["Arroz","Feijão","Farinha","Lentilha"]',
        delivery_lead_time: 5,
        rating: 4.3,
        status: 'inactive',
      },
    ]
    var supplierIds = {}
    supplierDefs.forEach(function (s) {
      try {
        app.findFirstRecordByData('suppliers', 'name', s.name)
      } catch (_) {
        var r = new Record(supCol)
        r.set('name', s.name)
        r.set('contact', s.contact)
        r.set('phone', s.phone)
        r.set('email', s.email)
        r.set('categories', s.categories)
        r.set('products', s.products)
        r.set('delivery_lead_time', s.delivery_lead_time)
        r.set('rating', s.rating)
        r.set('status', s.status)
        app.save(r)
      }
      supplierIds[s.name] = app.findFirstRecordByData('suppliers', 'name', s.name).id
    })

    var miCol = app.findCollectionByNameOrId('menu_items')
    var menuDefs = [
      {
        name: 'Salmão Grelhado',
        price: 89.9,
        cost: 28.5,
        margin: 68.3,
        category: 'Prato Principal',
        active: true,
        ingredients:
          '[{"item":"Salmão","qty":0.2,"unit":"kg"},{"item":"Limão","qty":0.05,"unit":"kg"}]',
      },
      {
        name: 'Risoto de Funghi',
        price: 65.0,
        cost: 18.2,
        margin: 72.0,
        category: 'Prato Principal',
        active: true,
        ingredients:
          '[{"item":"Arroz","qty":0.15,"unit":"kg"},{"item":"Funghi","qty":0.05,"unit":"kg"}]',
      },
      {
        name: 'Torta de Morango',
        price: 22.0,
        cost: 6.5,
        margin: 70.4,
        category: 'Sobremesa',
        active: true,
        ingredients:
          '[{"item":"Morango","qty":0.1,"unit":"kg"},{"item":"Cream Cheese","qty":0.05,"unit":"kg"}]',
      },
    ]
    var menuIds = {}
    menuDefs.forEach(function (m) {
      try {
        app.findFirstRecordByData('menu_items', 'name', m.name)
      } catch (_) {
        var r = new Record(miCol)
        Object.keys(m).forEach(function (k) {
          r.set(k, m[k])
        })
        app.save(r)
      }
      menuIds[m.name] = app.findFirstRecordByData('menu_items', 'name', m.name).id
    })

    var invCol = app.findCollectionByNameOrId('inventory')
    var invDefs = [
      {
        name: 'Salmão Fresco',
        category: 'Peixes',
        location: 'Câmara Fria',
        quantity: 2,
        unit: 'kg',
        unit_cost: 85.0,
        min_stock: 5,
        expiry_date: d(2),
        status: 'critical',
        supplier: 'Distribuidora Pescados Mar',
      },
      {
        name: 'Tomate Longa Vida',
        category: 'Hortifruti',
        location: 'Geladeira',
        quantity: 25,
        unit: 'kg',
        unit_cost: 6.5,
        min_stock: 10,
        expiry_date: d(8),
        status: 'healthy',
        supplier: 'Hortifruti Central',
      },
      {
        name: 'Leite Integral',
        category: 'Laticínios',
        location: 'Geladeira',
        quantity: 12,
        unit: 'L',
        unit_cost: 4.5,
        min_stock: 20,
        expiry_date: d(2),
        status: 'warning',
        supplier: 'Laticínios Bom Campo',
      },
      {
        name: 'Arroz Branco',
        category: 'Secos',
        location: 'Estoque Seco',
        quantity: 50,
        unit: 'kg',
        unit_cost: 5.2,
        min_stock: 20,
        expiry_date: d(180),
        status: 'healthy',
        supplier: 'Distribuidora Grãos Sul',
      },
      {
        name: 'Batata Palito',
        category: 'Congelados',
        location: 'Freezer',
        quantity: 30,
        unit: 'kg',
        unit_cost: 12.0,
        min_stock: 15,
        expiry_date: d(120),
        status: 'healthy',
        supplier: 'Hortifruti Central',
      },
      {
        name: 'Morango Fresco',
        category: 'Hortifruti',
        location: 'Geladeira',
        quantity: 5,
        unit: 'kg',
        unit_cost: 15.0,
        min_stock: 3,
        expiry_date: d(1),
        status: 'warning',
        supplier: 'Hortifruti Central',
      },
      {
        name: 'Queijo Parmesão',
        category: 'Laticínios',
        location: 'Geladeira',
        quantity: 0,
        unit: 'kg',
        unit_cost: 45.0,
        min_stock: 2,
        expiry_date: d(-1),
        status: 'expired',
        supplier: 'Laticínios Bom Campo',
      },
      {
        name: 'Cebola',
        category: 'Hortifruti',
        location: 'Estoque Seco',
        quantity: 18,
        unit: 'kg',
        unit_cost: 3.5,
        min_stock: 10,
        expiry_date: d(15),
        status: 'healthy',
        supplier: 'Hortifruti Central',
      },
    ]
    var invIds = {}
    invDefs.forEach(function (item) {
      try {
        app.findFirstRecordByData('inventory', 'name', item.name)
      } catch (_) {
        var r = new Record(invCol)
        r.set('name', item.name)
        r.set('category', item.category)
        r.set('location', item.location)
        r.set('quantity', item.quantity)
        r.set('unit', item.unit)
        r.set('unit_cost', item.unit_cost)
        r.set('min_stock', item.min_stock)
        r.set('expiry_date', item.expiry_date)
        r.set('supplier_id', supplierIds[item.supplier])
        r.set('status', item.status)
        app.save(r)
      }
      invIds[item.name] = app.findFirstRecordByData('inventory', 'name', item.name).id
    })

    var wlCol = app.findCollectionByNameOrId('waste_logs')
    ;[
      { item: 'Morango Fresco', qty: 5, reason: 'Vencimento', loss: 75.0 },
      { item: 'Queijo Parmesão', qty: 2, reason: 'Vencimento', loss: 90.0 },
    ].forEach(function (w) {
      try {
        app.findFirstRecordByData('waste_logs', 'reason', w.reason)
      } catch (_) {
        var r = new Record(wlCol)
        r.set('item_id', invIds[w.item])
        r.set('quantity', w.qty)
        r.set('reason', w.reason)
        r.set('financial_loss', w.loss)
        r.set('date', d(0))
        app.save(r)
      }
    })

    var sdCol = app.findCollectionByNameOrId('sales_data')
    var salesDefs = [
      { item: 'Salmão Grelhado', qty: 5, date: d(-1), price: 449.5 },
      { item: 'Risoto de Funghi', qty: 8, date: d(-1), price: 520.0 },
      { item: 'Torta de Morango', qty: 12, date: d(-1), price: 264.0 },
      { item: 'Salmão Grelhado', qty: 7, date: d(-2), price: 629.3 },
      { item: 'Risoto de Funghi', qty: 6, date: d(-2), price: 390.0 },
    ]
    salesDefs.forEach(function (s, i) {
      try {
        app.findFirstRecordByData('sales_data', 'date', s.date + ' ' + i)
      } catch (_) {
        var r = new Record(sdCol)
        r.set('item_id', menuIds[s.item])
        r.set('quantity_sold', s.qty)
        r.set('date', s.date)
        r.set('total_price', s.price)
        app.save(r)
      }
    })

    var notCol = app.findCollectionByNameOrId('notifications')
    var notifDefs = [
      {
        type: 'stock_rupture',
        channel: 'internal',
        title: 'Ruptura de Estoque Iminente',
        message: 'Salmão Fresco abaixo da margem de segurança. Restam apenas 2kg.',
        priority: 'critical',
      },
      {
        type: 'expiry_warning',
        channel: 'push',
        title: 'Alerta de Vencimento',
        message: '5kg de Morango Fresco vencem amanhã. Ação recomendada: promoção.',
        priority: 'critical',
      },
      {
        type: 'purchase_needed',
        channel: 'sms',
        title: 'Pedido de Compra Enviado',
        message: 'Pré-pedido enviado para Laticínios Bom Campo: 30L de Leite Integral.',
        priority: 'warning',
      },
      {
        type: 'promotion',
        channel: 'internal',
        title: 'Nova Promoção Sugerida',
        message: 'Combo Tartar de Salmão + Bebida a R$ 79,90. Copy pronta para WhatsApp.',
        priority: 'success',
      },
      {
        type: 'supplier_preview',
        channel: 'push',
        title: 'Fornecedor Notificado',
        message: 'Hortifruti Central recebeu previsão de compra: 30kg de Tomate.',
        priority: 'info',
      },
    ]
    notifDefs.forEach(function (n) {
      try {
        app.findFirstRecordByData('notifications', 'title', n.title)
      } catch (_) {
        var r = new Record(notCol)
        r.set('user_id', adminId)
        r.set('type', n.type)
        r.set('channel', n.channel)
        r.set('title', n.title)
        r.set('message', n.message)
        r.set('priority', n.priority)
        r.set('read', false)
        app.save(r)
      }
    })
  },
  (app) => {},
)
