const pool = require("../config/db");

const getAllBrands = async (page = 1, limit = 5) => {

  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT 
      b.brand_id,
      b.brand_name,
      c.id AS category_id,
      c.category_name,
      b.status,
      b.created_at,
      b.updated_at
    FROM category_brand_mapping cb
    JOIN brands b ON cb.brand_id = b.brand_id
    JOIN category c ON cb.category_id = c.id
    ORDER BY b.brand_id DESC
    LIMIT $1 OFFSET $2
  `;

  const countQuery = `
    SELECT COUNT(*) 
    FROM category_brand_mapping
  `;

  const data = await pool.query(dataQuery, [limit, offset]);
  const count = await pool.query(countQuery);

  return {
    brands: data.rows,
    total: parseInt(count.rows[0].count)
  };
};
const addBrand = async (brand_name, category_ids) => {

  // Check if brand already exists
  const brandCheckQuery = `
    SELECT brand_id 
    FROM brands
    WHERE LOWER(brand_name) = LOWER($1)
  `

  const brandCheck = await pool.query(brandCheckQuery, [brand_name])

  let brand_id

  if (brandCheck.rows.length > 0) {
    brand_id = brandCheck.rows[0].brand_id
  } else {

    // Insert new brand
    const insertBrandQuery = `
      INSERT INTO brands (brand_name, status, created_at, updated_at)
      VALUES ($1, 1, NOW(), NOW())
      RETURNING brand_id
    `

    const brandResult = await pool.query(insertBrandQuery, [brand_name])
    brand_id = brandResult.rows[0].brand_id
  }

  // Insert category mappings
  for (let category_id of category_ids) {

    const mappingInsertQuery = `
      INSERT INTO category_brand_mapping (category_id, brand_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (category_id, brand_id) DO NOTHING
    `

    await pool.query(mappingInsertQuery, [category_id, brand_id])
  }

  return {
    brand_id
  }
}
const updateBrand = async (brand_id, brand_name, status) => {

  // Check if another brand already has the same name
  const checkQuery = `
    SELECT brand_id
    FROM brands
    WHERE LOWER(brand_name) = LOWER($1)
    AND brand_id != $2
  `;

  const checkResult = await pool.query(checkQuery, [brand_name, brand_id]);

  if (checkResult.rows.length > 0) {
    return { alreadyExists: true };
  }

  const updateQuery = `
    UPDATE brands
    SET 
      brand_name = $1,
      status = $2,
      updated_at = NOW()
    WHERE brand_id = $3
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [brand_name, status, brand_id]);

  return {
    alreadyExists: false,
    data: result.rows[0]
  };
};

const deleteBrand = async (brand_id, category_id) => {

  const deleteQuery = `
    DELETE FROM category_brand_mapping
    WHERE brand_id = $1 AND category_id = $2
    RETURNING *
  `

  const result = await pool.query(deleteQuery, [brand_id, category_id])

  if (result.rows.length === 0) {
    return { notFound: true }
  }

  return { notFound: false }
}

module.exports = {
  addBrand,
  getAllBrands,
  updateBrand,
  deleteBrand
}