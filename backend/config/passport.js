// config/passport.js
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const config = require("../config");
const User = require("../models/User"); // Import the updated User model

// Serialize only the user ID to the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize the user by fetching from the database
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ id });
    if (user) {
      done(null, user);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (err) {
    done(err, null);
  }
});

// Configure the Discord strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: config.DISCORD_CLIENT_ID,
      clientSecret: config.DISCORD_CLIENT_SECRET,
      callbackURL: `${config.DISCORD_REDIRECT_URI}`,
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists in the database
        let user = await User.findOne({ id: profile.id });

        if (!user) {
          // If not, create a new user
          user = new User({
            id: profile.id,
            username: profile.username,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            email: profile.email,
            mfa_enabled: profile.mfa_enabled ? 1 : 0,
          });
          await user.save();
        } else {
          // Optionally update user data if necessary
          user.username = profile.username;
          user.discriminator = profile.discriminator;
          user.avatar = profile.avatar;
          user.email = profile.email;
          user.mfa_enabled = profile.mfa_enabled ? 1 : 0;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;
