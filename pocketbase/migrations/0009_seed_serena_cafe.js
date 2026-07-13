migrate(
  (app) => {
    var userId = ''
    try {
      var user = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      userId = user.id
      var changed = false
      if (!user.getString('role')) {
        user.set('role', 'restaurant')
        changed = true
      }
      if (user.getString('name') === 'Admin') {
        user.set('name', 'Serena Café')
        changed = true
      }
      if (changed) app.save(user)
    } catch (_) {
      return
    }

    var now = new Date()
    var dayMs = 86400000
    var d = function (days) {
      return new Date(now.getTime() + days * dayMs).toISOString().split('T')[0]
    }

    var supCol = app.findCollectionByNameOrId('suppliers')
    var supDefs = [
      ['Peixaria Costa Norte', 'Peixes e Frutos do Mar', 2, 4.8],
      ['Hortifruti Vale Verde', 'Frutas e Verduras', 1, 4.5],
      ['Laticínios Santa Clara', 'Laticínios e Queijos', 3, 4.7],
      ['Padaria Artesanal Pão Quente', 'Padaria', 1, 4.6],
      ['Distribuidora Secos Premium', 'Secos e Grãos', 4, 4.3],
      ['Frigorífico Corte Sul', 'Carnes', 2, 4.6],
    ]
    var supIds = {}
    supDefs.forEach(function (s) {
      var ex = app.findRecordsByFilter(
        'suppliers',
        'name = "' + s[0] + '" && user_id = "' + userId + '"',
        '',
        1,
        0,
      )
      if (ex.length > 0) {
        supIds[s[0]] = ex[0].id
        return
      }
      var r = new Record(supCol)
      r.set('name', s[0])
      r.set('categories', s[1])
      r.set('delivery_lead_time', s[2])
      r.set('rating', s[3])
      r.set('status', 'active')
      r.set('user_id', userId)
      app.save(r)
      supIds[s[0]] = r.id
    })

    var invCol = app.findCollectionByNameOrId('inventory')
    var invData = [
      ['Salmão Fresco', 'Peixes', 'Câmara Fria', 15, 'kg', 85.0, 5, 5, 'Peixaria Costa Norte'],
      ['Salmão Defumado', 'Peixes', 'Câmara Fria', 5, 'kg', 120.0, 2, 10, 'Peixaria Costa Norte'],
      ['Camarão', 'Peixes', 'Câmara Fria', 8, 'kg', 65.0, 3, 4, 'Peixaria Costa Norte'],
      ['Atum', 'Peixes', 'Câmara Fria', 6, 'kg', 55.0, 3, 5, 'Peixaria Costa Norte'],
      ['Bacalhau', 'Peixes', 'Câmara Fria', 4, 'kg', 70.0, 2, 7, 'Peixaria Costa Norte'],
      ['Polvo', 'Peixes', 'Freezer', 3, 'kg', 45.0, 2, 90, 'Peixaria Costa Norte'],
      ['Avocado', 'Hortifruti', 'Geladeira', 20, 'kg', 25.0, 5, 7, 'Hortifruti Vale Verde'],
      ['Tomate', 'Hortifruti', 'Geladeira', 15, 'kg', 6.5, 5, 8, 'Hortifruti Vale Verde'],
      ['Cebola', 'Hortifruti', 'Estoque Seco', 10, 'kg', 3.5, 3, 20, 'Hortifruti Vale Verde'],
      ['Alho', 'Hortifruti', 'Estoque Seco', 2, 'kg', 15.0, 1, 30, 'Hortifruti Vale Verde'],
      ['Alface', 'Hortifruti', 'Geladeira', 5, 'kg', 8.0, 2, 5, 'Hortifruti Vale Verde'],
      ['Rúcula', 'Hortifruti', 'Geladeira', 3, 'kg', 12.0, 1, 5, 'Hortifruti Vale Verde'],
      ['Espinafre', 'Hortifruti', 'Geladeira', 4, 'kg', 10.0, 2, 5, 'Hortifruti Vale Verde'],
      ['Morango', 'Hortifruti', 'Geladeira', 6, 'kg', 15.0, 2, 5, 'Hortifruti Vale Verde'],
      ['Banana', 'Hortifruti', 'Geladeira', 10, 'kg', 6.0, 3, 7, 'Hortifruti Vale Verde'],
      ['Maçã', 'Hortifruti', 'Geladeira', 8, 'kg', 7.0, 3, 15, 'Hortifruti Vale Verde'],
      ['Limão', 'Hortifruti', 'Geladeira', 5, 'kg', 5.0, 2, 15, 'Hortifruti Vale Verde'],
      ['Abacaxi', 'Hortifruti', 'Geladeira', 6, 'kg', 8.0, 2, 7, 'Hortifruti Vale Verde'],
      ['Manga', 'Hortifruti', 'Geladeira', 5, 'kg', 9.0, 2, 7, 'Hortifruti Vale Verde'],
      ['Açai', 'Congelados', 'Freezer', 10, 'kg', 35.0, 3, 90, 'Hortifruti Vale Verde'],
      ['Cenoura', 'Hortifruti', 'Geladeira', 8, 'kg', 4.0, 3, 15, 'Hortifruti Vale Verde'],
      ['Pepino', 'Hortifruti', 'Geladeira', 5, 'kg', 4.0, 2, 10, 'Hortifruti Vale Verde'],
      ['Pimentão', 'Hortifruti', 'Geladeira', 4, 'kg', 8.0, 2, 10, 'Hortifruti Vale Verde'],
      ['Beterraba', 'Hortifruti', 'Geladeira', 5, 'kg', 5.0, 2, 15, 'Hortifruti Vale Verde'],
      ['Couve', 'Hortifruti', 'Geladeira', 3, 'kg', 6.0, 1, 7, 'Hortifruti Vale Verde'],
      ['Dill', 'Hortifruti', 'Geladeira', 0.5, 'kg', 60.0, 0.2, 5, 'Hortifruti Vale Verde'],
      ['Coentro', 'Hortifruti', 'Geladeira', 0.5, 'kg', 20.0, 0.2, 5, 'Hortifruti Vale Verde'],
      ['Manjericão', 'Hortifruti', 'Geladeira', 0.5, 'kg', 25.0, 0.2, 5, 'Hortifruti Vale Verde'],
      ['Gergelim', 'Secos', 'Estoque Seco', 2, 'kg', 40.0, 0.5, 90, 'Distribuidora Secos Premium'],
      [
        'Flor de Sal',
        'Secos',
        'Estoque Seco',
        1,
        'kg',
        50.0,
        0.5,
        180,
        'Distribuidora Secos Premium',
      ],
      [
        'Pão de Fermentação Natural',
        'Padaria',
        'Estoque Seco',
        30,
        'un',
        8.0,
        10,
        3,
        'Padaria Artesanal Pão Quente',
      ],
      ['Brioche', 'Padaria', 'Estoque Seco', 25, 'un', 6.0, 10, 3, 'Padaria Artesanal Pão Quente'],
      [
        'Farinha de Trigo',
        'Secos',
        'Estoque Seco',
        20,
        'kg',
        5.0,
        5,
        180,
        'Distribuidora Secos Premium',
      ],
      ['Aveia', 'Secos', 'Estoque Seco', 10, 'kg', 8.0, 3, 180, 'Distribuidora Secos Premium'],
      ['Granola', 'Secos', 'Estoque Seco', 8, 'kg', 25.0, 2, 90, 'Distribuidora Secos Premium'],
      ['Quinoa', 'Secos', 'Estoque Seco', 5, 'kg', 18.0, 2, 180, 'Distribuidora Secos Premium'],
      ['Arroz', 'Secos', 'Estoque Seco', 30, 'kg', 5.2, 10, 180, 'Distribuidora Secos Premium'],
      ['Feijão', 'Secos', 'Estoque Seco', 15, 'kg', 7.0, 5, 180, 'Distribuidora Secos Premium'],
      ['Ovos', 'Laticínios', 'Geladeira', 120, 'un', 1.5, 30, 15, 'Laticínios Santa Clara'],
      ['Cream Cheese', 'Laticínios', 'Geladeira', 5, 'kg', 25.0, 2, 10, 'Laticínios Santa Clara'],
      ['Queijo Brie', 'Laticínios', 'Geladeira', 3, 'kg', 55.0, 1, 15, 'Laticínios Santa Clara'],
      [
        'Queijo Parmesão',
        'Laticínios',
        'Geladeira',
        2,
        'kg',
        45.0,
        1,
        30,
        'Laticínios Santa Clara',
      ],
      ['Manteiga', 'Laticínios', 'Geladeira', 4, 'kg', 20.0, 1, 30, 'Laticínios Santa Clara'],
      ['Leite Integral', 'Laticínios', 'Geladeira', 20, 'L', 4.5, 10, 7, 'Laticínios Santa Clara'],
      [
        'Iogurte Natural',
        'Laticínios',
        'Geladeira',
        10,
        'kg',
        12.0,
        3,
        10,
        'Laticínios Santa Clara',
      ],
      ['Creme de Leite', 'Laticínios', 'Geladeira', 5, 'L', 8.0, 2, 10, 'Laticínios Santa Clara'],
      ['Suco de Laranja', 'Bebidas', 'Geladeira', 15, 'L', 10.0, 5, 5, 'Hortifruti Vale Verde'],
      [
        'Leite de Coco',
        'Bebidas',
        'Estoque Seco',
        10,
        'L',
        12.0,
        3,
        180,
        'Distribuidora Secos Premium',
      ],
      ['Azeite', 'Secos', 'Estoque Seco', 8, 'L', 25.0, 2, 365, 'Distribuidora Secos Premium'],
      ['Mel', 'Secos', 'Estoque Seco', 3, 'kg', 30.0, 1, 365, 'Distribuidora Secos Premium'],
      [
        'Pasta de Amendoim',
        'Secos',
        'Estoque Seco',
        3,
        'kg',
        28.0,
        1,
        180,
        'Distribuidora Secos Premium',
      ],
      [
        'Chocolate 70%',
        'Secos',
        'Estoque Seco',
        4,
        'kg',
        45.0,
        1,
        180,
        'Distribuidora Secos Premium',
      ],
      [
        'Whey Protein',
        'Secos',
        'Estoque Seco',
        3,
        'kg',
        60.0,
        1,
        365,
        'Distribuidora Secos Premium',
      ],
      ['Tofu', 'Congelados', 'Geladeira', 5, 'kg', 15.0, 2, 15, 'Hortifruti Vale Verde'],
      ['Peito de Frango', 'Carnes', 'Câmara Fria', 15, 'kg', 18.0, 5, 5, 'Frigorífico Corte Sul'],
    ]
    var invIds = {}
    invData.forEach(function (item) {
      var ex = app.findRecordsByFilter(
        'inventory',
        'name = "' + item[0] + '" && user_id = "' + userId + '"',
        '',
        1,
        0,
      )
      if (ex.length > 0) {
        invIds[item[0]] = ex[0].id
        return
      }
      var r = new Record(invCol)
      r.set('name', item[0])
      r.set('category', item[1])
      r.set('location', item[2])
      r.set('quantity', item[3])
      r.set('unit', item[4])
      r.set('unit_cost', item[5])
      r.set('min_stock', item[6])
      r.set('expiry_date', d(item[7]))
      if (supIds[item[8]]) r.set('supplier_id', supIds[item[8]])
      r.set('status', 'healthy')
      r.set('user_id', userId)
      app.save(r)
      invIds[item[0]] = r.id
    })

    var toastIng = JSON.stringify([
      {
        inventory_id: invIds['Pão de Fermentação Natural'] || '',
        name: 'Pão de Fermentação Natural',
        quantity: 1,
        unit: 'un',
      },
      { inventory_id: invIds['Avocado'] || '', name: 'Avocado', quantity: 0.05, unit: 'kg' },
      { inventory_id: invIds['Ovos'] || '', name: 'Ovos', quantity: 2, unit: 'un' },
      {
        inventory_id: invIds['Salmão Defumado'] || '',
        name: 'Salmão Defumado',
        quantity: 0.05,
        unit: 'kg',
      },
      { inventory_id: invIds['Gergelim'] || '', name: 'Gergelim', quantity: 0.005, unit: 'kg' },
      { inventory_id: invIds['Dill'] || '', name: 'Dill', quantity: 0.005, unit: 'kg' },
      {
        inventory_id: invIds['Flor de Sal'] || '',
        name: 'Flor de Sal',
        quantity: 0.002,
        unit: 'kg',
      },
    ])
    var pokeIng = JSON.stringify([
      {
        inventory_id: invIds['Salmão Fresco'] || '',
        name: 'Salmão Fresco',
        quantity: 0.15,
        unit: 'kg',
      },
      { inventory_id: invIds['Arroz'] || '', name: 'Arroz', quantity: 0.1, unit: 'kg' },
      { inventory_id: invIds['Avocado'] || '', name: 'Avocado', quantity: 0.05, unit: 'kg' },
      { inventory_id: invIds['Pepino'] || '', name: 'Pepino', quantity: 0.03, unit: 'kg' },
      { inventory_id: invIds['Gergelim'] || '', name: 'Gergelim', quantity: 0.005, unit: 'kg' },
    ])
    var acaiIng = JSON.stringify([
      { inventory_id: invIds['Açai'] || '', name: 'Açai', quantity: 0.2, unit: 'kg' },
      { inventory_id: invIds['Banana'] || '', name: 'Banana', quantity: 0.1, unit: 'kg' },
      { inventory_id: invIds['Granola'] || '', name: 'Granola', quantity: 0.03, unit: 'kg' },
      { inventory_id: invIds['Mel'] || '', name: 'Mel', quantity: 0.01, unit: 'kg' },
    ])

    var miCol = app.findCollectionByNameOrId('menu_items')
    var menuData = [
      ['Smoothie de Açai com Banana', 'Smoothies', 28.0, 8.65, 69.1, acaiIng],
      ['Smoothie Verde Detox', 'Smoothies', 22.0, 6.5, 70.5, '[]'],
      ['Smoothie de Morango com Iogurte', 'Smoothies', 20.0, 5.8, 71.0, '[]'],
      ['Toast de Salmão Defumado', 'Café da Manhã', 54.0, 18.85, 65.1, toastIng],
      ['Toast de Avocado', 'Café da Manhã', 32.0, 9.5, 70.3, '[]'],
      ['Bowl de Granola com Frutas', 'Café da Manhã', 26.0, 5.2, 80.0, '[]'],
      ['Panqueca de Aveia com Banana', 'Café da Manhã', 24.0, 4.5, 81.3, '[]'],
      ['Salada Caesar com Frango', 'Saladas', 38.0, 9.5, 75.0, '[]'],
      ['Salada de Quinoa com Vegetais', 'Saladas', 34.0, 7.8, 77.1, '[]'],
      ['Salada de Beterraba com Queijo Brie', 'Saladas', 32.0, 8.2, 74.4, '[]'],
      ['Wrap de Frango com Avocado', 'Wraps', 32.0, 8.5, 73.4, '[]'],
      ['Wrap Vegetariano', 'Wraps', 28.0, 7.0, 75.0, '[]'],
      ['Buddha Bowl com Tofu', 'Bowls', 36.0, 9.0, 75.0, '[]'],
      ['Poke Bowl de Salmão', 'Bowls', 42.0, 14.84, 64.7, pokeIng],
      ['Bowl de Açai', 'Bowls', 28.0, 8.65, 69.1, '[]'],
      ['Torta de Frango', 'Sanduíches', 28.0, 6.5, 76.8, '[]'],
      ['Sanduíche de Brioche com Frango', 'Sanduíches', 30.0, 8.0, 73.3, '[]'],
      ['Omelete de Espinafre', 'Café da Manhã', 26.0, 5.5, 78.8, '[]'],
      ['Cheesecake de Frutas Vermelhas', 'Sobremesas', 22.0, 5.5, 75.0, '[]'],
      ['Brownie de Chocolate 70%', 'Sobremesas', 18.0, 4.0, 77.8, '[]'],
    ]
    menuData.forEach(function (m) {
      var ex = app.findRecordsByFilter(
        'menu_items',
        'name = "' + m[0] + '" && user_id = "' + userId + '"',
        '',
        1,
        0,
      )
      if (ex.length > 0) return
      var r = new Record(miCol)
      r.set('name', m[0])
      r.set('category', m[1])
      r.set('price', m[2])
      r.set('cost', m[3])
      r.set('margin', m[4])
      r.set('ingredients', m[5])
      r.set('active', true)
      r.set('user_id', userId)
      app.save(r)
    })
  },
  (app) => {},
)
