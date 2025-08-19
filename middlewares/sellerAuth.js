// middlewares/sellerAuth.js
module.exports = (req, res, next) => {
  const seller = req.session && req.session.seller ? req.session.seller : null;

  // Not logged in as seller
  if (!seller) {
    return res.redirect('/seller-login');
  }

  // Blocked seller
  if (seller.isBlocked) {
    return res
      .status(403)
      .send('Your seller account has been blocked. Contact admin support.');
  }

  // Not approved
  if (seller.status !== 'Approved') {
    return res.redirect('/seller-login');
  }

  return next();
};
