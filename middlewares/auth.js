// middlewares/auth.js
module.exports = {
  // ✅ Login check
  ensureAuthenticated(req, res, next) {
    const loggedIn = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : !!req.user;
    if (loggedIn) return next();

    req.flash('error_msg', 'Please log in to view this resource');
    return res.redirect('/login');
  },

  // ✅ Admin only
  isAdmin(req, res, next) {
    const loggedIn = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : !!req.user;
    if (loggedIn && req.user && req.user.role === 'admin') return next();

    req.flash('error_msg', 'Access denied: Admins only');
    return res.redirect('/login');
  },

  // ✅ Customer only
  isCustomer(req, res, next) {
    const loggedIn = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : !!req.user;
    if (loggedIn && req.user && req.user.role === 'customer') return next();

    req.flash('error_msg', 'Access denied: Customers only');
    return res.redirect('/login');
  }
};
