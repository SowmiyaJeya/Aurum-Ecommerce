require("dotenv").config();
const axios = require("axios");
const pool = require("../config/db"); 
const { handleTelegramStart } = require("../controllers/auth.controller");

console.log("🚀 Telegram polling started...");

let lastUpdateId = 0;

async function checkTelegramUpdates() {
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getUpdates`,
      {
        params: {
          offset: lastUpdateId + 1,
        },
      }
    );

    const updates = res.data.result;
    if (!updates) return;

    for (let update of updates) {
      lastUpdateId = update.update_id;

      if (update.message && update.message.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id;

        console.log("Received:", text);

        if (text.startsWith("/start")) {
          const token = text.split(" ")[1];

          if (!token) {
            await sendMessage(chatId, "Invalid registration link.");
                return;

          }

          // 🔎 Find user using token
          const user = await pool.query(
            "SELECT * FROM users WHERE telegram_token = $1",
            [token]
          );

          if (user.rows.length === 0) {
            await sendMessage(chatId, "Invalid or expired link.");
            continue;
          }

          const otp = generateOTP();

          // Store OTP and chat_id
          await pool.query(
            `UPDATE users 
             SET otp = $1, 
                 telegram_chat_id = $2, 
                 otp_expires = NOW() + INTERVAL '5 minutes'
             WHERE telegram_token = $3`,
            [otp, chatId, token]
          );

          await sendMessage(
            chatId,
            `Your OTP is: ${otp}\nValid for 5 minutes.`
          );

          console.log("OTP sent:", otp);
        // await handleTelegramStart(token, chatId);
        }
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendMessage(chatId, text) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text,
      }
    );
  } catch (error) {
    console.error("Failed to send Telegram message:", error.message);
  }
}

module.exports = checkTelegramUpdates;
