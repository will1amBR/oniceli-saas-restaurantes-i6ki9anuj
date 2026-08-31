routerAdd(
  'POST',
  '/backend/v1/bpo/reorder-alert',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')

    var rawBody = e.requestInfo().body || {}
    var restaurantId = rawBody.restaurant_id
    var itemId = rawBody.item_id
    var channel = rawBody.channel || 'all' // 'internal' | 'email' | 'whatsapp' | 'all'
    var customNotes = rawBody.notes || ''

    var restUser = null
    var invItem = null
    var bpoPartner = null

    try {
      if (restaurantId) restUser = $app.findRecordById('users', restaurantId)
      if (itemId) invItem = $app.findRecordById('inventory', itemId)
    } catch (_) {}

    var bpoPartnerId = restUser ? restUser.getString('bpo_partner_id') : ''
    if (!bpoPartnerId && e.auth) {
      // Se quem chamou foi o próprio parceiro BPO
      if (e.auth.getString('role') === 'bpo') {
        bpoPartnerId = e.auth.id
      }
    }

    if (bpoPartnerId) {
      try {
        bpoPartner = $app.findRecordById('users', bpoPartnerId)
      } catch (_) {}
    }

    var itemName = invItem ? invItem.getString('name') : 'Mantimentos em falta'
    var restaurantName = restUser ? restUser.getString('name') : 'Restaurante Cliente'
    var currentQty = invItem ? invItem.get('quantity') : 0
    var minStock = invItem ? invItem.get('min_stock') : 0
    var unit = invItem ? invItem.getString('unit') : 'un'

    var notifCol = $app.findCollectionByNameOrId('notifications')
    var createdNotifs = []
    var emailStatus = 'pending'
    var whatsappStatus = 'ready'

    var alertTitle = '🚨 Recompra de Mantimentos: ' + restaurantName
    var alertMsg =
      'Item crítico: ' +
      itemName +
      ' (Estoque atual: ' +
      currentQty +
      ' ' +
      unit +
      ' / Mínimo: ' +
      minStock +
      ' ' +
      unit +
      '). ' +
      (customNotes ? 'Obs: ' + customNotes : 'Necessário acionar fornecedor ou pool coletivo.')

    // 1. Notificação In-App para o Parceiro BPO (e opcionalmente restaurante)
    if (bpoPartnerId) {
      var nBpo = new Record(notifCol)
      nBpo.set('user_id', bpoPartnerId)
      nBpo.set('type', 'bpo_reorder_alert')
      nBpo.set('title', alertTitle)
      nBpo.set('message', alertMsg)
      nBpo.set('priority', 'critical')
      nBpo.set('channel', channel === 'all' ? 'internal' : channel)
      nBpo.set('read', false)
      try {
        $app.save(nBpo)
        createdNotifs.push(nBpo.id)
      } catch (_) {}
    }

    if (restaurantId && restaurantId !== bpoPartnerId) {
      var nRest = new Record(notifCol)
      nRest.set('user_id', restaurantId)
      nRest.set('type', 'purchase_needed')
      nRest.set('title', 'Alerta de Recompra: ' + itemName)
      nRest.set(
        'message',
        'Seu parceiro BPO monitorou estoque baixo de ' +
          itemName +
          '. Verifique as compras coletivas ativas para economizar.',
      )
      nRest.set('priority', 'warning')
      nRest.set('channel', 'internal')
      nRest.set('read', false)
      try {
        $app.save(nRest)
        createdNotifs.push(nRest.id)
      } catch (_) {}
    }

    // 2. Disparo de E-mail para o parceiro BPO / Restaurante se solicitado
    if (channel === 'email' || channel === 'all') {
      var targetEmail = bpoPartner ? bpoPartner.getString('email') : ''
      if (!targetEmail && e.auth) targetEmail = e.auth.getString('email')

      if (targetEmail) {
        try {
          var message = new MailerMessage({
            from: {
              address: $app.settings().meta.senderAddress,
              name: $app.settings().meta.senderName,
            },
            to: [{ address: targetEmail }],
            subject: alertTitle + ' [Oniceli BPO 2026]',
            html:
              '<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 8px;">' +
              '<h2 style="color: #059669;">Oniceli BPO · Alerta de Recompra</h2>' +
              '<p>Olá,</p>' +
              '<p>O sistema de inteligência Oniceli identificou a necessidade imediata de recompra para o cliente <strong>' +
              restaurantName +
              '</strong>:</p>' +
              '<div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">' +
              '<p style="margin: 4px 0;"><strong>Insumo:</strong> ' +
              itemName +
              '</p>' +
              '<p style="margin: 4px 0;"><strong>Estoque Atual:</strong> ' +
              currentQty +
              ' ' +
              unit +
              '</p>' +
              '<p style="margin: 4px 0;"><strong>Nível Mínimo:</strong> ' +
              minStock +
              ' ' +
              unit +
              '</p>' +
              (customNotes
                ? '<p style="margin: 4px 0;"><strong>Observação:</strong> ' + customNotes + '</p>'
                : '') +
              '</div>' +
              '<p>Recomendamos incluir este item no pool de Compra Coletiva do mês para garantir até 25% de economia aos clientes da sua carteira.</p>' +
              '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' +
              '<small style="color: #94a3b8;">Oniceli SaaS Restaurantes © 2026</small>' +
              '</div>',
          })
          $app.newMailClient().send(message)
          emailStatus = 'sent'
        } catch (mailErr) {
          emailStatus = 'failed: ' + mailErr.message
        }
      }
    }

    // 3. WhatsApp payload preparado / URL pronta
    var bpoPhone = bpoPartner ? bpoPartner.getString('phone') : ''
    var restPhone = restUser ? restUser.getString('phone') : ''
    var targetPhone = bpoPhone || restPhone || ''
    var waText =
      '🚨 *[Oniceli BPO 2026] Alerta de Recompra*\n\n' +
      '*Restaurante:* ' +
      restaurantName +
      '\n' +
      '*Item:* ' +
      itemName +
      '\n' +
      '*Estoque Atual:* ' +
      currentQty +
      ' ' +
      unit +
      ' (Mínimo: ' +
      minStock +
      ' ' +
      unit +
      ')\n\n' +
      '💡 *Ação:* Solicitar pedido ou consolidar no lote de compra coletiva.'

    return e.json(200, {
      success: true,
      notificationIds: createdNotifs,
      channels: {
        in_app: 'delivered',
        email: emailStatus,
        whatsapp: {
          status: whatsappStatus,
          target_phone: targetPhone,
          suggested_text: waText,
        },
      },
      summary: {
        restaurant: restaurantName,
        item: itemName,
        current_quantity: currentQty,
        min_stock: minStock,
        unit: unit,
      },
    })
  },
  $apis.requireAuth(),
)
