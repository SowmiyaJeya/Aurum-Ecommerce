const productService = require("../services/lists.service");
exports.allCategoryController = async (req, res) => {
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

exports.getProductsByCategoryController = async (req, res) => {
  try {

    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required"
      });
    }

    const products = await productService.getProductsByCategory(category_id);

    res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {

    console.error("Fetch Products Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

exports.searchProductsController = async (req, res) => {
  try {

    const { search } = req.body || {};

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required"
      });
    }

    const products = await productService.searchProducts(search);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products
    });

  } catch (error) {

    console.error("Search Products Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

exports.filterByPriceController = async (req, res) => {
  try {

    const { min_price, max_price } = req.body;

    const products = await productService.filterByPrice({
      min_price,
      max_price
    });

    res.status(200).json({
      success: true,
      message: "Products filtered successfully",
      data: products
    });

  } catch (error) {
    console.error("Price Filter Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter products"
    });
  }
};
exports.filterByBrandController = async (req, res) => {
  try {

    const { type, brand_ids } = req.body;

    // If type = allbrand → fetch all brands
    if (type === "allbrand") {

      const brands = await productService.filterByBrand({ type });

      return res.status(200).json({
        success: true,
        message: "All brands fetched successfully",
        data: brands
      });

    }

    // Otherwise filter by brand_ids
    if (!brand_ids || brand_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Brand IDs are required"
      });
    }

    const products = await productService.filterByBrand({ brand_ids });

    res.status(200).json({
      success: true,
      message: "Products filtered by brand",
      data: products
    });

  } catch (error) {
    console.error("Brand Filter Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to filter products"
    });
  }
};

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

exports.filterByCategoryController = async (req, res) => {
  try {

    const { type, category_ids } = req.body;

    // Fetch all products
    if (type === "allcategory") {

      const products = await productService.filterByCategory({ type });

      return res.status(200).json({
        success: true,
        message: "All products fetched successfully",
        data: products
      });

    }

    // Filter by category
    if (!category_ids || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category IDs are required"
      });
    }

    const products = await productService.filterByCategory({ category_ids });

    res.status(200).json({
      success: true,
      message: "Products filtered by category",
      data: products
    });

  } catch (error) {

    console.error("Category Filter Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to filter products"
    });

  }
};

exports.getAllProductsController = async (req, res) => {
  try {

    const { type, page = 1 } = req.body;

    if (type !== "displayProducts") {
      return res.status(400).json({
        success: false,
        message: "Invalid request type"
      });
    }

    const result = await productService.getProducts(page);

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