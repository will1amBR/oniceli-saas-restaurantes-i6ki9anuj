routerAdd(
  'GET',
  '/backend/v1/agents/waste-guard',
  (e) => {
    try {
      var userId = e.auth ? e.auth.id : ''
      var now = new Date()
      var weekLater = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]
      var inventory = $app.findRecordsByFilter('inventory', '', 'expiry_date', 100, 0)
      var notifCol = $app.findCollectionByNameOrId('notifications')

      var atRisk = inventory
        .filter(function (r) {
          var exp = r.getString('expiry_date')
          return exp && exp <= weekLater
        })
        .map(function (r) {
          var loss = r.get('quantity') * r.get('unit_cost')
          var title = 'Validade: ' + r.getString('name')
          try {
            $app.findFirstRecordByData('notifications', 'title', title)
          } catch (_) {
            var n = new Record(notifCol)
            n.set('user_id', userId)
            n.set('type', 'expiry_warning')
            n.set('title', title)
            n.set('priority', 'critical')
            n.set('channel', 'push')
            n.set(
              'message',
              r.get('quantity') +
                r.getString('unit') +
                ' de ' +
                r.getString('name') +
                ' vence em breve.',
            )
            n.set('read', false)
            $app.save(n)
          }
          return {
            name: r.getString('name'),
            quantity: r.get('quantity'),
            unit: r.getString('unit'),
            unit_cost: r.get('unit_cost'),
            expiry_date: r.getString('expiry_date'),
            financial_loss: loss,
          }
        })

      var totalLoss = atRisk.reduce(function (sum, i) {
        return sum + i.financial_loss
      }, 0)
      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é o Agente Anti-Desperdício. Sugira mitigações comerciais para itens vencendo. Responda em português.',
          },
          {
            role: 'user',
            content: 'Itens em risco: ' + JSON.stringify(atRisk) + '. Perda total: R$' + totalLoss,
          },
        ],
      })

      return e.json(200, {
        atRisk: atRisk,
        totalLoss: totalLoss,
        insights: reply.choices[0].message.content,
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) return e.json(503, { error: 'AI unavailable' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'AI failed' })
      return e.json(500, { error: 'Internal error' })
    }
  },
  $apis.requireAuth(),
)
