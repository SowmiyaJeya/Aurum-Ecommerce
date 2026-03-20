  const axios = require('axios');
  require('dotenv').config();

  async function sendOTP(chatId, otp) {
      const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

      await axios.post(url, {
          chat_id: chatId,
          text: `🔐 Your OTP is: ${otp}\nValid for 5 minutes.`
      });
  }
  const pool = require("../config/db");

  exports.saveTelegramToken = async (email, token) => {
    await pool.query(
      "UPDATE users SET telegram_token = $1 WHERE email = $2",
      [token, email]
    );
  };

  exports.getUserByTelegramToken = async (token) => {
    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_token = $1",
      [token]
    );
    return result.rows[0];
  };

  exports.saveChatId = async (email, chatId) => {
    await pool.query(
      "UPDATE users SET telegram_chat_id = $1 WHERE email = $2",
      [chatId, email]
    );
  };

  async function sendOrderMessage(chatId, orderData) {
  try {
    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

    const {
      order_id,
      total_amount,
      payment_method,
      customer,
      items
    } = orderData;

    const itemsText = items
      .map(i => `• Product ${i.product_id} x ${i.quantity} = ₹${i.price}`)
      .join('\n');

    const message = `
🎉 *Order Confirmed!*

🆔 Order ID: ${order_id}
💰 Amount: ₹${total_amount}
💳 Payment: ${payment_method}

📦 *Items:*
${itemsText}

🚚 *Delivery Address:*
${customer.address_line1}, ${customer.city}, ${customer.state} - ${customer.pincode}

Thank you for shopping 🛍️
`;

    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });

  } catch (error) {
    console.error("Telegram Order Message Error:", error.response?.data || error.message);
  }
}

const sendOrderStatusMessage = async (chatId, data) => {
  const { order_id, status, reason, username } = data;

  let message = `📦 Order Update\n\n`;
  message += `👤 ${username}\n`;
  // message += `🆔 Order ID: ${order_id}\n`;
  // message += `📌 Status: ${status}\n`;

  if (reason) {
    message += `⚠️Your Order ID # ${order_id} was ${status} due to ${reason}\n`;
  }

  message += `\nPlease contact contact@shivasystems.com if needed.`;

  await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text: message
  });
};

  module.exports = { sendOTP ,
    sendOrderMessage,
    sendOrderStatusMessage
  };