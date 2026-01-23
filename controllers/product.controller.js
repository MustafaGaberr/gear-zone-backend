const Product = require("../models/product.model.js");
const Notification = require("../models/notification.model.js");
const { getIO } = require('../Utilities/socket');


const createProduct = async (req, res) => {
  try {
    const sellerId = req.user.id; 
    console.log("Seller ID:", sellerId);

    if (!sellerId) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized. Please login first."
      });
    }

    let imagesPaths = [];
    if (req.files && req.files.length > 0) {
      imagesPaths = req.files.map(file => file.path);
    } else {
      return res.status(400).json({ status: "error", message: "At least one image is required" });
    }

    console.log("Images paths:", imagesPaths);
    const imageCover = imagesPaths[0]; 

    const product = await Product.create({
      ...req.body,       
      images: imagesPaths, 
      imageCover: imageCover, 
      seller: sellerId   
    });

    // 4. Notification & Socket) 
    const notification = await Notification.create({
      message: `New product pending approval: ${product.name} by Seller ${req.user.name || "Unknown"}`,
      type: "product_new",
      link: `/admin/products/${product._id}`,
      isRead: false,
      // recipient: 'admin'
    });

    getIO().to("admins").emit("notification", notification);

    res.status(201).json({
      message: "Product created successfully",
      status: "success",
      code: 201,
      data: product, 
    });

  } catch (err) {
    console.error("Create Error:", err); 
    res.status(400).json({ error: err.message, status: "error", code: 400, data: null });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'keyword'];
    excludedFields.forEach(el => delete queryObj[el]);

    if (req.query.keyword) {
      queryObj.name = { $regex: req.query.keyword, $options: "i" };
    }

    // 3. Pagination Setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalDocs = await Product.countDocuments(queryObj);

    // 5. Execute Query
    const products = await Product.find(queryObj)
      .select("-__v")
      .populate({ path: "seller", select: "name email" }) 
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // 6. Response
    res.status(200).json({
      status: "success",
      code: 200,
      message: "Products retrieved successfully",
      data: products,
      pagination: {
        page,
        limit,
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
      }
    });

  } catch (err) {
    res.status(400).json({ status: "error", code: 400, message: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
  const product = await Product.findById(id)
      .select("-__v")   
      .populate("seller", "name email profileImage"); 

    if (!product) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Product not found",
        data: null,
      });
    }
    res.status(200).json({
      message: "Product retrieved successfully",
      status: "success",
      code: 200,
      data: {
        id:product._id,
        name:product.name,
        description:product.description,
        price:product.price,
        stock:product.stock,
        category:product.category,
        images:product.images,
        seller:product.seller,
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message, status: "error", code: 400, data: null });
  }
};

const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { name, description, price, stock, category, images } = req.body;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, seller: req.user._id }, 
      { 
        name, description, price, stock, category, images 
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Product not found or you are not authorized to update it",
        data: null,
      });
    }

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Product updated successfully",
      data: updatedProduct, 
    });

  } catch (error) {
    res.status(400).json({ status: "error", code: 400, message: error.message, data: null });
  }
};

const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    if (req.user.role !== 'admin') {
      query.seller = req.user._id;
    }

    const product = await Product.findOneAndDelete(query);

    if (!product) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Product not found or you are not authorized to delete it",
        data: null,
      });
    }

    // (Cleanup):
    // المفروض هنا نمسح الصور من Cloudinary أو السيرفر عشان نوفر مساحة
    // if (product.images && product.images.length > 0) {
    //    await deleteImagesFromCloud(product.images); 
    // }

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Product deleted successfully",
      data: null, // في الحذف الـ Standard بنرجع null
    });

  } catch (error) {
    res.status(400).json({ status: "error", code: 400, message: error.message, data: null });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
