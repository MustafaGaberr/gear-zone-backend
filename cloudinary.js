// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config(); 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//  (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce-app', //  Cloudinary Dashboard
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], 
    // transformation: [{ width: 800, height: 600, crop: 'limit' }] // (optional) Resize images
  },
});

const upload = multer({ storage: storage });

module.exports = upload;