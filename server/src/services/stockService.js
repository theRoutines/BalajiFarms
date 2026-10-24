export async function releaseStock(client, orderId) {
  const itemResult = await client.query(`
    SELECT "variantId", "quantity"
    FROM "OrderItem"
    WHERE "orderId" = $1
    ORDER BY "variantId" ASC
  `, [orderId])

  for (const item of itemResult.rows) {
    await client.query(`
      UPDATE "Variant"
      SET "stock" = "stock" + $1
      WHERE "id" = $2
    `, [item.quantity, item.variantId])
  }
}
