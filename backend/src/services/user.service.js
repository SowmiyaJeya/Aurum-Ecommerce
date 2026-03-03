const pool = require("../config/db");
const bcrypt = require("bcrypt");

const createPendingUser = async (userData) => {
  const { fullname, username, email, password, mobile, token } = userData;

  await pool.query(
    `INSERT INTO users 
     (fullname, username, email, password, mobile, telegram_token, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [fullname, username, email, password, mobile, token, 1] // 👈 status = 1
  );
};
// Save Telegram Token
const saveTelegramToken = async (email, token) => {
  await pool.query(
    "UPDATE users SET telegram_token = $1 WHERE email = $2",
    [token, email]
  );
};

// Get User By Telegram Token
const getUserByTelegramToken = async (token) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE telegram_token = $1",
    [token]
  );
  return result.rows[0];
};

// Save Telegram Chat ID
const saveChatId = async (email, chatId) => {
  await pool.query(
    "UPDATE users SET telegram_chat_id = $1 WHERE email = $2",
    [chatId, email]
  );
};

// Create User (your existing function)
const createUser = async (userData) => {
  const { fullname, username, email, password, mobile } = userData;

  await pool.query(
    `INSERT INTO users (fullname, username, email, password, mobile)
     VALUES ($1, $2, $3, $4, $5)`,
    [fullname, username, email, password, mobile]
  );
};

module.exports = {
  createPendingUser,
  saveTelegramToken,
  getUserByTelegramToken,
  saveChatId,
  createUser
};
//Display all the users
const getAllUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `SELECT fullname, username, email, mobile, updated_at 
     FROM users
     ORDER BY usercode
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM users`
  );

  return {
    users: dataQuery.rows,
    total: parseInt(countQuery.rows[0].count),
    page,
    limit
  };
};

//Add users from users tab
// const addUser = async (userData) => {
//   const { fullname, username, password, email, mobile, role } = userData;

//   // Start transaction
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // 1️⃣ Check if role exists
//     let roleResult = await client.query(
//       `SELECT roleid FROM userRoles WHERE rolename = $1`,
//       [role]
//     );

//     let roleid;

//     // 2️⃣ If role doesn't exist → insert
//     if (roleResult.rows.length === 0) {
//       const insertRole = await client.query(
//         `INSERT INTO userRoles (rolename)
//          VALUES ($1)
//          RETURNING roleid`,
//         [role]
//       );
//       roleid = insertRole.rows[0].roleid;
//     } else {
//       roleid = roleResult.rows[0].roleid;
//     }

//     // 3️⃣ Insert User
//     // await client.query(
//     //   `INSERT INTO users 
//     //   (usercode, fullname, username, password, email, mobile, status, roleid)
//     //   VALUES (
//     //     COALESCE((SELECT MAX(usercode) FROM users), 0) + 1,
//     //     $1, $2, $3, $4, $5,
//     //     1,  -- 1 = Active
//     //     $6
//     //   )`,
//     //   [fullname, username, password, email, mobile, roleid]
//     // );
//     await client.query(
//   `
//   INSERT INTO users 
//   (usercode, fullname, username, password, email, mobile, status, roleid)
//   SELECT 
//     COALESCE(MAX(usercode), 0) + 1,
//     $1, $2, $3, $4, $5,
//     1,
//     $6
//   FROM users
//   `,
//   [fullname, username, password, email, mobile, roleid]
// );
//     await client.query("COMMIT");

//     return { message: "User created successfully" };

//   } catch (error) {
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// const bcrypt = require("bcrypt");

// const bcrypt = require("bcrypt");

const addUser = async (userData) => {
  const { fullname, username, password, email, mobile, role } = userData;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Check duplicate username
    const usernameCheck = await client.query(
      `SELECT 1 FROM users WHERE username = $1`,
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      throw new Error("Username already exists");
    }

    // 2️⃣ Check duplicate email
    const emailCheck = await client.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email]
    );

    if (emailCheck.rows.length > 0) {
      throw new Error("Email already exists");
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Get or Insert Role (IMPORTANT PART)
    let roleResult = await client.query(
      `SELECT roleid FROM userRoles WHERE rolename = $1`,
      [role]
    );

    let roleid;

    if (roleResult.rows.length === 0) {
      // Insert new role
      const insertRole = await client.query(
        `INSERT INTO userRoles (rolename)
         VALUES ($1)
         RETURNING roleid`,
        [role]
      );
      roleid = insertRole.rows[0].roleid;
    } else {
      roleid = roleResult.rows[0].roleid;
    }

    // 5️⃣ Insert user (identity handles usercode)
     await client.query(
      `
      INSERT INTO users 
      (usercode, fullname, username, password, email, mobile, status, roleid)
      SELECT 
        COALESCE(MAX(usercode), 0) + 1,
        $1, $2, $3, $4, $5,
        1,
        $6
      FROM users
      `,
      [fullname, username, hashedPassword, email, mobile, roleid]
    );


    await client.query("COMMIT");

    return { message: "User created successfully" };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
module.exports = {
  createPendingUser,
  getAllUsers,
  addUser
};