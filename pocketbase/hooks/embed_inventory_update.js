onRecordAfterUpdateSuccess((e) => {
  var nameChanged = e.record.getString('name') !== e.record.original().getString('name')
  var catChanged = e.record.getString('category') !== e.record.original().getString('category')
  var locChanged = e.record.getString('location') !== e.record.original().getString('location')
  if (!nameChanged && !catChanged && !locChanged) return e.next()
  var text = (
    e.record.getString('name') +
    ' ' +
    e.record.getString('category') +
    ' ' +
    e.record.getString('location')
  ).trim()
  if (!text) return e.next()
  try {
    var res = $ai.embed({ input: text })
    var record = $app.findRecordById('inventory', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    console.log('embedding failed for ' + e.record.id)
  }
  return e.next()
}, 'inventory')
