migrate(
  (app) => {
    var userId = ''
    try {
      userId = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste.com.br').id
    } catch (_) {
      var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      var user = new Record(usersCol)
      user.setEmail('serena@teste.com.br')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Serena Café')
      user.set('role', 'restaurant')
      app.saveNoValidate(user)
      userId = user.id
    }

    var existingInv = app.findRecordsByFilter('inventory', 'user_id = "' + userId + '"', '', 1, 0)
    if (existingInv.length > 0) return

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
      ['Maracujá', 'Frutas', 'Geladeira', 3, 'kg', 18.0, 1, 7, 'Hortifruti Vale Verde'],
      [
        'Goma de Tapioca',
        'Secos',
        'Estoque Seco',
        5,
        'kg',
        12.0,
        2,
        90,
        'Distribuidora Secos Premium',
      ],
      [
        'Polvilho Doce',
        'Secos',
        'Estoque Seco',
        3,
        'kg',
        8.0,
        1,
        180,
        'Distribuidora Secos Premium',
      ],
      ['Queijo Coalho', 'Laticínios', 'Geladeira', 4, 'kg', 35.0, 1, 30, 'Laticínios Santa Clara'],
      ['Carne Seca', 'Carnes', 'Câmara Fria', 5, 'kg', 42.0, 2, 30, 'Frigorífico Corte Sul'],
      ['Cogumelo Paris', 'Hortifruti', 'Geladeira', 3, 'kg', 22.0, 1, 7, 'Hortifruti Vale Verde'],
      ['Carne Moída', 'Carnes', 'Câmara Fria', 6, 'kg', 28.0, 2, 5, 'Frigorífico Corte Sul'],
      [
        'Pão de Hambúrguer',
        'Padaria',
        'Estoque Seco',
        30,
        'un',
        3.5,
        10,
        5,
        'Padaria Artesanal Pão Quente',
      ],
      ['Batata Doce', 'Hortifruti', 'Estoque Seco', 10, 'kg', 5.0, 3, 30, 'Hortifruti Vale Verde'],
      [
        'Queijo Mussarela',
        'Laticínios',
        'Geladeira',
        5,
        'kg',
        32.0,
        1,
        15,
        'Laticínios Santa Clara',
      ],
      ['Cebolinha', 'Hortifruti', 'Geladeira', 1, 'kg', 12.0, 0.3, 7, 'Hortifruti Vale Verde'],
      ['Salsinha', 'Hortifruti', 'Geladeira', 1, 'kg', 15.0, 0.3, 7, 'Hortifruti Vale Verde'],
      ['Abobrinha', 'Hortifruti', 'Geladeira', 4, 'kg', 7.0, 1, 7, 'Hortifruti Vale Verde'],
      [
        'Sorvete de Creme',
        'Congelados',
        'Freezer',
        5,
        'kg',
        18.0,
        2,
        90,
        'Distribuidora Secos Premium',
      ],
      ['Açúcar', 'Secos', 'Estoque Seco', 10, 'kg', 4.0, 2, 365, 'Distribuidora Secos Premium'],
      ['Café', 'Bebidas', 'Estoque Seco', 5, 'kg', 35.0, 1, 365, 'Distribuidora Secos Premium'],
      [
        'Leite Condensado',
        'Laticínios',
        'Estoque Seco',
        8,
        'L',
        12.0,
        3,
        180,
        'Laticínios Santa Clara',
      ],
    ]
    var invIds = {}
    invData.forEach(function (item) {
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

    var miCol = app.findCollectionByNameOrId('menu_items')
    var ing = function (arr) {
      return JSON.stringify(
        arr.map(function (i) {
          return { inventory_id: invIds[i[0]] || '', name: i[0], quantity: i[1], unit: i[2] }
        }),
      )
    }
    var menu = [
      [
        'Smoothie de Maracujá com Manga',
        'Sucos e Smoothies',
        26.0,
        7.5,
        71.2,
        [
          ['Maracujá', 0.1, 'kg'],
          ['Manga', 0.1, 'kg'],
          ['Leite Condensado', 0.05, 'L'],
          ['Leite Integral', 0.1, 'L'],
        ],
      ],
      ['Suco de Laranja', 'Sucos e Smoothies', 17.0, 4.0, 76.5, [['Suco de Laranja', 0.3, 'L']]],
      [
        'Smoothie de Açai com Banana',
        'Sucos e Smoothies',
        28.0,
        8.65,
        69.1,
        [
          ['Açai', 0.2, 'kg'],
          ['Banana', 0.1, 'kg'],
          ['Granola', 0.03, 'kg'],
          ['Mel', 0.01, 'kg'],
        ],
      ],
      [
        'Smoothie Verde Detox',
        'Sucos e Smoothies',
        22.0,
        6.5,
        70.5,
        [
          ['Espinafre', 0.05, 'kg'],
          ['Banana', 0.1, 'kg'],
          ['Maçã', 0.05, 'kg'],
          ['Limão', 0.02, 'kg'],
        ],
      ],
      [
        'Smoothie de Morango com Iogurte',
        'Sucos e Smoothies',
        20.0,
        5.8,
        71.0,
        [
          ['Morango', 0.1, 'kg'],
          ['Iogurte Natural', 0.05, 'kg'],
          ['Mel', 0.01, 'kg'],
        ],
      ],
      [
        'Limonada Suíça',
        'Softs',
        14.0,
        3.0,
        78.6,
        [
          ['Limão', 0.1, 'kg'],
          ['Açúcar', 0.03, 'kg'],
        ],
      ],
      ['Água com Gás', 'Softs', 8.0, 2.0, 75.0, []],
      ['Refrigerante', 'Softs', 8.0, 3.5, 56.3, []],
      ['Café Expresso', 'Softs', 7.0, 1.5, 78.6, [['Café', 0.01, 'kg']]],
      [
        'Tapioca Serena',
        'Café da Manhã',
        28.0,
        7.0,
        75.0,
        [
          ['Goma de Tapioca', 0.1, 'kg'],
          ['Queijo Coalho', 0.05, 'kg'],
          ['Tomate', 0.03, 'kg'],
          ['Manjericão', 0.005, 'kg'],
        ],
      ],
      [
        'Pão de Queijo',
        'Café da Manhã',
        10.0,
        2.5,
        75.0,
        [
          ['Polvilho Doce', 0.05, 'kg'],
          ['Queijo Coalho', 0.03, 'kg'],
          ['Leite Integral', 0.03, 'L'],
          ['Ovos', 0.5, 'un'],
        ],
      ],
      [
        'Ovos Mexidos',
        'Café da Manhã',
        19.0,
        4.5,
        76.3,
        [
          ['Ovos', 3, 'un'],
          ['Manteiga', 0.02, 'kg'],
          ['Cebolinha', 0.01, 'kg'],
          ['Flor de Sal', 0.001, 'kg'],
        ],
      ],
      [
        'Bowl de Granola com Frutas',
        'Café da Manhã',
        26.0,
        5.2,
        80.0,
        [
          ['Granola', 0.05, 'kg'],
          ['Banana', 0.05, 'kg'],
          ['Morango', 0.05, 'kg'],
          ['Iogurte Natural', 0.05, 'kg'],
          ['Mel', 0.01, 'kg'],
        ],
      ],
      [
        'Panqueca de Aveia com Banana',
        'Café da Manhã',
        24.0,
        4.5,
        81.3,
        [
          ['Aveia', 0.05, 'kg'],
          ['Banana', 0.1, 'kg'],
          ['Ovos', 2, 'un'],
          ['Leite Integral', 0.05, 'L'],
        ],
      ],
      [
        'Toast de Salmão Defumado',
        'Toasts',
        39.0,
        14.5,
        62.8,
        [
          ['Pão de Fermentação Natural', 1, 'un'],
          ['Avocado', 0.05, 'kg'],
          ['Ovos', 1, 'un'],
          ['Salmão Defumado', 0.05, 'kg'],
          ['Gergelim', 0.005, 'kg'],
          ['Dill', 0.005, 'kg'],
          ['Flor de Sal', 0.002, 'kg'],
        ],
      ],
      [
        'Toast de Avocado',
        'Toasts',
        32.0,
        9.5,
        70.3,
        [
          ['Pão de Fermentação Natural', 1, 'un'],
          ['Avocado', 0.08, 'kg'],
          ['Flor de Sal', 0.002, 'kg'],
          ['Limão', 0.01, 'kg'],
        ],
      ],
      [
        'Brownie com Sorvete',
        'Sobremesas',
        34.0,
        9.0,
        73.5,
        [
          ['Chocolate 70%', 0.05, 'kg'],
          ['Manteiga', 0.03, 'kg'],
          ['Farinha de Trigo', 0.03, 'kg'],
          ['Sorvete de Creme', 0.08, 'kg'],
        ],
      ],
      [
        'Açaí na Tigela',
        'Sobremesas',
        30.0,
        9.0,
        70.0,
        [
          ['Açai', 0.2, 'kg'],
          ['Banana', 0.1, 'kg'],
          ['Granola', 0.03, 'kg'],
          ['Mel', 0.01, 'kg'],
        ],
      ],
      [
        'Cheesecake de Frutas Vermelhas',
        'Sobremesas',
        22.0,
        5.5,
        75.0,
        [
          ['Cream Cheese', 0.05, 'kg'],
          ['Morango', 0.03, 'kg'],
        ],
      ],
      [
        'Brownie de Chocolate 70%',
        'Sobremesas',
        18.0,
        4.0,
        77.8,
        [
          ['Chocolate 70%', 0.05, 'kg'],
          ['Manteiga', 0.03, 'kg'],
          ['Farinha de Trigo', 0.03, 'kg'],
        ],
      ],
      [
        'Salada de Salmão',
        'Saladas',
        57.0,
        18.0,
        68.4,
        [
          ['Salmão Fresco', 0.15, 'kg'],
          ['Alface', 0.05, 'kg'],
          ['Rúcula', 0.03, 'kg'],
          ['Tomate', 0.05, 'kg'],
          ['Pepino', 0.03, 'kg'],
          ['Gergelim', 0.005, 'kg'],
          ['Dill', 0.005, 'kg'],
        ],
      ],
      [
        'Salada Caesar com Frango',
        'Saladas',
        38.0,
        9.5,
        75.0,
        [
          ['Alface', 0.1, 'kg'],
          ['Peito de Frango', 0.15, 'kg'],
          ['Queijo Parmesão', 0.02, 'kg'],
          ['Pão de Fermentação Natural', 0.5, 'un'],
        ],
      ],
      [
        'Salada de Quinoa com Vegetais',
        'Saladas',
        34.0,
        7.8,
        77.1,
        [
          ['Quinoa', 0.08, 'kg'],
          ['Tomate', 0.05, 'kg'],
          ['Pepino', 0.03, 'kg'],
          ['Cenoura', 0.03, 'kg'],
        ],
      ],
      [
        'Salada de Beterraba com Queijo Brie',
        'Saladas',
        32.0,
        8.2,
        74.4,
        [
          ['Beterraba', 0.1, 'kg'],
          ['Queijo Brie', 0.03, 'kg'],
          ['Rúcula', 0.03, 'kg'],
        ],
      ],
      [
        'Wrap de Frango',
        'Wraps',
        43.0,
        11.0,
        74.4,
        [
          ['Brioche', 1, 'un'],
          ['Peito de Frango', 0.15, 'kg'],
          ['Alface', 0.03, 'kg'],
          ['Tomate', 0.03, 'kg'],
          ['Cebolinha', 0.01, 'kg'],
        ],
      ],
      [
        'Wrap de Frango com Avocado',
        'Wraps',
        32.0,
        8.5,
        73.4,
        [
          ['Brioche', 1, 'un'],
          ['Peito de Frango', 0.15, 'kg'],
          ['Avocado', 0.05, 'kg'],
          ['Alface', 0.03, 'kg'],
        ],
      ],
      [
        'Wrap Vegetariano',
        'Wraps',
        28.0,
        7.0,
        75.0,
        [
          ['Brioche', 1, 'un'],
          ['Tofu', 0.1, 'kg'],
          ['Cenoura', 0.03, 'kg'],
          ['Pepino', 0.03, 'kg'],
          ['Alface', 0.03, 'kg'],
        ],
      ],
      [
        'Veggie Bowl',
        'Bowls',
        55.0,
        14.0,
        74.5,
        [
          ['Arroz', 0.1, 'kg'],
          ['Tofu', 0.1, 'kg'],
          ['Cenoura', 0.03, 'kg'],
          ['Espinafre', 0.03, 'kg'],
          ['Gergelim', 0.005, 'kg'],
          ['Beterraba', 0.03, 'kg'],
          ['Avocado', 0.05, 'kg'],
        ],
      ],
      [
        'Poke Bowl de Salmão',
        'Bowls',
        42.0,
        14.84,
        64.7,
        [
          ['Salmão Fresco', 0.15, 'kg'],
          ['Arroz', 0.1, 'kg'],
          ['Avocado', 0.05, 'kg'],
          ['Pepino', 0.03, 'kg'],
          ['Gergelim', 0.005, 'kg'],
        ],
      ],
      [
        'Buddha Bowl com Tofu',
        'Bowls',
        36.0,
        9.0,
        75.0,
        [
          ['Arroz', 0.1, 'kg'],
          ['Tofu', 0.1, 'kg'],
          ['Cenoura', 0.03, 'kg'],
          ['Espinafre', 0.03, 'kg'],
          ['Gergelim', 0.005, 'kg'],
        ],
      ],
      [
        'Bowl de Açai',
        'Bowls',
        28.0,
        8.65,
        69.1,
        [
          ['Açai', 0.2, 'kg'],
          ['Banana', 0.1, 'kg'],
          ['Granola', 0.03, 'kg'],
          ['Mel', 0.01, 'kg'],
        ],
      ],
      [
        'Batata Rústica',
        'Acompanhamentos',
        18.0,
        4.0,
        77.8,
        [
          ['Batata Doce', 0.2, 'kg'],
          ['Azeite', 0.02, 'L'],
          ['Flor de Sal', 0.002, 'kg'],
        ],
      ],
      ['Arroz Branco', 'Acompanhamentos', 12.0, 2.5, 79.2, [['Arroz', 0.15, 'kg']]],
      [
        'Legumes Grelhados',
        'Acompanhamentos',
        16.0,
        4.5,
        71.9,
        [
          ['Cenoura', 0.05, 'kg'],
          ['Pimentão', 0.05, 'kg'],
          ['Abobrinha', 0.05, 'kg'],
          ['Azeite', 0.02, 'L'],
        ],
      ],
      [
        'Torta de Carne Seca',
        'Tortas',
        48.0,
        16.0,
        66.7,
        [
          ['Farinha de Trigo', 0.1, 'kg'],
          ['Carne Seca', 0.15, 'kg'],
          ['Creme de Leite', 0.05, 'L'],
          ['Cebola', 0.05, 'kg'],
        ],
      ],
      [
        'Torta de Frango',
        'Tortas',
        28.0,
        6.5,
        76.8,
        [
          ['Farinha de Trigo', 0.1, 'kg'],
          ['Peito de Frango', 0.15, 'kg'],
          ['Creme de Leite', 0.03, 'L'],
        ],
      ],
      [
        'Omelete de Espinafre',
        'Omeletes',
        26.0,
        5.5,
        78.8,
        [
          ['Ovos', 3, 'un'],
          ['Espinafre', 0.05, 'kg'],
          ['Queijo Parmesão', 0.02, 'kg'],
        ],
      ],
      [
        'Omelete de Queijo',
        'Omeletes',
        22.0,
        5.0,
        77.3,
        [
          ['Ovos', 3, 'un'],
          ['Queijo Mussarela', 0.05, 'kg'],
        ],
      ],
      [
        'Omelete de Cogumelos',
        'Omeletes',
        28.0,
        7.5,
        73.2,
        [
          ['Ovos', 3, 'un'],
          ['Cogumelo Paris', 0.05, 'kg'],
          ['Queijo Mussarela', 0.03, 'kg'],
        ],
      ],
      [
        'Omelete Completa',
        'Omeletes',
        28.0,
        7.0,
        75.0,
        [
          ['Ovos', 3, 'un'],
          ['Peito de Frango', 0.05, 'kg'],
          ['Queijo Mussarela', 0.03, 'kg'],
          ['Tomate', 0.03, 'kg'],
        ],
      ],
      [
        'Hamburguer Serena',
        'Lanches',
        55.0,
        15.0,
        72.7,
        [
          ['Pão de Hambúrguer', 1, 'un'],
          ['Carne Moída', 0.15, 'kg'],
          ['Queijo Mussarela', 0.03, 'kg'],
          ['Alface', 0.02, 'kg'],
          ['Tomate', 0.03, 'kg'],
          ['Cebola', 0.02, 'kg'],
        ],
      ],
      [
        'Sanduíche de Brioche com Frango',
        'Lanches',
        30.0,
        8.0,
        73.3,
        [
          ['Brioche', 1, 'un'],
          ['Peito de Frango', 0.15, 'kg'],
          ['Alface', 0.03, 'kg'],
          ['Tomate', 0.03, 'kg'],
        ],
      ],
      [
        'Bruschetta',
        'Entradas',
        24.0,
        5.5,
        77.1,
        [
          ['Pão de Fermentação Natural', 1, 'un'],
          ['Tomate', 0.05, 'kg'],
          ['Manjericão', 0.01, 'kg'],
          ['Azeite', 0.02, 'L'],
        ],
      ],
      [
        'Carpaccio',
        'Entradas',
        32.0,
        10.0,
        68.8,
        [
          ['Carne Moída', 0.1, 'kg'],
          ['Queijo Parmesão', 0.02, 'kg'],
          ['Rúcula', 0.03, 'kg'],
          ['Azeite', 0.02, 'L'],
          ['Limão', 0.02, 'kg'],
        ],
      ],
      [
        'Sopa do Dia',
        'Entradas',
        18.0,
        4.0,
        77.8,
        [
          ['Cenoura', 0.05, 'kg'],
          ['Cebola', 0.03, 'kg'],
          ['Batata Doce', 0.05, 'kg'],
        ],
      ],
    ]
    var menuIds = {}
    menu.forEach(function (m) {
      var r = new Record(miCol)
      r.set('name', m[0])
      r.set('category', m[1])
      r.set('price', m[2])
      r.set('cost', m[3])
      r.set('margin', m[4])
      r.set('ingredients', ing(m[5]))
      r.set('active', true)
      r.set('user_id', userId)
      app.save(r)
      menuIds[m[0]] = r.id
    })

    var sdCol = app.findCollectionByNameOrId('sales_data')
    var topItems = [
      ['Poke Bowl de Salmão', 42.0],
      ['Toast de Salmão Defumado', 39.0],
      ['Salada Caesar com Frango', 38.0],
      ['Smoothie de Açai com Banana', 28.0],
      ['Bowl de Açai', 28.0],
      ['Toast de Avocado', 32.0],
      ['Wrap de Frango com Avocado', 32.0],
    ]
    var day, qty, seed
    for (day = 0; day < 7; day++) {
      seed = (day + 1) * 7
      topItems.forEach(function (t, idx) {
        qty = ((seed + idx * 3) % 8) + 3
        var r = new Record(sdCol)
        r.set('item_id', menuIds[t[0]])
        r.set('quantity_sold', qty)
        r.set('date', d(-day))
        r.set('total_price', qty * t[1])
        r.set('user_id', userId)
        app.save(r)
      })
    }

    var wlCol = app.findCollectionByNameOrId('waste_logs')
    var wasteData = [
      ['Morango', 1, 'Vencimento', 15.0],
      ['Salmão Fresco', 0.3, 'Preparação', 25.5],
      ['Alface', 0.5, 'Deterioração', 4.0],
      ['Pão de Fermentação Natural', 3, 'Vencimento', 24.0],
      ['Tomate', 1, 'Deterioração', 6.5],
    ]
    wasteData.forEach(function (w) {
      var r = new Record(wlCol)
      r.set('item_id', invIds[w[0]])
      r.set('quantity', w[1])
      r.set('reason', w[2])
      r.set('financial_loss', w[3])
      r.set('date', d(-1))
      r.set('user_id', userId)
      app.save(r)
    })

    var notCol = app.findCollectionByNameOrId('notifications')
    var notifData = [
      [
        'stock_rupture',
        'Alerta de Estoque',
        'Salmão Fresco: 15kg em estoque (mínimo: 5kg).',
        'info',
        'internal',
      ],
      [
        'expiry_warning',
        'Alerta de Validade',
        'Pão de Fermentação Natural vence em 3 dias. 30un em estoque.',
        'warning',
        'push',
      ],
      [
        'expiry_warning',
        'Alerta de Validade',
        'Brioche vence em 3 dias. 25un em estoque.',
        'warning',
        'push',
      ],
      [
        'purchase_needed',
        'Compra Sugerida',
        'Reabastecer Leite Integral - 20L restantes.',
        'info',
        'internal',
      ],
      [
        'promotion',
        'Promoção Sugerida',
        'Combo Smoothie + Toast a R$ 45,00 para aumentar vendas.',
        'success',
        'internal',
      ],
    ]
    notifData.forEach(function (n) {
      var r = new Record(notCol)
      r.set('user_id', userId)
      r.set('type', n[0])
      r.set('title', n[1])
      r.set('message', n[2])
      r.set('priority', n[3])
      r.set('channel', n[4])
      r.set('read', false)
      app.save(r)
    })

    var ordCol = app.findCollectionByNameOrId('orders')
    var orderData = [
      [
        supIds['Peixaria Costa Norte'],
        JSON.stringify([
          { name: 'Salmão Fresco', quantity: 10, unit: 'kg', price: 85.0 },
          { name: 'Camarão', quantity: 5, unit: 'kg', price: 65.0 },
        ]),
        10 * 85.0 + 5 * 65.0,
        'delivered',
        'pix',
      ],
      [
        supIds['Hortifruti Vale Verde'],
        JSON.stringify([
          { name: 'Avocado', quantity: 10, unit: 'kg', price: 25.0 },
          { name: 'Morango', quantity: 5, unit: 'kg', price: 15.0 },
        ]),
        10 * 25.0 + 5 * 15.0,
        'shipped',
        'card',
      ],
      [
        supIds['Laticínios Santa Clara'],
        JSON.stringify([
          { name: 'Queijo Brie', quantity: 3, unit: 'kg', price: 55.0 },
          { name: 'Cream Cheese', quantity: 5, unit: 'kg', price: 25.0 },
        ]),
        3 * 55.0 + 5 * 25.0,
        'pending',
        'installments',
      ],
    ]
    orderData.forEach(function (o) {
      var r = new Record(ordCol)
      r.set('restaurant_id', userId)
      r.set('supplier_id', o[0])
      r.set('items', o[1])
      r.set('total_amount', o[2])
      r.set('status', o[3])
      r.set('payment_method', o[4])
      if (o[4] === 'installments') {
        r.set('payment_terms', '30/60/90')
        r.set('interest_applied', true)
        r.set('interest_rate', 5)
      } else {
        r.set('payment_terms', '')
        r.set('interest_applied', false)
        r.set('interest_rate', 0)
      }
      app.save(r)
    })
  },
  (app) => {
    var userId = ''
    try {
      userId = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste.com.br').id
    } catch (_) {
      return
    }
    var collections = [
      'sales_data',
      'waste_logs',
      'notifications',
      'orders',
      'inventory',
      'menu_items',
      'suppliers',
    ]
    collections.forEach(function (colName) {
      try {
        var records = app.findRecordsByFilter(colName, 'user_id = "' + userId + '"', '', 500, 0)
        records.forEach(function (r) {
          app.delete(r)
        })
      } catch (_) {}
    })
    try {
      var orders = app.findRecordsByFilter('orders', 'restaurant_id = "' + userId + '"', '', 500, 0)
      orders.forEach(function (r) {
        app.delete(r)
      })
    } catch (_) {}
    try {
      var user = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste.com.br')
      app.delete(user)
    } catch (_) {}
  },
)
