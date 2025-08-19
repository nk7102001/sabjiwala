require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');
const Seller = require('../models/sellerModel'); // ✅ Added - to assign seller to products

// Helper function to generate unique slug
async function generateUniqueSlug(name) {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function seedDummyData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await Product.deleteMany({});
    await Vendor.deleteMany({});

    // ✅ Ensure a test seller exists
    let testSeller = await Seller.findOne();
    if (!testSeller) {
      testSeller = await Seller.create({
        name: 'Seed Seller',
        email: 'seed@example.com',
        phone: '0000000000',
        shopName: 'Seed Shop',
        address: 'Seed Address',
        city: 'Delhi',
        state: 'Delhi',
        businessType: 'Local Vendor',
        password: 'hashed_password_here', // Must be bcrypt hashed if using auth
        status: 'Approved'
      });
    }

    const productData = [
      { name: 'Carrot', description: 'Fresh carrots', price: 40, category: 'Root', imageUrl: '/images/carrot.jpg' },
      { name: 'Tomato', description: 'Juicy tomatoes', price: 30, category: 'Vegetable', imageUrl: '/images/tomato.jpg' },
      { name: 'Potato', description: 'Organic potatoes', price: 20, category: 'Root', imageUrl: '/images/potato.jpg' }
    ];

    const products = [];
    for (const p of productData) {
      const slug = await generateUniqueSlug(p.name);
      // ✅ Assign seller to each product
      const newProduct = await Product.create({ ...p, slug, seller: testSeller._id });
      products.push(newProduct);
    }

    console.log('✅ Products inserted:', products.map(p => `${p.name} (${p.slug})`));

    const findProductId = (slugStart) => {
      const prod = products.find(p => p.slug.startsWith(slugStart));
      if (!prod) {
        console.warn(`⚠️ Warning: Product with slug starting '${slugStart}' not found!`);
        return null;
      }
      return prod._id;
    };

    const vendors = [
      {
        name: 'Rajesh Kumar',
        shopName: 'Rajesh Fresh Farm',
        phone: '9876543210',
        address: 'Near Market Road',
        city: 'Delhi',
        products: [
          { product: findProductId('carrot'), price: 42, availableQty: 50, rating: 4.5 },
          { product: findProductId('potato'), price: 25, availableQty: 70, rating: 4.0 }
        ].filter(p => p.product)
      },
      {
        name: 'Geeta Rani',
        shopName: 'Geeta Organic Store',
        phone: '9123456780',
        address: 'Sector 21, Market Lane',
        city: 'Delhi',
        products: [
          { product: findProductId('tomato'), price: 33, availableQty: 40, rating: 4.7 },
          { product: findProductId('carrot'), price: 40, availableQty: 20, rating: 4.6 }
        ].filter(p => p.product)
      }
    ];

    await Vendor.insertMany(vendors);
    console.log('✅ Vendors inserted successfully!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error seeding dummy data:', err);
    await mongoose.disconnect();
  }
}

seedDummyData();
