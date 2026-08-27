migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Atualizar ou criar o usuário serena@teste1.com.br com role 'restaurant', nome 'Serena Café', senha 'vaiterron@'
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste1.com.br')
      user.set('name', 'Serena Café')
      user.set('role', 'restaurant')
      user.setPassword('vaiterron@')
      user.setVerified(true)
      app.save(user)
    } catch (_) {
      const newUser = new Record(users)
      newUser.setEmail('serena@teste1.com.br')
      newUser.setPassword('vaiterron@')
      newUser.setVerified(true)
      newUser.set('name', 'Serena Café')
      newUser.set('role', 'restaurant')
      app.save(newUser)
    }

    // 2. Se houver o usuário serena@teste.com.br, garantir também que o nome esteja consistente
    try {
      const oldUser = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste.com.br')
      oldUser.set('name', 'Serena Café')
      oldUser.set('role', 'restaurant')
      app.save(oldUser)
    } catch (_) {}
  },
  (app) => {
    // no rollback needed
  },
)
