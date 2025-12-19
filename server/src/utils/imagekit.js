// server/src/utils/imagekit.js
const ImageKit = require("imagekit");
// Ensure .env is loaded (especially if this utility is used in isolation)
require('dotenv').config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINTS
});

module.exports = imagekit;