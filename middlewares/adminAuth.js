// middlewares/adminAuth.js
module.exports = function (req, res, next) {
  // Check if user is logged in (guard if req.isAuthenticated not present)
  const loggedIn = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : !!req.user;
  if (!loggedIn) {
    req.flash('error_msg', 'Please log in as admin to view this page');
    return res.redirect('/login'); // same login page for admin & users
  }

  // Check if role is admin
  if (!req.user || req.user.role !== 'admin') {
    req.flash('error_msg', 'Access denied: Admins only');
    return res.redirect('/'); // normal user goes home
  }

  // If logged in and admin
  return next();
};
