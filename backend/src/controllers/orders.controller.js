const orderService = require("../services/orders.service");

async function createOrder(req, res) {
  try {
    const { usercode, total_amount, customer_details, items } = req.body;

    // Basic validation
    if (!usercode || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const order_id = await orderService.createOrder(usercode, total_amount, customer_details, items);
    res.status(201).json({ success: true, order_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
}

module.exports = { createOrder };