const categoryService = require("../services/category.service");

exports.categoryController = async (req, res) => {
  try {

    const { type, page = 1, limit = 5 } = req.body;

    if (!type || type === "displayAllCategories") {

      const result = await categoryService.getAllCategories(page, limit);

      return res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: result.data,
        pagination: result.pagination
      });

    }

    return res.status(400).json({
      success: false,
      message: "Invalid request type"
    });

  } catch (error) {
    console.error("Fetch Categories Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
exports.addCategoryController = async (req, res) => {
  try {

    const { category_name, brand_ids } = req.body;

    // Validate category name
    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    // Validate brands
    if (!brand_ids || !Array.isArray(brand_ids) || brand_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one brand must be selected"
      });
    }

    const category = await categoryService.addCategory({
      category_name,
      brand_ids
    });

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: category
    });

  } catch (error) {

    console.error("Add Category Error:", error);

    if (error.message.includes("exists")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};
exports.updateCategoryController = async (req, res) => {
  try {

    const { id, category_name, status, brand_ids } = req.body;

    // Validate category id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required"
      });
    }

    // Validate category name
    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    // Validate brands (optional but recommended)
    if (!brand_ids || !Array.isArray(brand_ids)) {
      return res.status(400).json({
        success: false,
        message: "brand_ids must be an array"
      });
    }

    const updatedCategory = await categoryService.updateCategory({
      id,
      category_name,
      status,
      brand_ids
    });

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory
    });

  } catch (error) {

    console.error("Update Category Error:", error);

    if (error.message.includes("exists")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};
exports.deleteCategoryController = async (req, res) => {
  try {

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required"
      });
    }

    const deletedCategory = await categoryService.deleteCategory(id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deletedCategory
    });

  } catch (error) {

    console.error("Delete Category Error:", error);

    // Handle category used in products
    if (error.message.includes("cannot be deleted")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });

  }
};
exports.brandController = async (req, res) => {
  try {

    const { type } = req.body;

    if (!type || type === "displayAllBrands") {

      const brands = await categoryService.getAllBrands();

      return res.status(200).json({
        success: true,
        message: "Brands fetched successfully",
        data: brands
      });
    }

  } catch (error) {

    console.error("Fetch Brands Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};