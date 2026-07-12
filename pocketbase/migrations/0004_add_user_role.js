migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({ name: 'role', values: ['restaurant', 'supplier'], maxSelect: 1 }),
      )
    }
    app.save(col)

    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      if (!user.getString('role')) {
        user.set('role', 'restaurant')
        app.save(user)
      }
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = col.fields.getByName('role')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)
