migrate(
  (app) => {
    // 1. Atualizar a coleção users com novo perfil 'bar'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['restaurant', 'supplier', 'kitchen', 'waiter', 'bar']
      roleField.maxSelect = 1
    } else {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['restaurant', 'supplier', 'kitchen', 'waiter', 'bar'],
          maxSelect: 1,
        }),
      )
    }
    app.save(usersCol)

    // 2. Atualizar a coleção inventory com campos de dose em ml
    const invCol = app.findCollectionByNameOrId('inventory')
    if (!invCol.fields.getByName('volume_total_ml')) {
      invCol.fields.add(
        new NumberField({
          name: 'volume_total_ml',
          min: 0,
        }),
      )
    }
    if (!invCol.fields.getByName('dose_padrao_ml')) {
      invCol.fields.add(
        new NumberField({
          name: 'dose_padrao_ml',
          min: 0,
        }),
      )
    }
    if (!invCol.fields.getByName('real_stock_ml')) {
      invCol.fields.add(
        new NumberField({
          name: 'real_stock_ml',
          min: 0,
        }),
      )
    }
    app.save(invCol)

    // 3. Criar a coleção bar_orders para os pedidos do bar
    try {
      app.findCollectionByNameOrId('bar_orders')
    } catch (_) {
      const barOrders = new Collection({
        name: 'bar_orders',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'restaurant_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'waiter_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'table_number', type: 'text', required: true },
          { name: 'customer_name', type: 'text' },
          { name: 'items', type: 'json' },
          {
            name: 'status',
            type: 'select',
            values: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
            maxSelect: 1,
          },
          { name: 'total_amount', type: 'number' },
          { name: 'notes', type: 'text' },
          { name: 'stock_deducted', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_barorders_restaurant ON bar_orders (restaurant_id)',
          'CREATE INDEX idx_barorders_status ON bar_orders (status)',
          'CREATE INDEX idx_barorders_created ON bar_orders (created)',
        ],
      })
      app.save(barOrders)
    }

    // 4. Buscar restaurante demo e criar demo user do bar
    let serenaRestaurant = null
    try {
      serenaRestaurant = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste.com.br')
    } catch (_) {
      try {
        serenaRestaurant = app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'william@korenambiental.com',
        )
      } catch (_) {}
    }

    const restId = serenaRestaurant ? serenaRestaurant.id : ''

    // Criar Usuário Bar demo
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'bar@demo.oniceli.com')
    } catch (_) {
      const barUser = new Record(usersCol)
      barUser.setEmail('bar@demo.oniceli.com')
      barUser.setPassword('Skip@Pass')
      barUser.setVerified(true)
      barUser.set('name', 'Bartender Lucas (Bar)')
      barUser.set('role', 'bar')
      if (restId) barUser.set('restaurant_id', restId)
      app.save(barUser)
    }

    // 5. Popular ingredientes líquidos com doses e bebidas alcoólicas / drinks demo
    const menuCol = app.findCollectionByNameOrId('menu_items')
    const barOrdersCol = app.findCollectionByNameOrId('bar_orders')

    // 5.1 Ingredientes líquidos (Vodka, Cachaça, Gin, Rum, Whisky, Xarope de Açúcar, Licor de Laranja)
    const liquidIngredients = [
      {
        name: 'Vodka Absolut 1L',
        category: 'Bebidas Alcoólicas',
        location: 'Estoque Seco',
        quantity: 2850, // 2850 ml em estoque (~57 doses)
        unit: 'ml',
        unit_cost: 0.09, // R$ 90/L = 0.09/ml (dose de 50ml = R$ 4,50)
        min_stock: 500,
        volume_total_ml: 1000,
        dose_padrao_ml: 50,
        real_stock_ml: 2750, // contagem física real demo para desvio
        status: 'healthy',
      },
      {
        name: 'Cachaça Artesanal 1L',
        category: 'Bebidas Alcoólicas',
        location: 'Estoque Seco',
        quantity: 1800, // 1800 ml (~36 doses)
        unit: 'ml',
        unit_cost: 0.05, // R$ 50/L = 0.05/ml (dose de 50ml = R$ 2,50)
        min_stock: 400,
        volume_total_ml: 1000,
        dose_padrao_ml: 50,
        real_stock_ml: 1650, // contagem física real demo
        status: 'healthy',
      },
      {
        name: 'Gin Tanqueray 750ml',
        category: 'Bebidas Alcoólicas',
        location: 'Estoque Seco',
        quantity: 1400, // 1400 ml (~28 doses)
        unit: 'ml',
        unit_cost: 0.14, // R$ 105/750ml = 0.14/ml (dose de 50ml = R$ 7,00)
        min_stock: 300,
        volume_total_ml: 750,
        dose_padrao_ml: 50,
        real_stock_ml: 1400,
        status: 'healthy',
      },
      {
        name: 'Whisky Black Label 1L',
        category: 'Bebidas Alcoólicas',
        location: 'Estoque Seco',
        quantity: 1900,
        unit: 'ml',
        unit_cost: 0.18, // R$ 180/L = 0.18/ml (dose de 50ml = R$ 9,00)
        min_stock: 400,
        volume_total_ml: 1000,
        dose_padrao_ml: 50,
        real_stock_ml: 1720,
        status: 'healthy',
      },
      {
        name: 'Xarope Simples de Açúcar',
        category: 'Xaropes e Caldas',
        location: 'Geladeira',
        quantity: 2000,
        unit: 'ml',
        unit_cost: 0.015,
        min_stock: 500,
        volume_total_ml: 1000,
        dose_padrao_ml: 20,
        real_stock_ml: 1950,
        status: 'healthy',
      },
      {
        name: 'Água Tônica 350ml',
        category: 'Bebidas Não Alcoólicas',
        location: 'Geladeira',
        quantity: 40,
        unit: 'un',
        unit_cost: 3.5,
        min_stock: 12,
        volume_total_ml: 350,
        dose_padrao_ml: 150,
        real_stock_ml: 40,
        status: 'healthy',
      },
    ]

    const savedIngredientsMap = {}

    liquidIngredients.forEach((item) => {
      let rec = null
      try {
        let filter = "name = '" + item.name.replace(/'/g, "\\'") + "'"
        if (restId) filter += " && user_id = '" + restId + "'"
        const found = app.findRecordsByFilter('inventory', filter, '', 1, 0)
        if (found && found.length > 0) {
          rec = found[0]
        }
      } catch (_) {}

      if (!rec) {
        rec = new Record(invCol)
      }
      rec.set('name', item.name)
      rec.set('category', item.category)
      rec.set('location', item.location)
      rec.set('quantity', item.quantity)
      rec.set('unit', item.unit)
      rec.set('unit_cost', item.unit_cost)
      rec.set('min_stock', item.min_stock)
      rec.set('volume_total_ml', item.volume_total_ml)
      rec.set('dose_padrao_ml', item.dose_padrao_ml)
      rec.set('real_stock_ml', item.real_stock_ml)
      rec.set('status', item.status)
      if (restId) rec.set('user_id', restId)
      app.save(rec)
      savedIngredientsMap[item.name] = rec
    })

    // 5.2 Cardápio de Drinks / Bebidas
    const drinksMenu = [
      {
        name: 'Caipirinha Tradicional',
        category: 'Drinks & Coquetéis',
        price: 28.0,
        cost: 3.5,
        margin: 87.5,
        active: true,
        ingredients: [
          {
            inventory_id: savedIngredientsMap['Cachaça Artesanal 1L']?.id || '',
            name: 'Cachaça Artesanal 1L',
            quantity: 50,
            unit: 'ml',
          },
          {
            inventory_id: savedIngredientsMap['Xarope Simples de Açúcar']?.id || '',
            name: 'Xarope Simples de Açúcar',
            quantity: 20,
            unit: 'ml',
          },
        ],
      },
      {
        name: 'Gin Tônica Clássico',
        category: 'Drinks & Coquetéis',
        price: 36.0,
        cost: 8.5,
        margin: 76.4,
        active: true,
        ingredients: [
          {
            inventory_id: savedIngredientsMap['Gin Tanqueray 750ml']?.id || '',
            name: 'Gin Tanqueray 750ml',
            quantity: 50,
            unit: 'ml',
          },
          {
            inventory_id: savedIngredientsMap['Água Tônica 350ml']?.id || '',
            name: 'Água Tônica 350ml',
            quantity: 1,
            unit: 'un',
          },
        ],
      },
      {
        name: 'Vodka Martini Especial',
        category: 'Drinks & Coquetéis',
        price: 34.0,
        cost: 5.8,
        margin: 82.9,
        active: true,
        ingredients: [
          {
            inventory_id: savedIngredientsMap['Vodka Absolut 1L']?.id || '',
            name: 'Vodka Absolut 1L',
            quantity: 60,
            unit: 'ml',
          },
          {
            inventory_id: savedIngredientsMap['Xarope Simples de Açúcar']?.id || '',
            name: 'Xarope Simples de Açúcar',
            quantity: 10,
            unit: 'ml',
          },
        ],
      },
      {
        name: 'Dose Whisky Black Label (50ml)',
        category: 'Doses & Destilados',
        price: 32.0,
        cost: 9.0,
        margin: 71.9,
        active: true,
        ingredients: [
          {
            inventory_id: savedIngredientsMap['Whisky Black Label 1L']?.id || '',
            name: 'Whisky Black Label 1L',
            quantity: 50,
            unit: 'ml',
          },
        ],
      },
      {
        name: 'Dose Cachaça Artesanal (50ml)',
        category: 'Doses & Destilados',
        price: 16.0,
        cost: 2.5,
        margin: 84.4,
        active: true,
        ingredients: [
          {
            inventory_id: savedIngredientsMap['Cachaça Artesanal 1L']?.id || '',
            name: 'Cachaça Artesanal 1L',
            quantity: 50,
            unit: 'ml',
          },
        ],
      },
    ]

    const savedDrinksMap = {}

    drinksMenu.forEach((drink) => {
      let rec = null
      try {
        let filter = "name = '" + drink.name.replace(/'/g, "\\'") + "'"
        if (restId) filter += " && user_id = '" + restId + "'"
        const found = app.findRecordsByFilter('menu_items', filter, '', 1, 0)
        if (found && found.length > 0) {
          rec = found[0]
        }
      } catch (_) {}

      if (!rec) {
        rec = new Record(menuCol)
      }
      rec.set('name', drink.name)
      rec.set('category', drink.category)
      rec.set('price', drink.price)
      rec.set('cost', drink.cost)
      rec.set('margin', drink.margin)
      rec.set('active', drink.active)
      rec.set('ingredients', JSON.stringify(drink.ingredients))
      if (restId) rec.set('user_id', restId)
      app.save(rec)
      savedDrinksMap[drink.name] = rec
    })

    // 5.3 Pedidos Demo de Bar em cada status (pending, preparing, ready, delivered)
    const demoBarOrders = [
      {
        table_number: '12',
        customer_name: 'Marcos Silva',
        status: 'pending',
        notes: 'Caprichar no gelo e limão espremido',
        total_amount: 64.0,
        stock_deducted: false,
        items: [
          {
            menu_item_id: savedDrinksMap['Caipirinha Tradicional']?.id || '',
            name: 'Caipirinha Tradicional',
            price: 28.0,
            quantity: 1,
            notes: 'Com pouco açúcar',
          },
          {
            menu_item_id: savedDrinksMap['Gin Tônica Clássico']?.id || '',
            name: 'Gin Tônica Clássico',
            price: 36.0,
            quantity: 1,
            notes: 'Rodela de limão siciliano',
          },
        ],
      },
      {
        table_number: '04',
        customer_name: 'Camila Fernandes',
        status: 'preparing',
        notes: 'Taça bem gelada',
        total_amount: 68.0,
        stock_deducted: false,
        items: [
          {
            menu_item_id: savedDrinksMap['Vodka Martini Especial']?.id || '',
            name: 'Vodka Martini Especial',
            price: 34.0,
            quantity: 2,
            notes: '',
          },
        ],
      },
      {
        table_number: 'Balcão 02',
        customer_name: 'Renato Oliveira',
        status: 'ready',
        notes: 'Cliente aguardando no balcão',
        total_amount: 32.0,
        stock_deducted: true,
        items: [
          {
            menu_item_id: savedDrinksMap['Dose Whisky Black Label (50ml)']?.id || '',
            name: 'Dose Whisky Black Label (50ml)',
            price: 32.0,
            quantity: 1,
            notes: 'Com gelo de coco à parte',
          },
        ],
      },
      {
        table_number: '08',
        customer_name: 'Beatriz Costa',
        status: 'delivered',
        notes: 'Pedido entregue com sucesso',
        total_amount: 56.0,
        stock_deducted: true,
        items: [
          {
            menu_item_id: savedDrinksMap['Caipirinha Tradicional']?.id || '',
            name: 'Caipirinha Tradicional',
            price: 28.0,
            quantity: 2,
            notes: '',
          },
        ],
      },
    ]

    demoBarOrders.forEach((bo) => {
      const orderRec = new Record(barOrdersCol)
      orderRec.set('table_number', bo.table_number)
      orderRec.set('customer_name', bo.customer_name)
      orderRec.set('status', bo.status)
      orderRec.set('notes', bo.notes)
      orderRec.set('total_amount', bo.total_amount)
      orderRec.set('stock_deducted', bo.stock_deducted)
      orderRec.set('items', JSON.stringify(bo.items))
      if (restId) orderRec.set('restaurant_id', restId)
      app.save(orderRec)
    })
  },
  (app) => {
    try {
      const barOrders = app.findCollectionByNameOrId('bar_orders')
      app.delete(barOrders)
    } catch (_) {}
  },
)
