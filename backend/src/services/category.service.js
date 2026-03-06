const pool = require("../config/db");


const getAllCategories = async (page = 1, limit = 5) => {

  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `SELECT 
        id,
        category_name,
        updated_at,
        status
     FROM category
     ORDER BY updated_at DESC
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
  const { category_name } = categoryData;

  // Check duplicate category
  const checkQuery = `
    SELECT 1 FROM category
    WHERE LOWER(category_name) = LOWER($1)
  `;

  const checkResult = await pool.query(checkQuery, [category_name]);

  if (checkResult.rows.length > 0) {
    throw new Error("Category already exists");
  }

  // Insert category
  const insertQuery = `
    INSERT INTO category (category_name)
    VALUES ($1)
    RETURNING id, category_name, status, updated_at
  `;

  const result = await pool.query(insertQuery, [category_name]);

  return result.rows[0];
};

const updateCategory = async (categoryData) => {
  const { id, category_name, status } = categoryData;

  // Check duplicate except current record
  const checkQuery = `
    SELECT 1
    FROM category
    WHERE LOWER(category_name) = LOWER($1)
    AND id <> $2
  `;

  const checkResult = await pool.query(checkQuery, [category_name, id]);

  if (checkResult.rows.length > 0) {
    throw new Error("Category name already exists");
  }

  const updateQuery = `
    UPDATE category
    SET
      category_name = $1,
      status = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING id, category_name, status, updated_at
  `;

  const result = await pool.query(updateQuery, [category_name, status, id]);

  return result.rows[0];
};


// const updateCategory = async (categoryData) => {
//   const { id, status } = categoryData;

//   const query = `
//     UPDATE category
//     SET 
//       status = $1,
//       updated_at = CURRENT_TIMESTAMP
//     WHERE id = $2
//     RETURNING id, category_name, status, updated_at
//   `;

//   const result = await pool.query(query, [status, id]);

//   return result.rows[0];
// };
const deleteCategory = async (id) => {

  const query = `
    DELETE FROM category
    WHERE id = $1
    RETURNING id, category_name, status, updated_at
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};
module.exports = {
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};