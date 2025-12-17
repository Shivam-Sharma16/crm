var ImageKit = require("imagekit");
const { default: mongoose } = require("mongoose");

var imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINTS,
});

function fileupload(file) {
  return new Promise((res, rej) => {
    imagekit.upload(
      {
        folder:"songs",
        file: file.buffer,
        fileName: new mongoose.Types.ObjectId().toString(),
      },
      (error, result) => {
        if (error) {
          rej(error);
        } else res(result);
      }
    );
  });
}

module.exports=fileupload
