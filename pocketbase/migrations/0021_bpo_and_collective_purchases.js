migrate(
  (app) => {
    // 1. Atualizar a coleção users com role 'bpo' e campo opcional bpo_partner_id (relação com users)
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['restaurant', 'supplier', 'kitchen', 'waiter', 'bar', 'bpo']
      roleField.maxSelect = 1
    } else {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['restaurant', 'supplier', 'kitchen', 'waiter', 'bar', 'bpo'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('bpo_partner_id')) {
      usersCol.fields.add(
        new RelationField({
          name: 'bpo_partner_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('phone')) {
      usersCol.fields.add(
        new TextField({
          name: 'phone',
        }),
      )
    }
    app.save(usersCol)

    // 2. Criar coleção collective_campaigns (Campanhas de Compra Coletiva)
    try {
      app.findCollectionByNameOrId('collective_campaigns')
    } catch (_) {
      const collectiveCampaigns = new Collection({
        name: 'collective_campaigns',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'item_name', type: 'text', required: true },
          { name: 'category', type: 'text' },
          { name: 'unit', type: 'text', required: true },
          {
            name: 'supplier_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('suppliers').id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'regular_unit_price', type: 'number', required: true },
          { name: 'collective_unit_price', type: 'number', required: true },
          { name: 'target_quantity', type: 'number', required: true },
          { name: 'current_quantity', type: 'number' },
          { name: 'min_order_per_restaurant', type: 'number' },
          { name: 'deadline', type: 'date', required: true },
          {
            name: 'status',
            type: 'select',
            values: ['active', 'goal_reached', 'ordered', 'closed'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cc_supplier ON collective_campaigns (supplier_id)',
          'CREATE INDEX idx_cc_status ON collective_campaigns (status)',
          'CREATE INDEX idx_cc_deadline ON collective_campaigns (deadline)',
        ],
      })
      app.save(collectiveCampaigns)
    }

    // 3. Criar coleção collective_orders (Adesões de Restaurantes às Compras Coletivas)
    try {
      app.findCollectionByNameOrId('collective_orders')
    } catch (_) {
      const collectiveOrders = new Collection({
        name: 'collective_orders',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'campaign_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('collective_campaigns').id,
            maxSelect: 1,
            cascadeDelete: true,
            required: true,
          },
          {
            name: 'restaurant_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
            required: true,
          },
          { name: 'quantity', type: 'number', required: true },
          { name: 'unit_price', type: 'number', required: true },
          { name: 'regular_price', type: 'number' },
          { name: 'total_cost', type: 'number' },
          { name: 'estimated_savings', type: 'number' },
          {
            name: 'status',
            type: 'select',
            values: ['joined', 'confirmed', 'delivered', 'cancelled'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_co_campaign ON collective_orders (campaign_id)',
          'CREATE INDEX idx_co_restaurant ON collective_orders (restaurant_id)',
          'CREATE INDEX idx_co_status ON collective_orders (status)',
        ],
      })
      app.save(collectiveOrders)
    }

    // 4. Criar coleção bpo_clients (Vínculo e métricas entre Parceiro BPO e Restaurantes clientes)
    try {
      app.findCollectionByNameOrId('bpo_clients')
    } catch (_) {
      const bpoClients = new Collection({
        name: 'bpo_clients',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'bpo_user_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
            required: true,
          },
          {
            name: 'restaurant_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
            required: true,
          },
          { name: 'plan_name', type: 'text' },
          { name: 'monthly_fee', type: 'number' },
          { name: 'commission_rate', type: 'number' },
          {
            name: 'status',
            type: 'select',
            values: ['active', 'trial', 'paused', 'cancelled'],
            maxSelect: 1,
          },
          { name: 'contact_person', type: 'text' },
          { name: 'contact_phone', type: 'text' },
          { name: 'contact_email', type: 'email' },
          { name: 'auto_reorder_alert', type: 'bool' },
          { name: 'whatsapp_notifications', type: 'bool' },
          { name: 'email_notifications', type: 'bool' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_bpo_clients_bpo ON bpo_clients (bpo_user_id)',
          'CREATE INDEX idx_bpo_clients_rest ON bpo_clients (restaurant_id)',
          'CREATE INDEX idx_bpo_clients_status ON bpo_clients (status)',
        ],
      })
      app.save(bpoClients)
    }

    // 5. Atualizar coleção notifications com tipos adicionais para bpo e compras coletivas se necessário
    const notifCol = app.findCollectionByNameOrId('notifications')
    const typeField = notifCol.fields.getByName('type')
    if (typeField) {
      typeField.values = [
        'stock_rupture',
        'expiry_warning',
        'purchase_needed',
        'promotion',
        'supplier_preview',
        'bpo_reorder_alert',
        'collective_campaign_update',
      ]
      typeField.maxSelect = 1
    }
    const channelField = notifCol.fields.getByName('channel')
    if (channelField) {
      channelField.values = ['internal', 'push', 'sms', 'email', 'whatsapp']
      channelField.maxSelect = 1
    }
    app.save(notifCol)
  },
  (app) => {
    try {
      const co = app.findCollectionByNameOrId('collective_orders')
      app.delete(co)
    } catch (_) {}
    try {
      const cc = app.findCollectionByNameOrId('collective_campaigns')
      app.delete(cc)
    } catch (_) {}
    try {
      const bc = app.findCollectionByNameOrId('bpo_clients')
      app.delete(bc)
    } catch (_) {}
  },
)
