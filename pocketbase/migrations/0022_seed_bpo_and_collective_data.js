migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const ccCol = app.findCollectionByNameOrId('collective_campaigns')
    const coCol = app.findCollectionByNameOrId('collective_orders')
    const bpoCol = app.findCollectionByNameOrId('bpo_clients')
    const notifCol = app.findCollectionByNameOrId('notifications')

    // 1. Criar Usuário Parceiro BPO demo
    let bpoUser = null
    try {
      bpoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'bpo@demo.oniceli.com')
    } catch (_) {
      bpoUser = new Record(usersCol)
      bpoUser.setEmail('bpo@demo.oniceli.com')
      bpoUser.setPassword('Skip@Pass')
      bpoUser.setVerified(true)
      bpoUser.set('name', 'BPO Consultoria & Gestão')
      bpoUser.set('role', 'bpo')
      bpoUser.set('phone', '(11) 98877-6655')
      app.save(bpoUser)
    }

    // 2. Buscar restaurantes demo para vincular ao BPO
    let serenaUser = null
    try {
      serenaUser = app.findAuthRecordByEmail('_pb_users_auth_', 'serena@teste.com.br')
    } catch (_) {
      try {
        serenaUser = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      } catch (_) {}
    }

    let bistroUser = null
    try {
      bistroUser = app.findAuthRecordByEmail('_pb_users_auth_', 'bistro@demo.oniceli.com')
    } catch (_) {}

    let cantinaUser = null
    try {
      cantinaUser = app.findAuthRecordByEmail('_pb_users_auth_', 'cantina@demo.oniceli.com')
    } catch (_) {}

    let sushiUser = null
    try {
      sushiUser = app.findAuthRecordByEmail('_pb_users_auth_', 'sushi@demo.oniceli.com')
    } catch (_) {}

    let burgerUser = null
    try {
      burgerUser = app.findAuthRecordByEmail('_pb_users_auth_', 'burger@demo.oniceli.com')
    } catch (_) {}

    // Vincular restaurantes ao parceiro BPO
    const linkedRestaurants = [
      {
        user: serenaUser,
        plan: 'Plano Pro 2026',
        monthly: 890,
        commission: 15,
        contact: 'Beatriz Serena',
        phone: '(11) 98765-4321',
        email: 'serena@teste.com.br',
      },
      {
        user: bistroUser,
        plan: 'Plano Pro 2026',
        monthly: 890,
        commission: 15,
        contact: 'Jean Dupont',
        phone: '(11) 97123-4567',
        email: 'bistro@demo.oniceli.com',
      },
      {
        user: cantinaUser,
        plan: 'Plano Lite 2026',
        monthly: 450,
        commission: 12,
        contact: 'Giovanni Rossi',
        phone: '(11) 96234-5678',
        email: 'cantina@demo.oniceli.com',
      },
      {
        user: sushiUser,
        plan: 'Plano Enterprise 2026',
        monthly: 2200,
        commission: 20,
        contact: 'Kenji Tanaka',
        phone: '(11) 95345-6789',
        email: 'sushi@demo.oniceli.com',
      },
      {
        user: burgerUser,
        plan: 'Plano Pro 2026',
        monthly: 890,
        commission: 15,
        contact: 'Marcos Silva',
        phone: '(11) 94456-7890',
        email: 'burger@demo.oniceli.com',
      },
    ]

    if (bpoUser) {
      linkedRestaurants.forEach((item) => {
        if (!item.user) return
        try {
          // Atualiza restaurant com bpo_partner_id
          item.user.set('bpo_partner_id', bpoUser.id)
          if (!item.user.getString('phone')) item.user.set('phone', item.phone)
          app.save(item.user)
        } catch (_) {}

        // Cria registro na tabela bpo_clients
        try {
          const filter =
            "bpo_user_id = '" + bpoUser.id + "' && restaurant_id = '" + item.user.id + "'"
          const existing = app.findRecordsByFilter('bpo_clients', filter, '', 1, 0)
          if (!existing || existing.length === 0) {
            const clientRec = new Record(bpoCol)
            clientRec.set('bpo_user_id', bpoUser.id)
            clientRec.set('restaurant_id', item.user.id)
            clientRec.set('plan_name', item.plan)
            clientRec.set('monthly_fee', item.monthly)
            clientRec.set('commission_rate', item.commission)
            clientRec.set('status', 'active')
            clientRec.set('contact_person', item.contact)
            clientRec.set('contact_phone', item.phone)
            clientRec.set('contact_email', item.email)
            clientRec.set('auto_reorder_alert', true)
            clientRec.set('whatsapp_notifications', true)
            clientRec.set('email_notifications', true)
            clientRec.set('notes', 'Cliente estratégico acompanhado semanalmente.')
            app.save(clientRec)
          }
        } catch (_) {}
      })
    }

    // 3. Buscar fornecedores para as Campanhas de Compra Coletiva
    let supPeixes = null
    let supHortifruti = null
    let supLaticinios = null
    let supCarnes = null
    try {
      const allSups = app.findRecordsByFilter('suppliers', '', '-created', 50, 0)
      allSups.forEach((s) => {
        const cat = s.getString('categories').toLowerCase()
        const name = s.getString('name').toLowerCase()
        if (
          !supPeixes &&
          (cat.includes('peixe') || name.includes('peixe') || name.includes('pescado'))
        )
          supPeixes = s
        if (
          !supHortifruti &&
          (cat.includes('fruta') || cat.includes('hortifruti') || name.includes('verde'))
        )
          supHortifruti = s
        if (
          !supLaticinios &&
          (cat.includes('latic') || cat.includes('queijo') || name.includes('clara'))
        )
          supLaticinios = s
        if (!supCarnes && (cat.includes('carne') || name.includes('boi') || name.includes('corte')))
          supCarnes = s
      })
    } catch (_) {}

    const firstSupId = supPeixes?.id || supHortifruti?.id || ''

    // 4. Seed de Campanhas de Compra Coletiva 2026
    const demoCampaigns = [
      {
        title: 'Lote Coletivo: Salmão Fresco Chileno Premium',
        description:
          'Compra coletiva quinzenal de Salmão Premium com corte fresco direto do importador. Desconto progressivo garantido para restaurantes aderentes.',
        item_name: 'Salmão Fresco',
        category: 'Peixes e Frutos do Mar',
        unit: 'kg',
        supplier_id: supPeixes ? supPeixes.id : firstSupId,
        regular_unit_price: 95.0,
        collective_unit_price: 74.0, // Economia de R$ 21,00/kg (22% OFF)
        target_quantity: 200,
        current_quantity: 165,
        min_order_per_restaurant: 10,
        deadline: '2026-11-15 23:59:59.000Z',
        status: 'active',
      },
      {
        title: 'Pool Coletivo: Azeite de Oliva Extra Virgem 5L',
        description:
          'Galão de 5L acidez máx 0.3%. Pedido consolidado para bares e restaurantes da rede.',
        item_name: 'Azeite Extra Virgem 5L',
        category: 'Secos e Grãos',
        unit: 'galão',
        supplier_id: supPeixes ? supPeixes.id : firstSupId,
        regular_unit_price: 185.0,
        collective_unit_price: 142.0, // Economia de R$ 43/galão (23% OFF)
        target_quantity: 80,
        current_quantity: 75,
        min_order_per_restaurant: 2,
        deadline: '2026-11-20 23:59:59.000Z',
        status: 'active',
      },
      {
        title: 'Compra Coletiva: Queijo Mussarela Peça Inteira',
        description:
          'Mussarela de primeira linha para pizzas, massas e lanches. Consolidação mensal.',
        item_name: 'Queijo Mussarela Peça',
        category: 'Laticínios e Queijos',
        unit: 'kg',
        supplier_id: supLaticinios ? supLaticinios.id : firstSupId,
        regular_unit_price: 48.0,
        collective_unit_price: 36.5, // Economia de R$ 11,50/kg (24% OFF)
        target_quantity: 300,
        current_quantity: 300,
        min_order_per_restaurant: 15,
        deadline: '2026-10-31 23:59:59.000Z',
        status: 'goal_reached',
      },
      {
        title: 'Consolidação: Tomate Italiano Selecionado',
        description: 'Caixa de 20kg padronizada e higienizada direto do produtor rural.',
        item_name: 'Tomate Italiano (Cx 20kg)',
        category: 'Frutas e Verduras',
        unit: 'cx',
        supplier_id: supHortifruti ? supHortifruti.id : firstSupId,
        regular_unit_price: 90.0,
        collective_unit_price: 68.0, // Economia de R$ 22,00/cx (24% OFF)
        target_quantity: 120,
        current_quantity: 95,
        min_order_per_restaurant: 5,
        deadline: '2026-11-10 23:59:59.000Z',
        status: 'active',
      },
      {
        title: 'Lote Coletivo: Filé Mignon Bovino Limpo',
        description: 'Peças a vácuo inspecionadas SIF. Preço de atacado frigorífico.',
        item_name: 'Filé Mignon Peça',
        category: 'Carnes',
        unit: 'kg',
        supplier_id: supCarnes ? supCarnes.id : firstSupId,
        regular_unit_price: 62.0,
        collective_unit_price: 46.8, // Economia de R$ 15,20/kg (24.5% OFF)
        target_quantity: 150,
        current_quantity: 110,
        min_order_per_restaurant: 10,
        deadline: '2026-11-25 23:59:59.000Z',
        status: 'active',
      },
    ]

    const savedCampaigns = []
    demoCampaigns.forEach((camp) => {
      let rec = null
      try {
        const found = app.findRecordsByFilter(
          'collective_campaigns',
          "title = '" + camp.title.replace(/'/g, "\\'") + "'",
          '',
          1,
          0,
        )
        if (found && found.length > 0) rec = found[0]
      } catch (_) {}

      if (!rec) {
        rec = new Record(ccCol)
      }
      rec.set('title', camp.title)
      rec.set('description', camp.description)
      rec.set('item_name', camp.item_name)
      rec.set('category', camp.category)
      rec.set('unit', camp.unit)
      if (camp.supplier_id) rec.set('supplier_id', camp.supplier_id)
      rec.set('regular_unit_price', camp.regular_unit_price)
      rec.set('collective_unit_price', camp.collective_unit_price)
      rec.set('target_quantity', camp.target_quantity)
      rec.set('current_quantity', camp.current_quantity)
      rec.set('min_order_per_restaurant', camp.min_order_per_restaurant)
      rec.set('deadline', camp.deadline)
      rec.set('status', camp.status)
      app.save(rec)
      savedCampaigns.push(rec)
    })

    // 5. Seed de Adesões dos Restaurantes (collective_orders) gerando economia real no mês
    if (serenaUser && savedCampaigns.length > 0) {
      const demoOrders = [
        {
          campaign: savedCampaigns[0], // Salmão
          restaurant_id: serenaUser.id,
          quantity: 35,
          notes: 'Entrega na quinta-feira pela manhã',
        },
        {
          campaign: savedCampaigns[1], // Azeite 5L
          restaurant_id: serenaUser.id,
          quantity: 6,
          notes: 'Galões com lote recente',
        },
        {
          campaign: savedCampaigns[2], // Mussarela
          restaurant_id: serenaUser.id,
          quantity: 40,
          notes: 'Fatiamento próprio no restaurante',
        },
        {
          campaign: savedCampaigns[3], // Tomate Italiano
          restaurant_id: serenaUser.id,
          quantity: 8,
          notes: 'Ponto médio para molhos e saladas',
        },
      ]

      demoOrders.forEach((o) => {
        if (!o.campaign) return
        const regPrice = Number(o.campaign.get('regular_unit_price') || 0)
        const colPrice = Number(o.campaign.get('collective_unit_price') || 0)
        const totalCost = o.quantity * colPrice
        const savings = o.quantity * (regPrice - colPrice)

        let ordRec = null
        try {
          const filter =
            "campaign_id = '" + o.campaign.id + "' && restaurant_id = '" + o.restaurant_id + "'"
          const found = app.findRecordsByFilter('collective_orders', filter, '', 1, 0)
          if (found && found.length > 0) ordRec = found[0]
        } catch (_) {}

        if (!ordRec) {
          ordRec = new Record(coCol)
          ordRec.set('campaign_id', o.campaign.id)
          ordRec.set('restaurant_id', o.restaurant_id)
          ordRec.set('quantity', o.quantity)
          ordRec.set('unit_price', colPrice)
          ordRec.set('regular_price', regPrice)
          ordRec.set('total_cost', totalCost)
          ordRec.set('estimated_savings', savings)
          ordRec.set('status', 'confirmed')
          ordRec.set('notes', o.notes)
          app.save(ordRec)
        }
      })
    }

    // 6. Notificações demo de re-compra para o parceiro BPO
    if (bpoUser) {
      const demoBpoNotifs = [
        {
          user_id: bpoUser.id,
          type: 'bpo_reorder_alert',
          title: '🚨 Alerta de Recompra: Serena Café',
          message:
            'O estoque de Salmão Fresco e Tomate atingiu o nível mínimo (Lead time: 2 dias). Recompra sugerida via WhatsApp/E-mail para evitar ruptura.',
          priority: 'critical',
          channel: 'internal',
          read: false,
        },
        {
          user_id: bpoUser.id,
          type: 'bpo_reorder_alert',
          title: '📦 Reposição Preventiva: Bistrô La Maison',
          message:
            'Consumo acelerado de Filé Mignon e Azeite 5L. Sugerida adesão ao Lote Coletivo com economia prevista de R$ 680,00.',
          priority: 'warning',
          channel: 'whatsapp',
          read: false,
        },
        {
          user_id: bpoUser.id,
          type: 'collective_campaign_update',
          title: '🎯 Meta Atingida: Queijo Mussarela 2026',
          message:
            'A compra coletiva atingiu 300kg. Os pedidos consolidados foram confirmados com 24% de desconto.',
          priority: 'success',
          channel: 'email',
          read: true,
        },
      ]

      demoBpoNotifs.forEach((dn) => {
        try {
          const filter =
            "user_id = '" + bpoUser.id + "' && title = '" + dn.title.replace(/'/g, "\\'") + "'"
          const exists = app.findRecordsByFilter('notifications', filter, '', 1, 0)
          if (!exists || exists.length === 0) {
            const notif = new Record(notifCol)
            notif.set('user_id', dn.user_id)
            notif.set('type', dn.type)
            notif.set('title', dn.title)
            notif.set('message', dn.message)
            notif.set('priority', dn.priority)
            notif.set('channel', dn.channel)
            notif.set('read', dn.read)
            app.save(notif)
          }
        } catch (_) {}
      })
    }
  },
  (app) => {
    // Revert seeds if needed
  },
)
