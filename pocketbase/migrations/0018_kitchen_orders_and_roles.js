migrate(
  (app) => {
    // 1. Atualizar a coleção users com novos perfis e restaurant_id
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['restaurant', 'supplier', 'kitchen', 'waiter']
      roleField.maxSelect = 1
    } else {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['restaurant', 'supplier', 'kitchen', 'waiter'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('restaurant_id')) {
      usersCol.fields.add(
        new RelationField({
          name: 'restaurant_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(usersCol)

    // 2. Criar coleção kitchen_orders / restaurant_orders para os pedidos da mesa/comanda
    try {
      app.findCollectionByNameOrId('kitchen_orders')
    } catch (_) {
      const kitchenOrders = new Collection({
        name: 'kitchen_orders',
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
          'CREATE INDEX idx_korders_restaurant ON kitchen_orders (restaurant_id)',
          'CREATE INDEX idx_korders_status ON kitchen_orders (status)',
          'CREATE INDEX idx_korders_created ON kitchen_orders (created)',
        ],
      })
      app.save(kitchenOrders)
    }

    // 3. Atualizar regras de listagem/leitura em menu_items e inventory para permitir leitura aos funcionários do restaurante
    const menuCol = app.findCollectionByNameOrId('menu_items')
    menuCol.listRule = "@request.auth.id != ''"
    menuCol.viewRule = "@request.auth.id != ''"
    app.save(menuCol)

    const invCol = app.findCollectionByNameOrId('inventory')
    invCol.listRule = "@request.auth.id != ''"
    invCol.viewRule = "@request.auth.id != ''"
    app.save(invCol)

    // 4. Criar demo users para garçom e cozinha para facilitar testes se não existirem
    try {
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

      // Garçom demo
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', 'garcom@demo.oniceli.com')
      } catch (_) {
        const waiterUser = new Record(usersCol)
        waiterUser.setEmail('garcom@demo.oniceli.com')
        waiterUser.setPassword('Skip@Pass')
        waiterUser.setVerified(true)
        waiterUser.set('name', 'Carlos Garçom')
        waiterUser.set('role', 'waiter')
        if (restId) waiterUser.set('restaurant_id', restId)
        app.save(waiterUser)
      }

      // Cozinha demo
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', 'cozinha@demo.oniceli.com')
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
    } catch (_) {}
  },
  (app) => {
    try {
      const kitchenOrders = app.findCollectionByNameOrId('kitchen_orders')
      app.delete(kitchenOrders)
    } catch (_) {}
  },
)
