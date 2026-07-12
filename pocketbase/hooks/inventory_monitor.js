routerAdd(
  'GET',
  '/backend/v1/agents/inventory-monitor',
  (e) => {
    try {
      var userId = e.auth ? e.auth.id : ''
      var inventory = $app.findRecordsByFilter('inventory', '', '-created', 100, 0)
      var suppliers = $app.findRecordsByFilter('suppliers', '', '-created', 100, 0)
      var notifCol = $app.findCollectionByNameOrId('notifications')

      var analysis = inventory.map(function (r) {
        var supId = r.getString('supplier_id')
        var supplier = suppliers.filter(function (s) {
          return s.id === supId
        })[0]
        var leadTime = supplier ? supplier.get('delivery_lead_time') : 3
        var avgConsumption = r.get('min_stock') / 2
        var safetyStock = Math.ceil(avgConsumption * leadTime * 1.15)
        var needsReposition = r.get('quantity') < safetyStock

        if (needsReposition) {
          var title = 'Ruptura: ' + r.getString('name')
          try {
            $app.findFirstRecordByData('notifications', 'title', title)
          } catch (_) {
            var n = new Record(notifCol)
            n.set('user_id', userId)
            n.set('type', 'stock_rupture')
            n.set('title', title)
            n.set('priority', 'critical')
            n.set('channel', 'internal')
            n.set(
              'message',
              'Estoque: ' +
                r.get('quantity') +
                r.getString('unit') +
                '. Mínimo: ' +
                r.get('min_stock') +
                r.getString('unit') +
                '.',
            )
            n.set('read', false)
            $app.save(n)
          }
        }

        return {
          name: r.getString('name'),
          quantity: r.get('quantity'),
          unit: r.getString('unit'),
          min_stock: r.get('min_stock'),
          unit_cost: r.get('unit_cost'),
          category: r.getString('category'),
          leadTime: leadTime,
          avgConsumption: avgConsumption,
          safetyStock: safetyStock,
          needsReposition: needsReposition,
        }
      })

      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é o Agente de Estoque. Analise o inventário e identifique itens críticos. Responda em português, seja conciso.',
          },
          { role: 'user', content: 'Analise: ' + JSON.stringify(analysis) },
        ],
      })

      return e.json(200, { analysis: analysis, insights: reply.choices[0].message.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError) return e.json(503, { error: 'AI unavailable' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'AI failed' })
      return e.json(500, { error: 'Internal error' })
    }
  },
  $apis.requireAuth(),
)
