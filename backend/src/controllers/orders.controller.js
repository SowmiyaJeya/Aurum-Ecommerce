const orderService = require("../services/orders.service");
const { sendOrderMessage,sendOrderStatusMessage } = require("../services/telegram.service");
const pool = require("../config/db"); 
const { sendAdminOrderMail} = require("../services/email.service");

const createOrder = async (req, res) => {
  try {
    const { usercode, total_amount, items, customer, payment } = req.body;

    // ✅ 1. Create Order
    const result = await orderService.createFullOrder(
      { usercode, total_amount },
      items,
      customer,
      payment
    );

    const order_id = result.order_id;

    // ✅ 2. Get User Details (FIXED username issue)
    const userResult = await pool.query(
      "SELECT telegram_chat_id, username,mobile FROM users WHERE usercode = $1",
      [usercode]
    );
    const chatId = userResult.rows[0]?.telegram_chat_id;
    const username = userResult.rows[0]?.username || "Customer";
    const phone = userResult.rows[0]?.mobile || "N/A";

    // ✅ 3. Send Telegram Message
    if (chatId) {
      await sendOrderMessage(chatId, {
        order_id,
        total_amount,
        payment_method: payment.method,
        customer,
        items
      });
    }

    // ✅ 4. Get Admin Emails (roleid = 6)
    const adminResult = await pool.query(
      "SELECT email FROM users WHERE roleid = 6"
    );

    const adminEmails = adminResult.rows.map(a => a.email).join(",");

    // ✅ 5. Fetch Product Details (name + image)
    const productIds = items.map(i => i.product_id);

    const productResult = await pool.query(
  `SELECT 
      p.product_id, 
      p.product_name, 
      c.category_name
   FROM products p
   LEFT JOIN category c 
   ON p.category_id = c.id
   WHERE p.product_id = ANY($1)`,
  [productIds]
);

    // ✅ 6. Map products
    const productMap = {};

productResult.rows.forEach(p => {
  productMap[p.product_id] = p;
});

const detailedItems = items.map((item, index) => ({
  sno: index + 1,
  name: productMap[item.product_id]?.product_name || "Unknown",
  category: productMap[item.product_id]?.category_name || "N/A",
  quantity: item.quantity,
  price: item.price
}));
    // ✅ 7. Build HTML for email (WITH images)
    const itemsHtml = detailedItems.map(item => `
  <tr>
    <td>${item.sno}</td>
    <td>${item.name}</td>
    <td>${item.category}</td>
    <td>${item.quantity}</td>
    <td>₹${item.price}</td>
    <td>₹${item.quantity * item.price}</td>
  </tr>
`).join("");

    // ✅ 8. Send Email to Admin
    if (adminEmails) {
      await sendAdminOrderMail({
        order_id,
        username,
        phone,
        total_amount,
        admin_email: adminEmails,
        itemsHtml
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


const handleOrderRequest = async (req, res) => {
  try {
    const { type, usercode } = req.body;

    if (type === "userOrders") {
      const data = await orderService.getLatestUserOrderDetails(usercode);

      if (!data) {
        return res.status(404).json({
          message: "No previous orders found",
        });
      }

      return res.status(200).json({
        message: "User previous order fetched",
        data,
      });
    }

    return res.status(400).json({
      message: "Invalid request type",
    });

  } catch (error) {
    console.error("Order Fetch Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const displayAllOrders = async (req, res) => {
  try {
    const { type, page = 1 } = req.body;

    if (type !== "displayAllOrders") {
      return res.status(400).json({
        message: "Invalid request type"
      });
    }

    const data = await orderService.displayAllOrders(page);

    return res.status(200).json({
      message: "Orders fetched successfully",
      page: data.page,
      limit: data.limit,
      total_orders: data.total,
      data: data.orders
    });

  } catch (error) {
    console.error("Display Orders Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getOrderItems = async (req, res) => {
  try {
    const { order_id } = req.body;
    // ✅ validate order_id
    if (!order_id) {
      return res.status(400).json({
        message: "order_id is required"
      });
    }

    // ✅ call service
    const data = await orderService.getOrderItemsByOrderId(order_id);

    // ✅ check if no data
    if (!data || !data.items || data.items.length === 0) {
      return res.status(404).json({
        message: "No items found for this order"
      });
    }

    // ✅ success response
    return res.status(200).json({
      message: "Order details fetched successfully",
      mobile: data.mobile,
      items: data.items
    });

  } catch (error) {
    console.error("Fetch Order Items Error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { order_id, status, reason } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({
        success: false,
        message: "order_id and status are required"
      });
    }

    // ✅ 1. Update status using service
    const updatedOrder = await orderService.updateOrderStatusService(
      order_id,
      status
    );

    // ✅ 2. Get user details
    const userResult = await pool.query(
      `SELECT u.telegram_chat_id, u.username
       FROM orders o
       JOIN users u ON o.usercode = u.usercode
       WHERE o.order_id = $1`,
      [order_id]
    );

    const chatId = userResult.rows[0]?.telegram_chat_id;
    const username = userResult.rows[0]?.username || "Customer";

    // ✅ 3. Send Telegram message
    if (chatId) {
      await sendOrderStatusMessage(chatId, {
        order_id,
        status,
        reason,
        username
      });
    }

    res.json({
      success: true,
      message: "Order status updated & notification sent",
      order: updatedOrder
    });

  } catch (err) {
    console.error("Update Status Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
};

module.exports = {
  handleOrderRequest,
  createOrder,
  displayAllOrders,
  getOrderItems,
  updateOrderStatus,
  
};