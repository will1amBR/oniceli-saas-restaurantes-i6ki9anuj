migrate(
  (app) => {
    const suppliers = new Collection({
      name: 'suppliers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'contact', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'categories', type: 'text' },
        { name: 'products', type: 'json' },
        { name: 'delivery_lead_time', type: 'number', onlyInt: true },
        { name: 'rating', type: 'number' },
        { name: 'status', type: 'select', values: ['active', 'inactive'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_suppliers_name ON suppliers (name)'],
    })
    app.save(suppliers)

    const menuItems = new Collection({
      name: 'menu_items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'price', type: 'number' },
        { name: 'cost', type: 'number' },
        { name: 'margin', type: 'number' },
        { name: 'ingredients', type: 'json' },
        { name: 'category', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_menu_items_name ON menu_items (name)'],
    })
    app.save(menuItems)

    const suppliersCol = app.findCollectionByNameOrId('suppliers')
    const inventory = new Collection({
      name: 'inventory',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'category', type: 'text' },
        { name: 'location', type: 'text' },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'text' },
        { name: 'unit_cost', type: 'number' },
        { name: 'min_stock', type: 'number' },
        { name: 'expiry_date', type: 'date' },
        {
          name: 'supplier_id',
          type: 'relation',
          collectionId: suppliersCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'status',
          type: 'select',
          values: ['healthy', 'warning', 'critical', 'expired'],
          maxSelect: 1,
        },
        { name: 'embedding', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_inventory_name ON inventory (name)',
        'CREATE INDEX idx_inventory_status ON inventory (status)',
      ],
    })
    app.save(inventory)

    const inventoryCol = app.findCollectionByNameOrId('inventory')
    const wasteLogs = new Collection({
      name: 'waste_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'item_id',
          type: 'relation',
          collectionId: inventoryCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'quantity', type: 'number' },
        { name: 'reason', type: 'text' },
        { name: 'financial_loss', type: 'number' },
        { name: 'date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_waste_logs_date ON waste_logs (date)'],
    })
    app.save(wasteLogs)

    const menuItemsCol = app.findCollectionByNameOrId('menu_items')
    const salesData = new Collection({
      name: 'sales_data',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'item_id',
          type: 'relation',
          collectionId: menuItemsCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'quantity_sold', type: 'number' },
        { name: 'date', type: 'date' },
        { name: 'total_price', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_sales_data_date ON sales_data (date)'],
    })
    app.save(salesData)

    const notifications = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'type',
          type: 'select',
          values: [
            'stock_rupture',
            'expiry_warning',
            'purchase_needed',
            'promotion',
            'supplier_preview',
          ],
          maxSelect: 1,
        },
        { name: 'title', type: 'text' },
        { name: 'message', type: 'text' },
        {
          name: 'priority',
          type: 'select',
          values: ['critical', 'warning', 'info', 'success'],
          maxSelect: 1,
        },
        { name: 'channel', type: 'select', values: ['internal', 'push', 'sms'], maxSelect: 1 },
        { name: 'read', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_notifications_user ON notifications (user_id)'],
    })
    app.save(notifications)
  },
  (app) => {
    ;['notifications', 'sales_data', 'waste_logs', 'inventory', 'menu_items', 'suppliers'].forEach(
      function (n) {
        try {
          app.delete(app.findCollectionByNameOrId(n))
        } catch (_) {}
      },
    )
  },
)
