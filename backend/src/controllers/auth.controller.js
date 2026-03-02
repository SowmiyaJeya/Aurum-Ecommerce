const crypto = require("crypto");
const bcrypt = require("bcrypt");
const generateOTP = require("../../utils/generateOtp");
const hashPassword = require("../../utils/hashPassword");
const { sendOTP } = require("../services/telegram.service");
const { saveOTP, verifyOTP } = require("../services/otp.service");
// const { createUser, saveTelegramToken, getUserByTelegramToken, saveChatId } = require("../services/user.service");
const {
  saveTelegramToken,
  getUserByTelegramToken,
  saveChatId,
  createUser
} = require("../services/user.service");
require("dotenv").config();
const pool = require("../config/db");

const { createPendingUser } = require("../services/user.service");

exports.connectTelegram = async (req, res) => {
  try {
    const { fullname, username, email, password, mobile } = req.body;

    // 🔎 Check if username or email already exists
    const existingUser = await pool.query(
      `SELECT username, email FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      if (user.username === username) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }

      if (user.email === email) {
        return res.status(400).json({
          message: "Email already registered",
        });
      }
    }

    const hashedPassword = await hashPassword(password);

    const token = crypto.randomBytes(16).toString("hex");

    // Create user with pending status
    await createPendingUser({
      fullname,
      username,
      email,
      password: hashedPassword,
      mobile,
      token
    });

    res.json({
      telegramLink: `https://t.me/triotask_bot?start=${token}`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ===============================
// 2️⃣ STEP 2 — Called from polling when /start TOKEN is received
// ===============================
exports.handleTelegramStart = async (token, chatId) => {
  try {
    const user = await getUserByTelegramToken(token);

    if (!user) {
      await sendOTP(chatId, "Invalid or expired registration link.");
      return;
    }

    // Save chat_id for this user
    await saveChatId(user.email, chatId);

    const otp = generateOTP();

    await saveOTP(user.email, otp);

    await sendOTP(chatId, `Your OTP is: ${otp}\nValid for 5 minutes.`);

    console.log("OTP sent to:", user.email);

  } catch (err) {
    console.error("Telegram Start Error:", err.message);
  }
};


// ===============================
// 3️⃣ STEP 3 — Verify OTP + Register User
// ===============================
exports.verifyOtpAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    // 🔎 Get user
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // ❌ OTP mismatch
    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // ❌ OTP expired
    if (!user.otp_expires || new Date() > user.otp_expires) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // 🔥 Use transaction (VERY IMPORTANT)
    await pool.query("BEGIN");

    // 1️⃣ Insert into otps table
    await pool.query(
      `INSERT INTO otps (user_id, otp, verified_at)
       VALUES ($1, $2, NOW())`,
      [user.id, otp]
    );

    // 2️⃣ Update users table
    await pool.query(
      `UPDATE users
       SET status = 'active',
           otp = NULL,
           otp_expires = NULL,
           telegram_token = NULL
       WHERE id = $1`,
      [user.id]
    );

    await pool.query("COMMIT");

    return res.status(200).json({
      message: "Account verified successfully",
    });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password required",
      });
    }

    // 🔎 Find user
    const result = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const user = result.rows[0];

    // 🚫 Check account status
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Account not verified. Please complete registration.",
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // ✅ Login success
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};