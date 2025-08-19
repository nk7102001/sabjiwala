// models/orderModel.js
const mongoose = require('mongoose');

// ------------------ Order Item Schema -------------------
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    // Which seller supplied this product
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    // Snapshot of product name at order time
    name: {
      type: String,
      required: true,
      trim: true
    },
    // Price per unit at the time of order
    price: {
      type: Number,
      required: true,
      min: 0
    },
    // Ordered quantity
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    // qty * price, stored for convenience
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

// ------------------ Main Order Schema -------------------
const orderSchema = new mongoose.Schema(
  {
    // If registered user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },

    // If guest checkout
    guestInfo: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true }
    },

    // Array of purchased items
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0
    },

    // Full address snapshot
    shippingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true }
    },

    // Order Financial Summary
    total: { type: Number, required: true, min: 0 }, // grand total
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded'],
      default: 'Unpaid'
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Razorpay', 'Stripe', 'PayPal'],
      default: 'COD'
    },

    // ✅ Razorpay order ID for tracking & webhook verification
    razorpayOrderId: { type: String },

    // Order lifecycle status (business + delivery)
    status: {
      type: String,
      enum: [
        'Pending',     // order placed
        'Processing',  // vendor packing
        'Assigned',    // delivery guy assigned
        'Accepted',    // delivery guy accepted
        'Picked Up',   // picked up from vendor
        'Delivered',   // delivered to customer
        'Cancelled'    // cancelled
      ],
      default: 'Pending'
    },

    // Tracking info if shipped
    trackingNumber: { type: String },
    courierService: { type: String },

    // 🚀 DeliveryGuy assignment field
    deliveryGuy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryGuy'
    }
  },
  {
    timestamps: true // automatically adds createdAt & updatedAt
  }
);

// Indexes for common queries and analytics
orderSchema.index({ 'items.vendor': 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 }); // ✅ easy lookup in webhook
orderSchema.index({ deliveryGuy: 1 }); // 🚀 delivery guy analytics

module.exports = mongoose.model('Order', orderSchema);
