migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste1.com.br')
      return
    } catch (_) {}

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var user = new Record(usersCol)
    user.setEmail('serena@teste1.com.br')
    user.setPassword('vaiterron@')
    user.setVerified(true)
    user.set('name', 'Serena Café')
    user.set('role', 'restaurant')
    app.saveNoValidate(user)
  },
  (app) => {
    try {
      var user = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste1.com.br')
      app.delete(user)
    } catch (_) {}
  },
)
