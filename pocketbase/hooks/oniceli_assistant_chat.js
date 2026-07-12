routerAdd(
  'POST',
  '/backend/v1/assistant/chat',
  (e) => {
    try {
      var body = e.requestInfo().body || {}
      var userId = e.auth ? e.auth.id : ''
      if (!userId) return e.unauthorizedError('auth required')
      if (!body.message || !String(body.message).trim())
        return e.badRequestError('message is required')

      var result = $ai.agent('oniceli-assistant').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: String(body.message),
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: result.content,
        citations: result.citations,
        message_id: result.message_id,
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'AI temporarily unavailable' })
      if (err instanceof SkipAiAgentsError) {
        var st = err.status || 500
        return e.json(st, { error: st >= 500 ? 'agent request failed' : err.message })
      }
      if (err instanceof SkipAiError) return e.json(502, { error: 'AI temporarily unavailable' })
      throw err
    }
  },
  $apis.requireAuth(),
)
