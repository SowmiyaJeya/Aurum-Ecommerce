const productService = require("../services/product.service");

exports.addProductController = async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;

    if (!name || !category || !price || !stock) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"  
      });
    }

    const product = await productService.addProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product
    });

  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};