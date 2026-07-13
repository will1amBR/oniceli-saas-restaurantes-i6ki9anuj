routerAdd(
  'GET',
  '/backend/v1/supplier/crm',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')

    var supplier
    try {
      supplier = $app.findFirstRecordByFilter('suppliers', 'user_id = "' + userId + '"')
    } catch (_) {
      return e.json(200, {
        clients: [],
        abcCurve: { A: [], B: [], C: [] },
        totalRevenue: 0,
        totalOrders: 0,
        leadTime: 0,
      })
    }

    var leadTime = supplier.getNum('delivery_lead_time') || 0

    var orders = []
    try {
      orders = $app.findRecordsByFilter(
        'orders',
        'supplier_id = "' + supplier.id + '"',
        '-created',
        500,
        0,
      )
    } catch (_) {}

    var clientMap = {}
    orders.forEach(function (order) {
      var restId = order.getString('restaurant_id')
      if (!restId) return

      if (!clientMap[restId]) {
        var restUser = null
        try {
          restUser = $app.findRecordById('users', restId)
        } catch (_) {}

        clientMap[restId] = {
          id: restId,
          name: restUser ? restUser.getString('name') : 'Restaurante',
          email: restUser ? restUser.getString('email') : '',
          totalRevenue: 0,
          totalOrders: 0,
          lastOrderDate: '',
          statuses: {},
        }
      }

      var total = order.getNum('total_amount') || 0
      var status = order.getString('status') || 'pending'
      var created = order.getString('created') || ''

      clientMap[restId].totalRevenue += total
      clientMap[restId].totalOrders += 1
      clientMap[restId].statuses[status] = (clientMap[restId].statuses[status] || 0) + 1
      if (created > clientMap[restId].lastOrderDate) {
        clientMap[restId].lastOrderDate = created
      }
    })

    var clients = Object.values(clientMap)
    var totalRevenue = clients.reduce(function (sum, c) {
      return sum + c.totalRevenue
    }, 0)

    clients.sort(function (a, b) {
      return b.totalRevenue - a.totalRevenue
    })

    var abcCurve = { A: [], B: [], C: [] }
    var cumulative = 0
    clients.forEach(function (client) {
      cumulative += client.totalRevenue
      var pct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0
      client.revenuePercentage = totalRevenue > 0 ? (client.totalRevenue / totalRevenue) * 100 : 0
      client.cumulativePercentage = pct

      if (pct <= 80) {
        client.category = 'A'
        abcCurve.A.push(client.id)
      } else if (pct <= 95) {
        client.category = 'B'
        abcCurve.B.push(client.id)
      } else {
        client.category = 'C'
        abcCurve.C.push(client.id)
      }
    })

    return e.json(200, {
      clients: clients,
      abcCurve: abcCurve,
      totalRevenue: totalRevenue,
      totalOrders: orders.length,
      leadTime: leadTime,
    })
  },
  $apis.requireAuth(),
)
