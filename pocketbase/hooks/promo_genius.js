routerAdd(
  'POST',
  '/backend/v1/agents/promo-genius',
  (e) => {
    try {
      var body = e.requestInfo().body || {}
      var now = new Date()
      var weekLater = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]
      var inventory = $app.findRecordsByFilter('inventory', '', 'expiry_date', 100, 0)

      var atRisk = inventory
        .filter(function (r) {
          var exp = r.getString('expiry_date')
          return exp && exp <= weekLater
        })
        .map(function (r) {
          return {
            name: r.getString('name'),
            quantity: r.get('quantity'),
            unit: r.getString('unit'),
            unit_cost: r.get('unit_cost'),
            expiry_date: r.getString('expiry_date'),
          }
        })

      if (atRisk.length === 0)
        return e.json(200, { promos: [], message: 'Nenhum item próximo ao vencimento.' })

      var context = body.context || 'Gere textos promocionais para WhatsApp e Instagram'
      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é o Motor Promocional. Crie 2 textos promocionais (um para WhatsApp, um para Instagram) para os itens próximos ao vencimento. Inclua preço com desconto. Responda em português. Formato JSON: {"promos":[{"type":"WhatsApp","product":"nome","copy":"texto"}]}',
          },
          { role: 'user', content: context + '. Itens: ' + JSON.stringify(atRisk) },
        ],
      })

      var promos = []
      try {
        promos = JSON.parse(reply.choices[0].message.content).promos || []
      } catch (_) {
        promos = [{ type: 'Texto', product: 'Geral', copy: reply.choices[0].message.content }]
      }

      return e.json(200, { promos: promos, atRisk: atRisk })
    } catch (err) {
      if (err instanceof SkipAiConfigError) return e.json(503, { error: 'AI unavailable' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'AI failed' })
      return e.json(500, { error: 'Internal error' })
    }
  },
  $apis.requireAuth(),
)
