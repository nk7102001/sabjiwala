if (process.env.NODE_ENV !== 'production') {
require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const passport = require('./auth/passport');
const MongoStore = require('connect-mongo');

const app = express();

// --- MongoDB Connection with robust error handling ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');

    // Start server only after DB connection is successful
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// --- Express Configurations ---
app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Session Middleware (only once) ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7 // 7 days
  }),
  cookie: {
    maxAge: 1000*60*60*24*7, // 7 days
    secure: true,            // Render HTTPS pe hai
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// --- Passport Middlewares ---
app.use(passport.initialize());
app.use(passport.session());

// --- Flash Middleware ---
app.use(flash());

// --- Global locals for all views (flash, user, currentPath) ---
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');    // Passport errors
  res.locals.user = req.user || null;       // Currently logged in user
  res.locals.currentPath = req.path;        // For active link highlighting
  next();
});

/**
 * ✅ Provide sabjiCategories to ALL views so partials/navbar.ejs never crashes.
 * - Replace the default list with a DB fetch when you add a Category model.
 */
const defaultSabjiCategories = [
  { name: 'Vegetables', slug: 'vegetables' },
  { name: 'Fruits', slug: 'fruits' },
  { name: 'Leafy Greens', slug: 'leafy-greens' },
];
app.use(async (req, res, next) => {
  try {
    // Example with DB (uncomment and replace when you have a model):
    // const Category = require('./models/Category');
    // const cats = await Category.find({ isActive: true }).select('name slug').lean();

    const cats = defaultSabjiCategories;
    res.locals.sabjiCategories = Array.isArray(cats) ? cats : [];
  } catch (e) {
    res.locals.sabjiCategories = [];
  }
  next();
});

// --- Import Routes ---
const userRoutes = require('./routes/userRoutes');
const googleAuthRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
// Remove this: const sabjiCategories = require('./models/sabjiCategories'); // Not needed as a variable anymore
const orderRoutes = require('./routes/orderRoutes');
const { ensureAuthenticated } = require('./middlewares/auth');
const couponRoutes = require('./routes/couponRoutes');
const helpRoutes = require('./routes/helpRoutes');
const addressRoutes = require('./routes/addressRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const sellerRoutes = require('./routes/sellerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerAuthRoutes = require('./routes/sellerAuthRoutes');
const sellerProductRoutes = require('./routes/sellerProductRoutes');
const sellerDashboardRoutes = require('./routes/sellerDashboardRoutes');
const adminOrdersRoutes = require('./routes/adminOrdersRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminReportsRoutes = require('./routes/adminReportsRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const paymentWebhook = require('./routes/paymentWebhook');
const deliveryRoutes = require('./routes/deliveryRoutes');

// --- Use Routes ---
app.use('/', userRoutes);            // Signup, Login, etc.
app.use('/', googleAuthRoutes);      // Google OAuth routes
app.use('/', productRoutes);         // Product/sabji routes
app.use('/orders', orderRoutes);     // Protected order routes
app.use('/', couponRoutes);
app.use('/', helpRoutes);
app.use('/', addressRoutes);
app.use('/', vendorRoutes);
app.use('/', reviewRoutes);
app.use('/', sellerRoutes);
app.use('/', adminRoutes);
app.use('/', sellerAuthRoutes);
app.use('/', sellerProductRoutes);
app.use('/', sellerDashboardRoutes);
app.use('/', adminOrdersRoutes);
app.use('/', adminUserRoutes);
app.use('/', adminReportsRoutes);
app.use('/', cartRoutes);
app.use('/', checkoutRoutes);
app.use('/', paymentWebhook);
app.use('/', deliveryRoutes);

// --- Require Vendor model for homepage vendors ---
const Seller = require('./models/sellerModel');

// ✅ Homepage will now send vendors list with avgRating (from embedded products)
app.get('/', async (req, res) => {
  try {
    const sellers = await Seller.aggregate([
      { $match: { status: 'Approved', isBlocked: false } },
      {
        $addFields: {
          avgRating: { $avg: '$products.rating' }
        }
      },
      {
        $project: {
          shopName: 1,
          name: 1,          // Optional: vendor owner name
          shopPhoto: 1,     // If you have photo field
          avgRating: 1
        }
      }
    ]);
    res.render('index', { sellers });
  } catch (err) {
    console.error('❌ Error fetching vendors for homepage:', err);
    res.render('index', { sellers: [] });
  }
});

/**
 * Categories page
 * - Now uses res.locals.sabjiCategories (set by middleware) so no ReferenceError.
 * - You don't need to import a variable named sabjiCategories at top.
 */
app.get('/categories', (req, res) => {
  res.render('categories'); // sabjiCategories available via res.locals
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.post('/contact', (req, res) => {
  req.flash('success_msg', 'Thank you for contacting us. We will get back to you soon!');
  res.redirect('/contact');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/privacy', (req, res) => {
  res.render('privacy');
});

app.get('/cart', (req, res) => {
  res.render('cart');
});

app.get('/become-delivery', (req, res) => {
  res.redirect('/delivery/signup');
});
