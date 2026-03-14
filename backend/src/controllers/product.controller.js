const productService = require("../services/product.service");

exports.getAllProductsController = async (req, res) => {
  try {

    const { type, page = 1 } = req.body;

    if (type !== "displayAllProducts") {
      return res.status(400).json({
        success: false,
        message: "Invalid request type"
      });
    }

    const result = await productService.getAllProducts(page);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: result.products,
      pagination: {
        totalRecords: result.total,
        currentPage: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });

  } catch (error) {

    console.error("Fetch Products Error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching products"
    });

  }
};
exports.categoryController = async (req, res) => {
  try {

    const { type } = req.body;

    if (!type || type === "listAllCategories") {

      const result = await productService.listAllCategories();

      return res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: result.data
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

exports.addProductController = async (req, res) => {
  try {

    const { product_name, category_id, price, stock, status } = req.body;
    const images = req.files;

    const product = await productService.addProduct({
      product_name,
      category_id,
      price,
      stock,
      status,
      images
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });

  } catch (error) {

    console.error("Add Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Error creating product"
    });

  }
};

exports.updateProductController = async (req, res) => {
  try {

    const {
      product_id,
      product_name,
      category_id,
      price,
      stock,
      status
    } = req.body;

    const images = req.files || [];

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const product = await productService.updateProduct({
      product_id,
      product_name,
      category_id,
      price,
      stock,
      status,
      images
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error) {

    console.error("Update Product Error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Error updating product"
    });

  }
};

exports.deleteProductController = async (req, res) => {
  try {

    const {  product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const result = await productService.deleteProduct(product_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {

    console.error("Delete Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Error deleting product"
    });

  }
};