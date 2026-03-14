const brandService = require("../services/brand.service")

exports.brandController = async (req, res) => {

  try {

    const { type, page = 1, limit = 5 } = req.body;

    if (!type || type === "displayAllBrands") {

      const result = await brandService.getAllBrands(page, limit);

      return res.status(200).json({
        success: true,
        message: "Brands fetched successfully",
        data: result.brands,
        total: result.total,
        page: page,
        limit: limit
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid type"
    });

  } catch (error) {

    console.error("Fetch Brands Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.addBrandController = async (req, res) => {

  try {

    const { brand_name, category_ids } = req.body

    if (!brand_name || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "brand_name and category_ids are required"
      })
    }

    const result = await brandService.addBrand(brand_name, category_ids)

    return res.status(201).json({
      success: true,
      message: "Brand added successfully",
      brand_id: result.brand_id
    })

  } catch (error) {

    console.error("Add Brand Error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}
exports.updateBrandController = async (req, res) => {
  try {

    const { brand_id, brand_name, status } = req.body;

    if (!brand_id || !brand_name || !status) {
      return res.status(400).json({
        success: false,
        message: "brand_id, brand_name and status are required"
      });
    }

    const result = await brandService.updateBrand(brand_id, brand_name, status);

    if (result.alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Brand name already exists"
      });
    }

    return res.status(200).json({
      success: true,
      message: status === 2 
        ? "Brand updated and set to inactive"
        : "Brand updated successfully",
      data: result.data
    });

  } catch (error) {

    console.error("Update Brand Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.deleteBrandController = async (req, res) => {

  try {

    const { brand_id, category_id } = req.body

    if (!brand_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: "brand_id and category_id are required"
      })
    }

    const result = await brandService.deleteBrand(brand_id, category_id)

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Brand-category mapping not found"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Category removed from brand successfully"
    })

  } catch (error) {

    console.error("Delete Brand Category Error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}