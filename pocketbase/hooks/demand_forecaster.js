routerAdd(
  'GET',
  '/backend/v1/agents/demand-forecaster',
  (e) => {
    try {
      var sales = $app.findRecordsByFilter('sales_data', '', '-date', 200, 0)
      var inventory = $app.findRecordsByFilter('inventory', '', '-created', 100, 0)
      var suppliers = $app.findRecordsByFilter('suppliers', '', '-created', 100, 0)
      var menuItems = $app.findRecordsByFilter('menu_items', '', '-created', 100, 0)

      var salesSummary = sales.map(function (s) {
        var mi = menuItems.filter(function (m) {
          return m.id === s.getString('item_id')
        })[0]
        return {
          item: mi ? mi.getString('name') : 'unknown',
          quantity_sold: s.get('quantity_sold'),
          date: s.getString('date'),
          total_price: s.get('total_price'),
        }
      })

      var invSummary = inventory.map(function (r) {
        var sup = suppliers.filter(function (s) {
          return s.id === r.getString('supplier_id')
        })[0]
        return {
          name: r.getString('name'),
          quantity: r.get('quantity'),
          min_stock: r.get('min_stock'),
          supplier: sup ? sup.getString('name') : 'N/A',
          leadTime: sup ? sup.get('delivery_lead_time') : 3,
        }
      })

      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é o Previsor de Demanda. Analise vendas e estoque. Gere previsão para 7 dias e sugira pedidos. Notifique fornecedores com 3 dias de antecedência. Responda em português. Formato JSON: {"forecast":[{"item":"nome","estimated_qty":"X","supplier":"fornecedor","urgency":"normal/urgent"}]}',
          },
          {
            role: 'user',
            content:
              'Vendas: ' +
              JSON.stringify(salesSummary) +
              '. Estoque: ' +
              JSON.stringify(invSummary),
          },
        ],
      })

      var forecast = []
      try {
        forecast = JSON.parse(reply.choices[0].message.content).forecast || []
      } catch (_) {
        forecast = []
      }

      return e.json(200, { forecast: forecast, insights: reply.choices[0].message.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError) return e.json(503, { error: 'AI unavailable' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'AI failed' })
      return e.json(500, { error: 'Internal error' })
    }
  },
  $apis.requireAuth(),
)
