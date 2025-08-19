// routes/paymentWebhook.js
const express = require("express");
const crypto = require("crypto");
const Order = require("../models/orderModel");

const router = express.Router();

// Razorpay webhook endpoint
router.post("/razorpay-webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      // If secret is missing, refuse to process (security)
      console.error("Razorpay webhook secret not configured");
      return res.status(500).send("Server misconfiguration");
    }

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      console.log("❌ Webhook signature verification failed");
      return res.status(400).send("Invalid signature");
    }

    console.log("✅ Webhook verified successfully");

    const event = req.body.event;

    if (event === "payment.captured") {
      const paymentEntity = req.body?.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id;

      if (razorpayOrderId) {
        // Payment successful → find order in DB (ensure you save razorpayOrderId on order at creation)
        // Optional: add idempotency via a processedEvents collection or check payment id in order to avoid double updates
        const order = await Order.findOneAndUpdate(
          { razorpayOrderId },
          { paymentStatus: "Paid", status: "Pending" },
          { new: true }
        );
        console.log("💰 Payment captured for Order:", order?._id || "(not found)");
      } else {
        console.warn("payment.captured payload missing order_id");
      }
    }

    if (event === "payment.failed") {
      const paymentEntity = req.body?.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id;
      // Optional: update failed status if you track it
      // await Order.findOneAndUpdate({ razorpayOrderId }, { paymentStatus: "Failed", status: "Failed" });
      console.log("❌ Payment failed for order:", razorpayOrderId || "(unknown)");
    }

    // Always return 200 OK after processing verified webhook
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Return 200 to avoid repeated retries if internal error is non-recoverable; adjust per your retry strategy
    return res.status(200).json({ status: "received" });
  }
});

module.exports = router;
