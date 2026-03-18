const orderService = require("../services/orders.service");
const { sendOrderMessage } = require("../services/telegram.service");
const pool = require("../config/db"); 
exports.createOrder = async (req, res) => {
  try {
    const { usercode, total_amount, items, customer, payment } = req.body;

    // ✅ create order
    const orderResult = await pool.query(
      "INSERT INTO orders (usercode, total_amount) VALUES ($1, $2) RETURNING order_id",
      [usercode, total_amount]
    );

    const order_id = orderResult.rows[0].order_id;

    // ✅ insert items (example)
    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [order_id, item.product_id, item.quantity, item.price]
      );
    }

    // ✅ get telegram chat id
    const userResult = await pool.query(
      "SELECT telegram_chat_id FROM users WHERE usercode = $1",
      [usercode]
    );

    const chatId = userResult.rows[0]?.telegram_chat_id;

    // ✅ send telegram
    if (chatId) {
      await sendOrderMessage(chatId, {
        order_id,
        total_amount,
        payment_method: payment.method,
        customer,
        items
      });
    }

    return res.json({
      success: true,
      message: "Order placed successfully",
      order_id
    });

  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};