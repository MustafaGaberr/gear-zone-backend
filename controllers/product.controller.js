const Product = require("../models/product.model.js");
const Notification = require("../models/notification.model.js");
const { getIO } = require('../Utilities/socket');

// Helper function to create error with status
const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};


const createProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id; 
    console.log("Seller ID:", sellerId);

    if (!sellerId) {
      return next(createError("Unauthorized. Please login first.", 401));
    }

    let imagesPaths = [];
    if (req.files && req.files.length > 0) {
      imagesPaths = req.files.map(file => file.path);
    } else {
      return next(createError("At least one image is required", 400));
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
    next(err);
  }
};

const getAllProducts = async (req, res, next) => {
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
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
  const product = await Product.findById(id)
      .select("-__v")   
      .populate("seller", "name email profileImage"); 

    if (!product) {
      return next(createError("Product not found", 404));
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
    next(error);
  }
};

const updateProductById = async (req, res, next) => {
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
      return next(createError("Product not found or you are not authorized to update it", 404));
    }

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Product updated successfully",
      data: updatedProduct, 
    });

  } catch (error) {
    next(error);
  }
};

const deleteProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    if (req.user.role !== 'admin') {
      query.seller = req.user._id;
    }

    const product = await Product.findOneAndDelete(query);

    if (!product) {
      return next(createError("Product not found or you are not authorized to delete it", 404));
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
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
