const pool = require("../config/db"); 

async function createOrder(usercode, total_amount, customer_details, items) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1️⃣ Insert into orders table
    const orderInsert = `
      INSERT INTO orders (usercode, total_amount)
      VALUES ($1, $2) RETURNING order_id
    `;
    const orderResult = await client.query(orderInsert, [usercode, total_amount]);
    const order_id = orderResult.rows[0].order_id;

    // 2️⃣ Insert into order_customer_details
    const customerInsert = `
      INSERT INTO order_customer_details 
      (order_id, fullname, email, mobile, address_line1, address_line2, city, state, pincode, country)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `;
    const cd = customer_details;
    await client.query(customerInsert, [
      order_id,
      cd.fullname,
      cd.email,
      cd.mobile,
      cd.address_line1,
      cd.address_line2 || "",
      cd.city,
      cd.state,
      cd.pincode,
      cd.country
    ]);

    // 3️⃣ Insert into order_items
    const itemInsert = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4)
    `;
    for (let item of items) {
      await client.query(itemInsert, [order_id, item.product_id, item.quantity, item.price]);
    }

    await client.query("COMMIT");
    return order_id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createOrder };