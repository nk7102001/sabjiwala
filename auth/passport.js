const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/userModel');
const DeliveryGuy = require('../models/DeliveryGuy');

// Small helpers to safely read Google profile data
function getGoogleEmail(profile) {
  const v = Array.isArray(profile?.emails) && profile.emails[0]?.value ? profile.emails[0].value : '';
  return v ? String(v).toLowerCase() : '';
}
function getGooglePhoto(profile) {
  return Array.isArray(profile?.photos) && profile.photos[0]?.value ? profile.photos[0].value : '';
}

// === Existing User LocalStrategy ===
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const normalizedEmail = String(email || '').toLowerCase().trim();
        if (!normalizedEmail) {
          return done(null, false, { message: 'Email is required.' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return done(null, false, { message: 'No user found with that email.' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });

        return done(null, { ...user.toObject(), userType: 'user' });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// === Existing User Google Strategy ===
passport.use(
  'user-google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile?.id;
        const displayName = profile?.displayName || 'Google User';
        const email = getGoogleEmail(profile);

        let user = null;

        // Prefer finding by googleId
        if (googleId) {
          user = await User.findOne({ googleId });
        }

        // If not found by googleId, try by email to avoid duplicates, then attach googleId
        if (!user && email) {
          user = await User.findOne({ email });
          if (user && !user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
        }

        // Create new if still not found
        if (!user) {
          user = await User.create({
            name: displayName,
            email,
            googleId,
          });
        }

        return done(null, { ...user.toObject(), userType: 'user' });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// === New DeliveryGuy Google Strategy ===
passport.use(
  'delivery-google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.DELIVERY_GOOGLE_CALLBACK_URL ||
        'https://sabjiwala-x6y1.onrender.com/delivery/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile?.id;
        const displayName = profile?.displayName || 'Delivery Partner';
        const email = getGoogleEmail(profile);
        const profilePic = getGooglePhoto(profile);

        let deliveryGuy = null;

        if (googleId) {
          deliveryGuy = await DeliveryGuy.findOne({ googleId });
        }

        // Avoid duplicates by matching on email if present
        if (!deliveryGuy && email) {
          deliveryGuy = await DeliveryGuy.findOne({ email });
          if (deliveryGuy && !deliveryGuy.googleId) {
            deliveryGuy.googleId = googleId;
            if (profilePic) deliveryGuy.profilePic = deliveryGuy.profilePic || profilePic;
            await deliveryGuy.save();
          }
        }

        if (!deliveryGuy) {
          deliveryGuy = await DeliveryGuy.create({
            name: displayName,
            email,
            googleId,
            profilePic,
          });
        }

        return done(null, { ...deliveryGuy.toObject(), userType: 'delivery' });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// === Serialize and Deserialize ===
// Store minimal info plus a userType discriminator to resolve the model later
passport.serializeUser((user, done) => {
  try {
    // user may be a mongoose doc or plain object
    const id = user.id || user._id?.toString();
    const userType = user.userType || (user.email ? 'user' : 'delivery'); // fallback
    done(null, { id, userType });
  } catch (err) {
    done(err);
  }
});

passport.deserializeUser(async (obj, done) => {
  try {
    const { id, userType } = obj || {};
    if (!id) return done(null, false);

    if (userType === 'user') {
      const user = await User.findById(id);
      if (!user) return done(null, false);
      return done(null, { ...user.toObject(), userType: 'user' });
    }

    // default to delivery for any non-'user' userType
    const deliveryGuy = await DeliveryGuy.findById(id);
    if (!deliveryGuy) return done(null, false);
    return done(null, { ...deliveryGuy.toObject(), userType: 'delivery' });
  } catch (err) {
    return done(err, null);
  }
});

module.exports = passport;
