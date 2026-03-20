const pool = require("../config/db"); 

const createFullOrder = async (orderData, items, customer, payment) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const statusRes = await client.query(
  `SELECT status_id FROM order_status WHERE status_name = 'Placed'`
);

  const placedStatusId = statusRes.rows[0].status_id;

    // 🟢 1. Orders
    const orderResult = await client.query(
      `INSERT INTO orders (usercode, total_amount, status_id)
       VALUES ($1, $2, $3)
       RETURNING order_id`,
      [orderData.usercode, orderData.total_amount, placedStatusId]
    );

    const orderId = orderResult.rows[0].order_id;

    // 🟢 2. Order Items (multiple)
    for (let item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // 🟢 3. Customer Details
    await client.query(
      `INSERT INTO order_customer_details
       (order_id, username, email, mobile, address_line1, address_line2, city, state, pincode, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        orderId,
        customer.username,
        customer.email,
        customer.mobile,
        customer.address_line1,
        customer.address_line2,
        customer.city,
        customer.state,
        customer.pincode,
        customer.country
      ]
    );

    // 🟢 4. Payment
    let cardholder_name = null;
    let expiry_date = null;
    let cvv = null;

    if (payment.method === "CARD") {
      cardholder_name = payment.cardholder_name;
      expiry_date = payment.expiry_date;
      cvv = payment.cvv;
    }

    await client.query(
      `INSERT INTO payment 
       (order_id, cardholder_name, method, expiry_date, cvv)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, cardholder_name, payment.method, expiry_date, cvv]
    );

    await client.query("COMMIT");

    return { order_id: orderId };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getLatestUserOrderDetails = async (usercode) => {
  const query = `
    SELECT 
      o.order_id,
      o.usercode,
      o.total_amount,
      s.status_name,
      c.username,
      c.email,
      c.mobile,
      c.address_line1,
      c.address_line2,
      c.city,
      c.state,
      c.pincode,
      c.country
    FROM orders o
    JOIN order_customer_details c 
      ON o.order_id = c.order_id
    JOIN order_status s
      ON o.status_id=s.status_id

    WHERE o.usercode = $1
    ORDER BY o.created_at DESC
    LIMIT 1;
  `;

  const result = await pool.query(query, [usercode]);
  return result.rows[0];
};

const displayAllOrders = async (page = 1) => {
  const limit = 5;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      o.order_id,
      c.username,
      p.method,
      o.total_amount,
      s.status_name,
      o.updated_at
    FROM orders o
    LEFT JOIN order_customer_details c 
      ON o.order_id = c.order_id
    LEFT JOIN payment p 
      ON o.order_id = p.order_id
    LEFT JOIN order_status s
      ON o.status_id=s.status_id
    ORDER BY o.updated_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [limit, offset]);

  const countQuery = `SELECT COUNT(*) FROM orders`;
  const countResult = await pool.query(countQuery);

  return {
    orders: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit
  };
};

const getOrderItemsByOrderId = async (order_id) => {
  const itemsQuery = `
    SELECT 
    oi.id,
    oi.product_id,
    p.product_name AS product_name,
    (
      SELECT image_data 
      FROM product_images pi 
      WHERE pi.product_id = oi.product_id 
      LIMIT 1
    ) AS product_image,
    oi.quantity,
    oi.price
  FROM order_items oi
  JOIN products p 
    ON oi.product_id = p.product_id
  WHERE oi.order_id = $1
  `;

  const mobileQuery = `
    SELECT mobile 
    FROM order_customer_details 
    WHERE order_id = $1
  `;

  const itemsResult = await pool.query(itemsQuery, [order_id]);
  const mobileResult = await pool.query(mobileQuery, [order_id]);

  return {
    mobile: mobileResult.rows[0]?.mobile,
    items: itemsResult.rows
  };
};

const updateOrderStatusService = async (order_id, status) => {
  try {
    // 🔹 1. Get status_id
    const statusResult = await pool.query(
      `SELECT status_id FROM order_status WHERE status_name = $1`,
      [status]
    );

    if (statusResult.rows.length === 0) {
      throw new Error("Invalid status");
    }

    const status_id = statusResult.rows[0].status_id;

    // 🔹 2. Update order
    const result = await pool.query(
      `UPDATE orders 
       SET status_id = $1, updated_at = NOW()
       WHERE order_id = $2
       RETURNING *`,
      [status_id, order_id]
    );

    if (result.rows.length === 0) {
      throw new Error("Order not found");
    }

    return result.rows[0];

  } catch (err) {
    throw err;
  }
};


module.exports = {
  createFullOrder,
  getLatestUserOrderDetails,
  displayAllOrders,
  getOrderItemsByOrderId,
  updateOrderStatusService
};