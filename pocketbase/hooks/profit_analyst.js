routerAdd(
  'GET',
  '/backend/v1/agents/profit-analyst',
  (e) => {
    try {
      var menuItems = $app.findRecordsByFilter('menu_items', '', '-created', 100, 0)
      var sales = $app.findRecordsByFilter('sales_data', '', '-date', 200, 0)

      var analysis = menuItems.map(function (m) {
        var itemSales = sales.filter(function (s) {
          return s.getString('item_id') === m.id
        })
        var totalSold = itemSales.reduce(function (sum, s) {
          return sum + s.get('quantity_sold')
        }, 0)
        var totalRevenue = itemSales.reduce(function (sum, s) {
          return sum + s.get('total_price')
        }, 0)
        var cost = m.get('cost')
        var price = m.get('price')
        var cmv = price > 0 ? (cost / price) * 100 : 0
        var margin = 100 - cmv
        var grossProfit = price - cost
        return {
          name: m.getString('name'),
          price: price,
          cost: cost,
          cmv: Math.round(cmv * 10) / 10,
          margin: Math.round(margin * 10) / 10,
          grossProfit: grossProfit,
          totalSold: totalSold,
          totalRevenue: totalRevenue,
          monthlyProfit: grossProfit * totalSold * 4,
        }
      })

      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é o Analista Financeiro. Analise CMV, margens e lucratividade. Responda em português, seja conciso.',
          },
          { role: 'user', content: 'Análise: ' + JSON.stringify(analysis) },
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
