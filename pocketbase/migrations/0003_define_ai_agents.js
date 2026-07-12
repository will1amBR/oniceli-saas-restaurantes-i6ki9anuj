migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'oniceli-assistant',
      name: 'Oniceli AI Assistant',
      description: 'Assistente conversacional para consultas sobre estoque, vendas e finanças.',
      systemPrompt:
        'Você é o Oniceli AI Assistant, especialista em gestão de restaurantes. Responda em português brasileiro, seja conciso e prático. Use os dados das coleções para fornecer insights acionáveis. Se não houver dados suficientes, indique o que está faltando.',
      tier: 'fast',
      tools: [
        { collection: 'inventory', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'sales_data', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'menu_items', perms: { read: true, list: true }, actAs: 'admin' },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'O Oniceli é um SaaS para gestão de restaurantes com IA. As coleções principais são: inventory (estoque), sales_data (vendas), menu_items (pratos), suppliers (fornecedores), waste_logs (desperdícios). O CMV deve ficar abaixo de 30%. A margem de segurança de estoque é 15%.',
          },
        },
      ],
    })

    $ai.agents.define(app, {
      slug: 'inventory-monitor',
      name: 'Inventory Monitor',
      description: 'Monitora níveis de estoque e calcula necessidade de reposição.',
      systemPrompt:
        'Você é o Agente de Estoque. Analise os dados de inventário e fornecedores. Calcule: estoque de segurança = (consumo_diario_medio * lead_time) * 1.15. Identifique itens que precisam reposição. Responda em português, seja conciso.',
      tier: 'fast',
      tools: [
        { collection: 'inventory', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'suppliers', perms: { read: true, list: true }, actAs: 'admin' },
      ],
    })

    $ai.agents.define(app, {
      slug: 'waste-guard',
      name: 'Waste Guard',
      description: 'Monitora validades e calcula impacto financeiro de desperdícios.',
      systemPrompt:
        'Você é o Agente Anti-Desperdício. Identifique itens vencendo em até 7 dias. Calcule perda total = quantidade * custo_unitario. Sugira mitigações comerciais. Responda em português.',
      tier: 'fast',
      tools: [{ collection: 'inventory', perms: { read: true, list: true }, actAs: 'admin' }],
    })

    $ai.agents.define(app, {
      slug: 'profit-analyst',
      name: 'Profit Analyst',
      description: 'Calcula CMV, margens e lucratividade por prato.',
      systemPrompt:
        'Você é o Analista Financeiro. Calcule CMV, margem de contribuição e lucratividade de cada prato. CMV = custo / preco * 100. Responda em português com análises acionáveis.',
      tier: 'fast',
      tools: [
        { collection: 'menu_items', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'sales_data', perms: { read: true, list: true }, actAs: 'admin' },
      ],
    })

    $ai.agents.define(app, {
      slug: 'promo-genius',
      name: 'Promo Genius',
      description: 'Gera campanhas promocionais para itens próximos ao vencimento.',
      systemPrompt:
        'Você é o Motor Promocional. Crie textos promocionais atrativos para WhatsApp e Instagram para itens próximos ao vencimento. Inclua preço, desconto e chamada para ação. Responda em português.',
      tier: 'fast',
      tools: [
        { collection: 'inventory', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'menu_items', perms: { read: true, list: true }, actAs: 'admin' },
      ],
    })

    $ai.agents.define(app, {
      slug: 'demand-forecaster',
      name: 'Demand Forecaster',
      description: 'Prevê demanda e notifica fornecedores com antecedência.',
      systemPrompt:
        'Você é o Previsor de Demanda. Analise vendas históricas e estoque atual. Gere previsão de demanda para os próximos 7 dias. Sugira pedidos de compra. Responda em português.',
      tier: 'fast',
      tools: [
        { collection: 'sales_data', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'inventory', perms: { read: true, list: true }, actAs: 'admin' },
        { collection: 'suppliers', perms: { read: true, list: true }, actAs: 'admin' },
      ],
    })
  },
  (app) => {
    ;[
      'oniceli-assistant',
      'inventory-monitor',
      'waste-guard',
      'profit-analyst',
      'promo-genius',
      'demand-forecaster',
    ].forEach(function (slug) {
      try {
        $ai.agents.delete(app, slug)
      } catch (_) {}
    })
  },
)
