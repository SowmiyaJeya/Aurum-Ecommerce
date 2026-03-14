const pool = require("../config/db");

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
const getProductsByCategory = async (category_id) => {

  const query = `
    SELECT 
      product_id,
      product_name,
      price
    FROM products
    WHERE category_id = $1
    AND status = 1
  `;

  const result = await pool.query(query, [category_id]);

  return result.rows;
};

const searchProducts = async (search) => {

  const query = `
    SELECT 
      product_id,
      product_name,
      price,
      stock,
      status,
      updated_at
    FROM products
    WHERE product_name ILIKE $1
    ORDER BY updated_at DESC
  `;

  const result = await pool.query(query, [`%${search}%`]);

  return result.rows;

};

const filterByPrice = async ({ min_price, max_price }) => {

  let query = `
    SELECT *
    FROM products
    WHERE 1=1
  `;

  const values = [];
  let index = 1;

  if (min_price !== undefined) {
    query += ` AND price >= $${index++}`;
    values.push(min_price);
  }

  if (max_price !== undefined) {
    query += ` AND price <= $${index++}`;
    values.push(max_price);
  }

  const result = await pool.query(query, values);

  return result.rows;
};
const filterByBrand = async ({ type, brand_ids }) => {

  let query = `
    SELECT 
      b.brand_id,
      b.brand_name
    FROM brands b
    JOIN category_brand_mapping cbm 
      ON b.brand_id = cbm.brand_id
  `;

  let values = [];

  // If filtering by brand ids
  if (type !== "allbrand" && brand_ids) {
    query += ` WHERE b.brand_id = ANY($1)`;
    values.push(brand_ids);
  }

  query += `
    GROUP BY b.brand_id, b.brand_name
    ORDER BY b.brand_name
  `;

  const result = await pool.query(query, values);

  return result.rows;
};
const filterByCategory = async ({ type, category_ids }) => {

  let query = `
    SELECT 
      p.*,
      c.category_name
    FROM products p
    JOIN category c 
      ON p.category_id = c.id
  `;

  let values = [];

  if (type !== "allcategory" && category_ids) {
    query += ` WHERE p.category_id = ANY($1)`;
    values.push(category_ids);
  }

  const result = await pool.query(query, values);

  return result.rows;
};

const getProducts = async (page = 1) => {

  const limit = 8;
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

    (
        SELECT JSON_AGG(pi.image_data ORDER BY pi.id DESC)
        FROM product_images pi
        WHERE pi.product_id = p.product_id
    ) AS product_images,

    (
        SELECT COUNT(*)
        FROM product_images pi
        WHERE pi.product_id = p.product_id
    ) AS image_count

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

module.exports={
    listAllCategories,
    getProductsByCategory,
    searchProducts,
    filterByPrice,
    filterByBrand,
    getProducts
}