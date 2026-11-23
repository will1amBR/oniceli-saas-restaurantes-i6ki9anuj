// Adiciona source_order_id em sales_data — vínculo da venda com o pedido de
// origem (kitchen_orders / bar_orders). Deduplica a baixa de estoque: quando a
// venda veio de um pedido, o hook do pedido já descontou conforme a ficha
// técnica e o hook de sales_data não desconta de novo.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('sales_data')
    if (!collection.fields.getByName('source_order_id')) {
      collection.fields.add(new TextField({ name: 'source_order_id' }))
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('sales_data')
    const field = collection.fields.getByName('source_order_id')
    if (field) {
      collection.fields.removeByName('source_order_id')
      app.save(collection)
    }
  },
)
