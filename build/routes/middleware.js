"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userAuth = userAuth;

var CryptoJS = require("crypto-js");

const secretKey = "secretKey=m@_y-se!cre0t-clo_se@ds2ea@123"; // var ciphertext = CryptoJS.AES.encrypt('closedSeaAPI', secretKey).toString();
// console.log(ciphertext)

function userAuth(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Authorization");
  console.log(JSON.stringify(req.header));
  var authApiKey = req.header('api-key');

  if (authApiKey) {
    let bytes;
    bytes = CryptoJS.AES.decrypt(authApiKey, secretKey);
    let decryptedData = bytes.toString(CryptoJS.enc.Utf8); // console.log(decryptedData)

    if (decryptedData == "closedSeaAPI" || decryptedData == '"closedSeaAPI"') {
      next();
    } else {
      res.status(400).json({
        message: "You are not authorized person"
      });
    }
  } else {
    res.status(400).json({
      message: "You are not authorized person"
    });
  }
}

;
//# sourceMappingURL=middleware.js.map