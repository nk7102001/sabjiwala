const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');

// Admin Reports
router.get('/admin/reports', adminAuth, async (req, res) => {
  try {
    // Total Sales (sum of total for Delivered orders)
    const totalSalesAgg = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, totalAmount: { $sum: '$total' } } }
    ]);
    const totalSales = (totalSalesAgg[0] && totalSalesAgg.totalAmount) || 0;

    // Top 5 Best-selling Products (by quantity) from Delivered orders
    const topProductsAgg = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQty: { $sum: '$items.qty' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // Populate product details (safe if empty)
    const topProductIds = topProductsAgg.map(p => p._id);
    const topProducts = await Product.find({ _id: { $in: topProductIds } })
      .select('name')
      .lean();

    // Merge qty with product details
    const topProductsWithQty = topProductsAgg.map(pAgg => {
      const prod = topProducts.find(p => String(p._id) === String(pAgg._id));
      return {
        _id: pAgg._id,
        name: (prod && prod.name) ? prod.name : 'Unknown',
        totalQty: pAgg.totalQty
      };
    });

    // Top 5 Sellers by Earnings (sum of items.subtotal) from Delivered orders
    const topSellersAgg = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.vendor',
          totalEarnings: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 5 }
    ]);

    // Populate seller details (safe if empty)
    const topSellerIds = topSellersAgg.map(s => s._id);
    const topSellers = await Seller.find({ _id: { $in: topSellerIds } })
      .select('shopName name')
      .lean();

    // Merge earnings with seller details
    const topSellersWithEarnings = topSellersAgg.map(sAgg => {
      const seller = topSellers.find(s => String(s._id) === String(sAgg._id));
      return {
        _id: sAgg._id,
        shopName: (seller && (seller.shopName || seller.name)) ? (seller.shopName || seller.name) : 'Unknown',
        totalEarnings: sAgg.totalEarnings
      };
    });

    // Render admin reports page
    return res.render('admin/reports', {
      totalSales,
      topProducts: topProductsWithQty,
      topSellers: topSellersWithEarnings
    });
  } catch (err) {
    console.error('Error generating reports:', err);
    return res.status(500).send('Error generating reports');
  }
});

module.exports = router;
