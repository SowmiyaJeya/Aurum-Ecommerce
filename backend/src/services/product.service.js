const pool = require("../config/db");

const addProduct = async (productData) => {
  const { name, category, price, stock } = productData;

  const query = `
    INSERT INTO product (name, category, price, stock)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const result = await pool.query(query, [name, category, price, stock]);

  return result.rows[0];
};

module.exports = {
  addProduct
};