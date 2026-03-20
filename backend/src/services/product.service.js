const pool = require("../config/db");

const getAllProducts = async (page = 1) => {

  const limit = 5;
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
`SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    p.stock,
    p.status,
    p.updated_at,

    COALESCE(
        (
            SELECT pi.image_data
            FROM product_images pi
            WHERE pi.product_id = p.product_id
            ORDER BY pi.id DESC
            LIMIT 1
        ),
        p.product_image
    ) AS product_image

FROM products p
LEFT JOIN category c
ON p.category_id = c.id

ORDER BY p.updated_at DESC
LIMIT $1 OFFSET $2`,
[limit, offset]
);

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM products`
  );

  return {
    products: dataQuery.rows,
    total: parseInt(countQuery.rows[0].count),
    page,
    limit
  };
};
const listAllCategories = async () => {

  const result = await pool.query(
    `SELECT 
        id,
        category_name,
        updated_at,
        status
     FROM category
     WHERE status = 1
     ORDER BY updated_at DESC`
  );

  return {
    data: result.rows
  };
};
const addProduct = async ({
  product_name,
  category_id,
  price,
  stock,
  status,
  images
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Insert product
    const productResult = await client.query(
      `INSERT INTO products
      (product_name, category_id, price, stock, status)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING product_id`,
      [product_name, category_id, price, stock, status]
    );

    const product_id = productResult.rows[0].product_id;

    // Insert images
    for (const img of images) {
      await client.query(
        `INSERT INTO product_images (product_id, image_data)
         VALUES ($1,$2)`,
        [product_id, img.buffer]
      );
    }

    await client.query("COMMIT");

    return { product_id };

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }
};

const updateProduct = async ({
  product_id,
  product_name,
  category_id,
  price,
  stock,
  status,
  images
}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // 1️⃣ Check if product exists
    const check = await client.query(
      `SELECT 1 FROM products WHERE product_id = $1`,
      [product_id]
    );

    if (check.rowCount === 0) {
      throw new Error("Product not found");
    }

    // 2️⃣ Update product details
    await client.query(
      `UPDATE products
       SET product_name = $1,
           category_id = $2,
           price = $3,
           stock = $4,
           status = $5,
           updated_at = NOW()
       WHERE product_id = $6`,
      [product_name, category_id, price, stock, status, product_id]
    );

    // 3️⃣ If new images uploaded
    if (images && images.length > 0) {

      // remove old images
      await client.query(
        `DELETE FROM product_images
         WHERE product_id = $1`,
        [product_id]
      );

      // insert new images
      for (const img of images) {

        await client.query(
          `INSERT INTO product_images (product_id, image_data)
           VALUES ($1,$2)`,
          [product_id, img.buffer]
        );

      }
    }

    await client.query("COMMIT");

    return { product_id };

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }
};
const deleteProduct = async (product_id) => {

  const result = await pool.query(
    `DELETE FROM products
     WHERE product_id = $1
     RETURNING *`,
    [product_id]
  );

  return result.rows[0];

};

module.exports = {
  addProduct,
  getAllProducts,
  listAllCategories,
  updateProduct,
  deleteProduct
};