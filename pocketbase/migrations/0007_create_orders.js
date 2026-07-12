migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var suppliersCol = app.findCollectionByNameOrId('suppliers')

    var orders = new Collection({
      name: 'orders',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (restaurant_id = @request.auth.id || supplier_id.user_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (restaurant_id = @request.auth.id || supplier_id.user_id = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'restaurant_id',
          type: 'relation',
          collectionId: usersCol.id,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'supplier_id',
          type: 'relation',
          collectionId: suppliersCol.id,
          maxSelect: 1,
          required: true,
        },
        { name: 'items', type: 'json' },
        { name: 'total_amount', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_orders_restaurant_id ON orders (restaurant_id)',
        'CREATE INDEX idx_orders_supplier_id ON orders (supplier_id)',
        'CREATE INDEX idx_orders_status ON orders (status)',
      ],
    })
    app.save(orders)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('orders'))
    } catch (_) {}
  },
)
