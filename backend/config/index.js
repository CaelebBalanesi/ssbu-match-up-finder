// config/index.js
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || "iaouvhweaiouvhw",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://161.35.59.101:2222",
};
