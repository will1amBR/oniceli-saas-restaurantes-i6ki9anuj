migrate(
  (app) => {
    var collections = ['suppliers', 'menu_items', 'inventory', 'waste_logs', 'sales_data']

    var adminId = ''
    try {
      adminId = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com').id
    } catch (_) {}

    collections.forEach(function (name) {
      var col = app.findCollectionByNameOrId(name)

      if (!col.fields.getByName('user_id')) {
        col.fields.add(
          new RelationField({
            name: 'user_id',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          }),
        )
      }

      col.listRule = "@request.auth.id != '' && user_id = @request.auth.id"
      col.viewRule = "@request.auth.id != '' && user_id = @request.auth.id"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != '' && user_id = @request.auth.id"
      col.deleteRule = "@request.auth.id != '' && user_id = @request.auth.id"

      col.addIndex('idx_' + name + '_user_id', false, 'user_id', '')

      app.save(col)
    })

    if (adminId) {
      collections.forEach(function (name) {
        var records = app.findRecordsByFilter(name, '', '', 500, 0)
        records.forEach(function (r) {
          if (!r.getString('user_id')) {
            r.set('user_id', adminId)
            app.save(r)
          }
        })
      })
    }
  },
  (app) => {
    var collections = ['suppliers', 'menu_items', 'inventory', 'waste_logs', 'sales_data']
    collections.forEach(function (name) {
      var col = app.findCollectionByNameOrId(name)
      var field = col.fields.getByName('user_id')
      if (field) col.fields.remove(field)
      col.removeIndex('idx_' + name + '_user_id')
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule = "@request.auth.id != ''"
      app.save(col)
    })
  },
)
