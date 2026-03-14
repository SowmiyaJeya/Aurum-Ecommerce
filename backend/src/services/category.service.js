const pool = require("../config/db");

const getAllCategories = async (page = 1, limit = 5) => {

  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `SELECT 
        c.id,
        c.category_name,
        STRING_AGG(b.brand_name, ', ') AS brands,
        c.updated_at,
        c.status
     FROM category c
     LEFT JOIN category_brand_mapping cm 
        ON c.id = cm.category_id
     LEFT JOIN brands b 
        ON cm.brand_id = b.brand_id
     GROUP BY c.id
     ORDER BY c.updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM category`
  );

  const totalRecords = parseInt(countQuery.rows[0].count);
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    data: dataQuery.rows,
    pagination: {
      totalRecords,
      totalPages,
      currentPage: page,
      limit
    }
  };
};
const addCategory = async (categoryData) => {

  const { category_name, brand_ids } = categoryData;

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Check duplicate category
    const checkQuery = `
      SELECT 1 FROM category
      WHERE LOWER(category_name) = LOWER($1)
    `;

    const checkResult = await client.query(checkQuery, [category_name]);

    if (checkResult.rows.length > 0) {
      throw new Error("Category already exists");
    }

    // Insert category
    const insertCategoryQuery = `
      INSERT INTO category (category_name)
      VALUES ($1)
      RETURNING id, category_name, status, updated_at
    `;

    const categoryResult = await client.query(insertCategoryQuery, [category_name]);

    const category_id = categoryResult.rows[0].id;

    // Insert category-brand mapping
    for (const brand_id of brand_ids) {

      const mappingQuery = `
        INSERT INTO category_brand_mapping (category_id, brand_id)
        VALUES ($1, $2)
      `;

      await client.query(mappingQuery, [category_id, brand_id]);
    }

    await client.query("COMMIT");

    return categoryResult.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }
};

const updateCategory = async (categoryData) => {

  const { id, category_name, status, brand_ids } = categoryData;

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Check duplicate category name except current
    const checkQuery = `
      SELECT 1
      FROM category
      WHERE LOWER(category_name) = LOWER($1)
      AND id <> $2
    `;

    const checkResult = await client.query(checkQuery, [category_name, id]);

    if (checkResult.rows.length > 0) {
      throw new Error("Category name already exists");
    }

    // Update category
    const updateQuery = `
      UPDATE category
      SET
        category_name = $1,
        status = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, category_name, status, updated_at
    `;

    const result = await client.query(updateQuery, [
      category_name,
      status,
      id
    ]);

    // Get existing brand mappings
    const existingQuery = `
      SELECT brand_id
      FROM category_brand_mapping
      WHERE category_id = $1
    `;

    const existingResult = await client.query(existingQuery, [id]);

    const existingBrandIds = existingResult.rows.map(r => r.brand_id);

    // Brands to insert
    const brandsToInsert = brand_ids.filter(
      b => !existingBrandIds.includes(b)
    );

    // Brands to delete
    const brandsToDelete = existingBrandIds.filter(
      b => !brand_ids.includes(b)
    );

    // Insert new mappings
    for (const brand_id of brandsToInsert) {

      await client.query(
        `INSERT INTO category_brand_mapping (category_id, brand_id)
         VALUES ($1, $2)`,
        [id, brand_id]
      );

    }

    // Delete removed mappings
    for (const brand_id of brandsToDelete) {

      await client.query(
        `DELETE FROM category_brand_mapping
         WHERE category_id = $1 AND brand_id = $2`,
        [id, brand_id]
      );

    }

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }
};
const deleteCategory = async (id) => {

  // Check if category is used in products
  const checkQuery = `
    SELECT 1
    FROM products
    WHERE category_id = $1
    LIMIT 1
  `;

  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length > 0) {
    throw new Error("Category cannot be deleted because products are using it");
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Delete mappings
    await client.query(
      `DELETE FROM category_brand_mapping
       WHERE category_id = $1`,
      [id]
    );

    // Delete category
    const result = await client.query(
      `DELETE FROM category
       WHERE id = $1
       RETURNING id, category_name, status, updated_at`,
      [id]
    );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }
};

const getAllBrands = async () => {

  const query = `
    SELECT brand_id, brand_name, status, updated_at
    FROM brands
    ORDER BY brand_name
  `;

  const result = await pool.query(query);

  return result.rows;
};
module.exports = {
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getAllBrands
};