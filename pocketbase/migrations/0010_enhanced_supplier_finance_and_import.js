migrate(
  (app) => {
    var ordersCol = app.findCollectionByNameOrId('orders')
    if (!ordersCol.fields.getByName('payment_method')) {
      ordersCol.fields.add(
        new SelectField({
          name: 'payment_method',
          values: ['pix', 'card', 'installments'],
          maxSelect: 1,
        }),
      )
    }
    if (!ordersCol.fields.getByName('payment_terms')) {
      ordersCol.fields.add(new TextField({ name: 'payment_terms' }))
    }
    if (!ordersCol.fields.getByName('interest_applied')) {
      ordersCol.fields.add(new BoolField({ name: 'interest_applied' }))
    }
    if (!ordersCol.fields.getByName('interest_rate')) {
      ordersCol.fields.add(new NumberField({ name: 'interest_rate' }))
    }
    app.save(ordersCol)

    var suppliersCol = app.findCollectionByNameOrId('suppliers')
    if (!suppliersCol.fields.getByName('bank_account_info')) {
      suppliersCol.fields.add(new JSONField({ name: 'bank_account_info' }))
    }
    if (!suppliersCol.fields.getByName('tax_id')) {
      suppliersCol.fields.add(new TextField({ name: 'tax_id' }))
    }
    if (!suppliersCol.fields.getByName('pix_key')) {
      suppliersCol.fields.add(new TextField({ name: 'pix_key' }))
    }
    app.save(suppliersCol)
  },
  (app) => {},
)
