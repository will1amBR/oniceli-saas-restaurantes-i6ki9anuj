migrate(
  (app) => {
    // 1. Criar collection daily_consumptions
    try {
      app.findCollectionByNameOrId('daily_consumptions')
    } catch (_) {
      const dailyConsumptions = new Collection({
        name: 'daily_consumptions',
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
            name: 'user_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'date', type: 'date', required: true },
          { name: 'items', type: 'json' },
          { name: 'total_theoretical_cost', type: 'number' },
          { name: 'total_real_cost', type: 'number' },
          { name: 'total_divergence_cost', type: 'number' },
          { name: 'notes', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['draft', 'confirmed', 'reconciled'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_dc_restaurant ON daily_consumptions (restaurant_id)',
          'CREATE INDEX idx_dc_date ON daily_consumptions (date)',
          'CREATE INDEX idx_dc_user ON daily_consumptions (user_id)',
        ],
      })
      app.save(dailyConsumptions)
    }

    // 2. Garantir usuário demo cozinha@demo.oniceli.com
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let serenaRestaurant = null
    try {
      serenaRestaurant = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste1.com.br')
    } catch (_) {
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
    }
    const restId = serenaRestaurant ? serenaRestaurant.id : ''

    try {
      const existingKitchen = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'cozinha@demo.oniceli.com',
      )
      if (restId && !existingKitchen.get('restaurant_id')) {
        existingKitchen.set('restaurant_id', restId)
        app.save(existingKitchen)
      }
    } catch (_) {
      const kitchenUser = new Record(usersCol)
      kitchenUser.setEmail('cozinha@demo.oniceli.com')
      kitchenUser.setPassword('Skip@Pass')
      kitchenUser.setVerified(true)
      kitchenUser.set('name', 'Chef Rodrigo (Cozinha)')
      kitchenUser.set('role', 'kitchen')
      if (restId) kitchenUser.set('restaurant_id', restId)
      app.save(kitchenUser)
    }

    // 3. Seed de pedidos realistas para a cozinha (kitchen_orders) se estiver vazia
    try {
      const count = app.countRecords('kitchen_orders')
      if (count === 0) {
        const koCol = app.findCollectionByNameOrId('kitchen_orders')

        // Buscar alguns itens de menu
        let saladaCaesarId = ''
        let wrapFrangoId = ''
        let pokeSalmaoId = ''
        let toastSalmaoId = ''
        let tortaFrangoId = ''

        try {
          const m1 = app.findFirstRecordByData('menu_items', 'name', 'Salada Caesar com Frango')
          saladaCaesarId = m1.id
        } catch (_) {}
        try {
          const m2 = app.findFirstRecordByData('menu_items', 'name', 'Wrap de Frango com Avocado')
          wrapFrangoId = m2.id
        } catch (_) {}
        try {
          const m3 = app.findFirstRecordByData('menu_items', 'name', 'Poke Bowl de Salmão')
          pokeSalmaoId = m3.id
        } catch (_) {}
        try {
          const m4 = app.findFirstRecordByData('menu_items', 'name', 'Toast de Salmão Defumado')
          toastSalmaoId = m4.id
        } catch (_) {}
        try {
          const m5 = app.findFirstRecordByData('menu_items', 'name', 'Torta de Frango')
          tortaFrangoId = m5.id
        } catch (_) {}

        // Pedido 1: Mais antigo (há 25 min) - Pendente
        const order1 = new Record(koCol)
        if (restId) order1.set('restaurant_id', restId)
        order1.set('table_number', '04')
        order1.set('customer_name', 'Juliana Ramos')
        order1.set(
          'items',
          JSON.stringify([
            {
              menu_item_id: saladaCaesarId,
              name: 'Salada Caesar com Frango',
              price: 38.0,
              quantity: 2,
              notes: 'Molho à parte',
            },
          ]),
        )
        order1.set('status', 'pending')
        order1.set('total_amount', 76.0)
        order1.set('notes', 'Cliente com pressa')
        order1.set('stock_deducted', false)
        app.save(order1)

        // Pedido 2: (há 15 min) - Em Cozimento
        const order2 = new Record(koCol)
        if (restId) order2.set('restaurant_id', restId)
        order2.set('table_number', '12')
        order2.set('customer_name', 'Marcelo Costa')
        order2.set(
          'items',
          JSON.stringify([
            {
              menu_item_id: wrapFrangoId,
              name: 'Wrap de Frango com Avocado',
              price: 32.0,
              quantity: 1,
              notes: '',
            },
            {
              menu_item_id: pokeSalmaoId,
              name: 'Poke Bowl de Salmão',
              price: 42.0,
              quantity: 1,
              notes: 'Sem cebola',
            },
          ]),
        )
        order2.set('status', 'preparing')
        order2.set('total_amount', 74.0)
        order2.set('notes', '')
        order2.set('stock_deducted', false)
        app.save(order2)

        // Pedido 3: (há 8 min) - Pendente
        const order3 = new Record(koCol)
        if (restId) order3.set('restaurant_id', restId)
        order3.set('table_number', '07')
        order3.set('customer_name', 'Beatriz Lima')
        order3.set(
          'items',
          JSON.stringify([
            {
              menu_item_id: tortaFrangoId,
              name: 'Torta de Frango',
              price: 28.0,
              quantity: 1,
              notes: 'Bem aquecida',
            },
          ]),
        )
        order3.set('status', 'pending')
        order3.set('total_amount', 28.0)
        order3.set('notes', '')
        order3.set('stock_deducted', false)
        app.save(order3)

        // Pedido 4: (há 5 min) - Pronto
        const order4 = new Record(koCol)
        if (restId) order4.set('restaurant_id', restId)
        order4.set('table_number', '02')
        order4.set('customer_name', 'Eduardo Neves')
        order4.set(
          'items',
          JSON.stringify([
            {
              menu_item_id: toastSalmaoId,
              name: 'Toast de Salmão Defumado',
              price: 54.0,
              quantity: 1,
              notes: '',
            },
          ]),
        )
        order4.set('status', 'ready')
        order4.set('total_amount', 54.0)
        order4.set('notes', '')
        order4.set('stock_deducted', true)
        app.save(order4)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('daily_consumptions')
      app.delete(col)
    } catch (_) {}
  },
)
