// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');

/**
 * GET /products
 * Show all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return res.render('products/all-products', { products });
  } catch (err) {
    console.error('Error fetching products list:', err);
    return res.status(500).send('Error fetching products list');
  }
};

/**
 * POST /seller/add-product
 * Add a new product by vendor
 */
exports.addProduct = async (req, res) => {
  try {
    const seller = req.session?.seller;
    if (!seller) {
      return res.redirect('/seller-login');
    }

    const sellerId = seller._id && mongoose.Types.ObjectId.isValid(seller._id)
      ? new mongoose.Types.ObjectId(seller._id)
      : null;

    if (!sellerId) {
      return res.redirect('/seller-login');
    }

    // Step 1: Save the product in Product collection
    const pricePerKg = parseFloat(req.body.pricePerKg);
    const availableQty = parseFloat(req.body.availableQty);

    const newProduct = new Product({
      seller: sellerId,
      name: req.body.name,
      category: req.body.category,
      pricePerKg: isNaN(pricePerKg) ? 0 : pricePerKg,
      availableQty: isNaN(availableQty) ? 0 : availableQty,
      description: req.body.description || '',
      imageUrl: req.file ? '/uploads/products/' + req.file.filename : '',
      inStock: !isNaN(availableQty) && availableQty > 0
    });

    await newProduct.save();

    // Step 2: Add reference in Seller's products array
    // IMPORTANT: push actual values, not schema definition
    await Seller.findByIdAndUpdate(
      sellerId,
      {
        $push: {
          products: {
            product: newProduct._id,
            price: newProduct.pricePerKg,
            availableQty: newProduct.availableQty,
            // rating can be omitted or defaulted if your schema defines it
          }
        }
      }
    );

    // Step 3: Redirect to My Products (kept your intended path; adjust if your route is /seller/products)
    return res.redirect('/seller/my-products');
  } catch (err) {
    console.error('Error adding product:', err);
    return res.status(500).send('Error adding product');
  }
};

/**
 * GET /products/create-sample
 * Create sample product for testing
 */
exports.createSampleProduct = async (req, res) => {
  try {
    const testSeller = await Seller.findOne();
    if (!testSeller) {
      return res.status(400).send('⚠ No seller found in database to assign sample product');
    }

    const sample = new Product({
      seller: testSeller._id,
      name: 'Sample Tomato',
      category: 'Vegetables',
      pricePerKg: 45,
      availableQty: 10,
      description: 'Fresh red tomatoes from farm',
      imageUrl: '/uploads/products/sample.jpg',
      inStock: true
    });
    await sample.save();

    // Also push in seller's products array
    await Seller.findByIdAndUpdate(
      testSeller._id,
      {
        $push: {
          products: {
            product: sample._id,
            price: 45,
            availableQty: 10
          }
        }
      }
    );

    return res.send(`✅ Sample product created for seller: ${testSeller.name}`);
  } catch (err) {
    console.error('Error creating sample product:', err);
    return res.status(500).send('Error creating sample product');
  }
};

/**
 * GET /products/:slug
 * Show vendors for a specific sabji/product
 */
exports.listVendorsForSabji = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Fetch vendors with either nested products.product or direct ObjectId array
    const vendors = await Seller.find(
      {
        $or: [
          { 'products.product': product._id },
          { products: product._id }
        ]
      },
      { name: 1, shopName: 1, phone: 1, address: 1, city: 1, products: 1 }
    ).lean();

    const vendorList = vendors.map((vendor) => {
      const productsArray = Array.isArray(vendor.products) ? vendor.products : [];
      // handle both shapes: {product: ObjectId, price,...} OR direct ObjectId
      const prodDetailsObj = productsArray.find(
        (p) =>
          (p && p.product && p.product.toString && p.product.toString() === product._id.toString()) ||
          (p && p.toString && p.toString() === product._id.toString())
      );

      const price = prodDetailsObj && typeof prodDetailsObj === 'object' ? prodDetailsObj.price : 0;
      const availableQty = prodDetailsObj && typeof prodDetailsObj === 'object' ? prodDetailsObj.availableQty : 0;
      const rating = prodDetailsObj && typeof prodDetailsObj === 'object'
        ? (prodDetailsObj.rating || 'New')
        : 'New';

      return {
        _id: vendor._id,
        name: vendor.name,
        shopName: vendor.shopName,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        products: [
          {
            product: product._id,
            price: price || 0,
            availableQty: availableQty || 0,
            rating
          }
        ]
      };
    });

    return res.render('products/vendor-list', {
      product,
      vendors: vendorList
    });
  } catch (err) {
    console.error('Server error loading vendor list:', err);
    return res.status(500).send('Server error loading vendor list');
  }
};
