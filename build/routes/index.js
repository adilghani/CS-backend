"use strict";

var _models = _interopRequireDefault(require("../models"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const routes = require("express").Router();

const jwt = require("jsonwebtoken");

const multer = require("multer");

var cookieParser = require('cookie-parser');

const path = require("path");

const bodyParser = require("body-parser");

var uuid = require('uuid');

const fs = require('fs');

const AWS = require('aws-sdk');

routes.use(cookieParser()); // Body Parsers

routes.use(bodyParser.urlencoded({
  extended: false
}));
routes.use(bodyParser.json());
const s3 = new AWS.S3({
  accessKeyId: "AKIASAFVMRRSMD5RISOV",
  secretAccessKey: "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"
});
routes.get("/", (req, res) => {
  res.status(200).json({
    message: "Connected!"
  });
});
routes.route("/profile").post(async (req, res) => {
  try {
    const {
      body
    } = req;
    let check = await _models.default.userModel.findOne({
      address: body.address.toLowerCase()
    }).exec();

    if (check == null || check == undefined) {
      res.status(200).json({
        message: "This wallet address is already exist"
      });
    } else {
      await _models.default.userModel.create({ ...body,
        address: body.address.toLowerCase()
      });
      res.status(200).json("Successfully registered");
    }
  } catch (error) {
    console.log("[profile post] error => ", error);
    res.status(500).json({
      message: "Server Error"
    });
  }
}).put(async (req, res) => {
  try {
    const {
      body
    } = req;
    const userFromDB = await _models.default.userModel.findOne({
      address: body.address.toLowerCase()
    });

    if (userFromDB) {
      await _models.default.userModel.updateOne({
        address: body.address.toLowerCase()
      }, { ...body,
        address: body.address.toLowerCase()
      }, {
        runValidators: true
      });
      res.status(200).json("Successfully updated");
    } else {
      res.status(500).json({
        message: "User not registered yet."
      });
    }
  } catch (error) {
    console.log("[profile post] error => ", error);
    res.status(500).json({
      message: "Server Error"
    });
  }
}).get(async (req, res) => {
  const address = req.query.address;
  const user = await _models.default.userModel.findOne({
    address: address.toLowerCase()
  }).lean().exec();
  res.status(200).json({ ...user
  });
});
routes.post("/verified_user", (req, res) => {
  let VerifiedCollection = _models.default.userModel.findOneAndUpdate({
    address: req.body.address
  }, {
    isVerified: req.body.isverified
  });

  VerifiedCollection.exec(err => {
    if (err) throw err;
    res.status(200).json({
      message: "Successfully Verified"
    });
  });
});
routes.get("/get-all-users", (req, res) => {
  let user = _models.default.userModel.find();

  user.exec((err, data) => {
    res.status(200).json({
      data
    });
  });
});
routes.route("/collection").post(async (req, res) => {
  try {
    const {
      body
    } = req;
    const existingOne = await _models.default.collectionModel.findOne({
      name: body.name
    });

    if (existingOne) {
      let tokenUpdate = _models.default.collectionModel.findOneAndUpdate({
        name: body.name
      }, {
        $push: {
          'tokens': parseInt(body.tokens)
        }
      });

      tokenUpdate.exec(err => {
        if (err) throw err;
        res.send("Successfully token Added!");
      });
    } else {
      var _body$owner, _body$nftAddress;

      await _models.default.collectionModel.create({
        name: body.name,
        owner: (_body$owner = body.owner) === null || _body$owner === void 0 ? void 0 : _body$owner.toLowerCase(),
        nftAddress: (_body$nftAddress = body.nftAddress) === null || _body$nftAddress === void 0 ? void 0 : _body$nftAddress.toLowerCase(),
        avatar: body.avatar,
        background: body.background,
        description: body.description,
        externalUrl: body.externalUrl,
        tokens: parseInt(body.tokens) || []
      });
      res.status(200).json("Successfully created!");
    }
  } catch (error) {
    console.log("[collection post] error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
}).put(async (req, res) => {
  try {
    var _body$name;

    const {
      body
    } = req;
    const existingOne = await _models.default.collectionModel.findOne({
      _id: body._id
    });

    if (!existingOne) {
      throw new Error("No exist id");
    }

    let data = {
      name: (_body$name = body.name) === null || _body$name === void 0 ? void 0 : _body$name.toLowerCase()
    };

    if (!!body.avatar) {
      data = { ...data,
        avatar: body.avatar
      };
    }

    if (!!body.background) {
      data = { ...data,
        background: body.background
      };
    }

    if (!!body.description) {
      data = { ...data,
        description: body.description
      };
    }

    if (!!body.externalUrl) {
      data = { ...data,
        externalUrl: body.externalUrl
      };
    }

    if (!!body.tokens) {
      data = { ...data,
        tokens: body.tokens
      };
    }

    await _models.default.collectionModel.updateOne({
      _id: body._id
    }, data);
    res.status(200).json("Successfully updated!");
  } catch (error) {
    console.log("[collection put] error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
}).get(async (req, res) => {
  try {
    const name = req.query.name;
    const collection = await _models.default.collectionModel.findOne({
      name
    }).lean().exec();
    res.status(200).json({ ...collection
    });
  } catch (error) {
    console.log("[collection get] error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
}).delete(async (req, res) => {
  try {
    const {
      body
    } = req;
    await _models.default.collectionModel.findOneAndDelete({
      _id: body._id
    });
    return res.status(200).json("Successfully deleted");
  } catch (error) {
    console.log("[collection delete] error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
});
const featureCollectionPath = path.join(__dirname, "../", "../public/featureCollectionImage/"); // for file upload

var Storage = multer.diskStorage({
  destination: featureCollectionPath,
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname));
  }
});
var uploadcoll = multer({
  storage: Storage
}).single('pic');
routes.post("/feature_collection", uploadcoll, (req, res) => {
  if (req.file == undefined) {
    res.status(400).json({
      message: "Image is Required"
    });
  } else if (req.body.link == undefined) {
    res.status(400).json({
      message: "Link is Required"
    });
  } else {
    fs.readFile(req.file.path, (err, data) => {
      if (err) throw err;
      const params = {
        Bucket: 'closedsea',
        // pass your bucket name
        Key: req.file.filename,
        // file will be saved as testBucket/contacts.csv
        ACL: "public-read",
        ContentType: req.file.mimetype,
        Body: data
      };
      s3.upload(params, function (err, data) {
        if (err) throw err;

        let filterFeatureCollection = _models.default.uploadfeaturemodel.findOneAndUpdate({
          collection_name: req.body.collection
        }, {
          link: req.body.link,
          imageUrl: data.Location
        });

        filterFeatureCollection.exec(err => {
          if (err) throw err;
          res.status(200).json({
            message: "Success"
          });
        });
      });
    });
  }
});
routes.get("/feature_collection", async (req, res) => {
  _models.default.uploadfeaturemodel.find((err, data) => {
    if (err) throw err;
    res.status(200).json({
      data
    });
  });
});
routes.post("/verified_collection", (req, res) => {
  let VerifiedCollection = _models.default.collectionModel.findOneAndUpdate({
    name: req.body.collection_name
  }, {
    isVerified: req.body.isverified
  });

  VerifiedCollection.exec(err => {
    if (err) throw err;
    res.status(200).json({
      message: "Successfully Verified"
    });
  });
});
const profilefilePath = path.join(__dirname, "../", "../public/commonimage/"); // for file upload

var Storage = multer.diskStorage({
  destination: profilefilePath,
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname));
  }
});
var uploadImage = multer({
  storage: Storage
}).single('file');
routes.post("/upload_file_to_s3", uploadImage, (req, res) => {
  if (req.file == undefined) {
    res.status("400").json({
      message: "Image is Required"
    });
  } else {
    fs.readFile(req.file.path, (err, data) => {
      if (err) throw err;
      const params = {
        Bucket: 'closedsea',
        // pass your bucket name
        Key: req.body.fname,
        // file will be saved
        ACL: "public-read",
        ContentType: req.file.mimetype,
        Body: data
      };
      s3.upload(params, function (s3Err, data) {
        if (s3Err) throw s3Err;
        res.status(200).json(data);
      });
    });
  }
});
routes.get("/collection-names", async (req, res) => {
  try {
    const collections = await _models.default.collectionModel.find({}).select("name -_id").exec();
    res.status(200).json(collections);
  } catch (error) {
    console.log("[collection names] get error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
});
routes.get("/my-collections", async (req, res) => {
  try {
    var _req$query$owner;

    const owner = (_req$query$owner = req.query.owner) === null || _req$query$owner === void 0 ? void 0 : _req$query$owner.toLowerCase();
    const token = req.query.token;

    if (owner && token) {
      const collections = await _models.default.collectionModel.find({
        $and: [{
          owner: owner
        }, {
          tokens: parseInt(token)
        }]
      }).lean().exec();
      res.status(200).json(collections);
    } else if (owner) {
      const collections = await _models.default.collectionModel.find({
        owner
      }).lean().exec();
      res.status(200).json(collections);
    } else {
      res.status(400).json({
        message: "Required value not found"
      });
    }
  } catch (error) {
    console.log("[collection names] get error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
});
routes.put("/insert-token-to-collection", async (req, res) => {
  try {
    const {
      body
    } = req;
    const collection = await _models.default.collectionModel.find({
      name: body.name
    }).lean().exec();

    if (collection) {
      let tokenUpdate = _models.default.collectionModel.findOneAndUpdate({
        name: body.name
      }, {
        $push: {
          'tokens': parseInt(body.token)
        }
      });

      tokenUpdate.exec(err => {
        if (err) throw err;
        res.status(200).json({
          message: "Successfully token Added!"
        });
      });
    } else {
      res.status(200).json({
        message: "Document not found!"
      });
    }
  } catch (error) {
    console.log("[collection names] get error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
});
routes.route("/view-and-like").get(async (req, res) => {
  try {
    const {
      tokenAddr,
      tokenId
    } = req.query;
    const obj = await _models.default.viewAndLikeModel.findOne({
      tokenAddr: {
        '$regex': '^' + req.query.tokenAddr + '$',
        "$options": "i"
      },
      tokenId: req.query.tokenId
    }).lean().exec();

    if (obj) {
      res.status(200).json({ ...obj
      });
    } else {
      res.status(200).json({
        views: 0,
        likes: 0,
        tokenAddr,
        tokenId,
        likedAccounts: [],
        viewedAddresses: []
      });
    }
  } catch (error) {
    console.log("[view and like] get error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
}).post(async (req, res) => {
  try {
    const {
      body
    } = req;
    console.log({
      body
    });
    const obj = await _models.default.viewAndLikeModel.findOne({
      tokenAddr: {
        '$regex': '^' + body.tokenAddr + '$',
        "$options": "i"
      },
      tokenId: body.tokenId
    });
    console.log({
      obj
    });

    if (obj) {
      // update
      //VIEWS ARE NOT EQUAL ? THEN CHECK IF ADDRESS IS PRESENT IN ARRAY
      if (parseInt(body.views) !== parseInt(obj.views) && parseInt(body.views) !== 0 || parseInt(body.views) === parseInt(obj.views) && parseInt(body.views) !== 0) {
        var _obj$viewedAddresses;

        if ((_obj$viewedAddresses = obj.viewedAddresses) !== null && _obj$viewedAddresses !== void 0 && _obj$viewedAddresses.includes(body.address)) {
          throw new Error("Already viewed");
        } else {
          await _models.default.viewAndLikeModel.findOneAndUpdate({
            tokenAddr: {
              '$regex': '^' + body.tokenAddr + '$',
              "$options": "i"
            },
            tokenId: body.tokenId
          }, {
            viewedAddresses: [...obj.viewedAddresses, body.address]
          }, {
            new: true
          });
        }
      }

      if (parseInt(body.likes) !== parseInt(obj.likes) && parseInt(body.likes) !== 0 || parseInt(body.likes) === parseInt(obj.likes) && parseInt(body.likes) !== 0) {
        var _obj$likedAccounts;

        if ((_obj$likedAccounts = obj.likedAccounts) !== null && _obj$likedAccounts !== void 0 && _obj$likedAccounts.includes(body.address)) {
          throw new Error("Already Liked");
        } //else if
        else {
          await _models.default.viewAndLikeModel.findOneAndUpdate({
            tokenAddr: {
              '$regex': '^' + body.tokenAddr + '$',
              "$options": "i"
            },
            tokenId: body.tokenId
          }, {
            likedAccounts: [...obj.likedAccounts, body.address]
          }, {
            new: true
          });
        }
      }

      const newUpdatedInfo = await _models.default.viewAndLikeModel.findOneAndUpdate({
        tokenAddr: {
          '$regex': '^' + body.tokenAddr + '$',
          "$options": "i"
        },
        tokenId: body.tokenId
      }, {
        views: obj.views + body.views,
        likes: obj.likes + body.likes
      }, {
        new: true
      });
      res.status(200).json(newUpdatedInfo);
    } else {
      var _body$address, _body$address2;

      await _models.default.viewAndLikeModel.create({
        tokenAddr: {
          '$regex': '^' + body.tokenAddr + '$',
          "$options": "i"
        },
        tokenId: body.tokenId,
        views: body.views > 0 ? 1 : 0,
        likes: body.likes > 0 ? 1 : 0,
        viewedAddresses: body.views > 0 ? [(_body$address = body.address) === null || _body$address === void 0 ? void 0 : _body$address.toLowerCase()] : [],
        likedAccounts: body.likes > 0 ? [(_body$address2 = body.address) === null || _body$address2 === void 0 ? void 0 : _body$address2.toLowerCase()] : []
      });
    }
  } catch (error) {
    console.log("[view and like] post error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
});
routes.get("/views_and_likes", (req, res) => {
  var viewAndLike = _models.default.viewAndLikeModel.find();

  viewAndLike.exec().then(data => {
    res.send(data);
  }).catch(err => res.status(500).json({
    message: error.toString()
  }));
});
routes.post("/usersviews_and_userslikes", (req, res) => {
  let likedNft = [];

  var like = _models.default.viewAndLikeModel.find({
    likedAccounts: req.body.userAddress
  });

  like.exec((err, data) => {
    data.forEach(function (token) {
      let nftdata = _models.default.nftControllerModel.findOne({
        tokenId: token.tokenId,
        tokenAddr: {
          '$regex': '^' + token.tokenAddr + '$',
          "$options": "i"
        }
      });

      nftdata.exec((err, nft) => {
        if (err) throw err;
        likedNft.push(nft);
      });
    });
    setTimeout(() => res.status(200).json({
      likedNft
    }), 3000);
  });
});
routes.post("/usersviews", (req, res) => {
  let viewedNft = [];

  var view = _models.default.viewAndLikeModel.find({
    viewedAddresses: req.body.userAddress
  });

  view.exec((err, data) => {
    data.forEach(function (token) {
      let nftdata = _models.default.nftControllerModel.findOne({
        tokenId: token.tokenId,
        tokenAddr: {
          '$regex': '^' + token.tokenAddr + '$',
          "$options": "i"
        }
      });

      nftdata.exec((err, nft) => {
        if (err) throw err;
        viewedNft.push(nft);
      });
    });
    setTimeout(() => res.status(200).json({
      viewedNft
    }), 3000);
  });
});
routes.post("/users_follow", (req, res) => {
  let follower = _models.default.userModel.findOneAndUpdate({
    address: req.body.follower
  }, {
    $push: {
      'follower': req.body.following
    }
  });

  follower.exec(err => {
    if (err) throw err;

    let following = _models.default.userModel.findOneAndUpdate({
      address: req.body.following
    }, {
      $push: {
        'following': req.body.follower
      }
    });

    following.exec(err => {
      if (err) throw err;
      res.send("success");
    });
  });
});
routes.post("/get-followers", (req, res) => {
  let followers = [];

  var user = _models.default.userModel.findOne({
    address: req.body.userAddress
  });

  user.exec((err, data) => {
    if (err) throw err;

    if (data !== undefined && data !== null) {
      if (data.follower[0] !== undefined && data.follower[0] !== null) {
        data.follower.map(function (address) {
          let userdata = _models.default.userModel.findOne({
            address: address
          });

          userdata.exec((err, fdata) => {
            if (err) throw err;

            if (fdata !== undefined && fdata !== null) {
              followers.push(fdata);
            }
          });
        });
        setTimeout(() => res.status(200).json({
          followers
        }), 3000);
      } else {
        res.status(400).json({
          msg: "No followers"
        });
      }
    } else {
      res.status(400).json({
        msg: "No Data"
      });
    }
  });
});
routes.post("/get-following", (req, res) => {
  let followings = [];

  var user = _models.default.userModel.findOne({
    address: req.body.userAddress
  });

  user.exec((err, data) => {
    if (err) throw err;

    if (data !== undefined && data !== null) {
      if (data.following[0] !== undefined && data.following[0] !== null) {
        data.following.map(function (address) {
          let userdata = _models.default.userModel.findOne({
            address: address
          });

          userdata.exec((err, fdata) => {
            if (err) throw err;

            if (fdata !== undefined && fdata !== null) {
              followings.push(fdata);
            }
          });
        });
        setTimeout(() => res.status(200).json({
          followings
        }), 3000);
      } else {
        res.status(400).json({
          msg: "No followings"
        });
      }
    } else {
      res.status(400).json({
        msg: "No Data"
      });
    }
  });
});
routes.post("/admin-register", (req, res) => {
  if (req.body.account) {
    let createAdmin = new _models.default.adminRegisterModel({
      walletAddress: req.body.account
    });
    createAdmin.save(function () {
      res.send("Admin Stored Succcesfully");
    });
  } else {
    res.status.send("address are empty");
  }
});
routes.post("/admin-login", (req, res) => {
  let adminData = _models.default.adminRegisterModel.findOne({
    walletAddress: req.body.account
  });

  adminData.exec().then(data => {
    if (data) {
      const token = jwt.sign({
        walletAddress: req.body.account
      }, "walletaddress12345678123456781234");
      res.cookie('closedSeaAdmin', token, {
        expires: new Date(Date.now() + 6000000)
      });
      res.status(200).send("Sucessfull Login");
    } else {
      res.status(400).send("Wallet Not Found");
    }
  }).catch(err => res.status(500).json({
    message: error.toString()
  }));
});
routes.get("/nft-collector", (req, res) => {
  var nftdata = _models.default.nftControllerModel.find();

  nftdata.exec().then(data => {
    res.status(200).json(data);
  }).catch(err => res.status(500).json({
    message: error.toString()
  }));
});
routes.post("/nft-collector", (req, res) => {
  let filterData = _models.default.nftControllerModel.findOne({
    tokenId: req.body.tokenId,
    tokenAddr: {
      '$regex': '^' + req.body.tokenAddr + '$',
      "$options": "i"
    }
  });

  filterData.exec((err, data) => {
    if (err) throw err;

    if (data !== null) {
      let updateNft = _models.default.nftControllerModel.findOneAndUpdate({
        tokenId: req.body.tokenId,
        tokenAddr: {
          '$regex': '^' + req.body.tokenAddr + '$',
          "$options": "i"
        }
      }, {
        price: req.body.price,
        owner: req.body.ownerOf,
        selectedCat: req.body.selectedCat,
        isOnSell: req.body.isOnSell
      });

      updateNft.exec(err => {
        if (err) throw err;
        res.status(200).json({
          message: "Updated Success"
        });
      });
    } else {
      let createNft = new _models.default.nftControllerModel({
        tokenAddr: req.body.tokenAddr,
        tokenId: req.body.tokenId,
        price: req.body.price,
        owner: req.body.ownerOf,
        metadata: req.body.metadata,
        selectedCat: req.body.selectedCat,
        tokenUri: req.body.tokenUri,
        chainId: req.body.chainId,
        relatedCollectionId: req.body.relatedCollectionId,
        status: "pending"
      });
      createNft.save(function () {
        res.status(200).json({
          message: "Success"
        });
      });
    }
  });
});
routes.post("/external-nft", (req, res) => {
  try {
    let query;

    if (parseInt(req.body.chainId) == 56 || String(req.body.chainId) == "0x38") {
      query = {
        owner: req.body.owner,
        chainId: {
          decimal: 56,
          hexa: "0x38"
        },
        $and: [{
          tokenAddr: {
            $ne: "0xB2D4C7AfFa1B01fa33C82A8aC63075BD366df4b0"
          }
        }, {
          tokenAddr: {
            $ne: "0x5b31d474dcadc1c2a1dfc7d4562b2268b0feea43"
          }
        }, {
          tokenAddr: {
            $ne: "0xA84ABA462A3dc12A5874c8D0D61d757256C905a5"
          }
        }, {
          tokenAddr: {
            $ne: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"
          }
        }, {
          tokenAddr: {
            $ne: "0x69903cd9dBBEC1bcaB81E1ffe003260e9e487Ca4"
          }
        }, {
          tokenAddr: {
            $ne: "0xe9e7cea3dedca5984780bafc599bd69add087d56"
          }
        }]
      };
    } else if (parseInt(req.body.chainId) == 97 || String(req.body.chainId) == "0x61") {
      query = {
        owner: req.body.owner,
        chainId: {
          decimal: 97,
          hexa: "0x61"
        },
        $and: [{
          tokenAddr: {
            $ne: "0x69536bdf4B18499181EB386B0E4019a28C4Fb096"
          }
        }, {
          tokenAddr: {
            $ne: "0xA4fb840986B10aC44aA893793cfe755c81c3740D"
          }
        }, {
          tokenAddr: {
            $ne: "0xBec98ca675EE0099E7eaF0d626a38abAE42Ef24D"
          }
        }, {
          tokenAddr: {
            $ne: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"
          }
        }, {
          tokenAddr: {
            $ne: "0x51c19275686d84c1553f3edd2945dba6ec0c7de4"
          }
        }, {
          tokenAddr: {
            $ne: "0x8301f2213c0eed49a7e28ae4c3e91722919b8b47"
          }
        }]
      };
    } else if (parseInt(req.body.chainId) == 4 || String(req.body.chainId) == "0x4") {
      query = {
        owner: req.body.owner,
        chainId: {
          decimal: 4,
          hexa: "0x4"
        },
        $and: [{
          tokenAddr: {
            $ne: "0xDB753bacDFb788c4d70CEc237F898db21017B11d"
          }
        }, {
          tokenAddr: {
            $ne: "0x848655Ccc2E571cA9470954BF08C4Eab3436830B"
          }
        }, {
          tokenAddr: {
            $ne: "0x8A36a5395CAa70da6545f030BFB659Fc8e820A59"
          }
        }]
      };
    } else if (parseInt(req.body.chainId) == 1 || String(req.body.chainId) == "0x1") {
      query = {
        owner: req.body.owner,
        chainId: {
          decimal: 1,
          hexa: "0x1"
        }
      };
    } else if (parseInt(req.body.chainId) == 137 || String(req.body.chainId) == "0x89") {
      query = {
        owner: req.body.owner,
        chainId: {
          decimal: 137,
          hexa: "0x89"
        }
      };
    } else if (parseInt(req.body.chainId) == 80001 || String(req.body.chainId) == "0x13881") {
      query = {
        owner: req.body.owner,
        chainId: {
          decimal: 80001,
          hexa: "0x13881"
        }
      };
    }

    let externalNft = _models.default.nftControllerModel.find(query);

    externalNft.exec((err, data) => {
      if (err) throw err;
      res.status(200).json(data);
    });
  } catch (err) {
    console.error(err);
  }
});
routes.post("/insert-multiple-nft", async (req, res) => {
  try {
    if (req.body.nfts.length < 1) {
      res.status(400).json({
        message: "NFT array not defined"
      });
    } else {
      let nfts = req.body.nfts;
      let i = 0;
      storeNFT(0);

      async function storeNFT(i) {
        let check = await _models.default.nftControllerModel.findOne({
          tokenId: nfts[i].tokenId,
          tokenAddr: {
            '$regex': '^' + nfts[i].tokenAddr + '$',
            "$options": "i"
          }
        }).exec();

        if (check == null) {
          await new _models.default.nftControllerModel({
            tokenAddr: nfts[i].tokenAddr,
            tokenId: nfts[i].tokenId,
            price: nfts[i].price,
            owner: nfts[i].ownerOf,
            metadata: nfts[i].metadata,
            selectedCat: nfts[i].selectedCat,
            tokenUri: nfts[i].tokenUri,
            chainId: nfts[i].chainId,
            relatedCollectionId: nfts[i].relatedCollectionId,
            status: "pending"
          }).save();
        }

        if (i == nfts.length - 1) {
          res.status(200).json({
            message: "Successfully stored"
          });
        } else {
          i++;
          await storeNFT(i);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
});
routes.post("/search-nft", (req, res) => {
  if (req.body.name !== undefined && req.body.name !== null && req.body.name !== false) {
    let limitedNft = _models.default.nftControllerModel.find({
      "metadata.name": {
        $regex: '.*' + req.body.name + ".*",
        $options: 'i'
      }
    }).skip((req.body.page - 1) * req.body.size).limit(req.body.size);

    _models.default.nftControllerModel.countDocuments({
      "metadata.name": {
        $regex: '.*' + req.body.name + ".*",
        $options: 'i'
      }
    }, function (err, count) {
      let totalPage = Math.ceil(count / req.body.size);
      limitedNft.exec((err, data) => {
        if (err) throw err;

        if (data[0] !== undefined && data[0] !== null) {
          res.status(202).json({
            nft: data,
            totalPage: totalPage
          });
        } else {
          res.status(500).json({
            message: "No NFT found"
          });
        }
      });
    });
  } else {
    res.status(500).json({
      message: "Data is not defined"
    });
  }
});
routes.post("/update-nft-status", (req, res) => {
  let filterData = _models.default.nftControllerModel.findOne({
    tokenId: req.body.tokenId,
    tokenAddr: {
      '$regex': '^' + req.body.tokenAddr + '$',
      "$options": "i"
    }
  });

  filterData.exec((err, data) => {
    if (err) throw err;

    if (data !== undefined && data !== null) {
      let updateNft = _models.default.nftControllerModel.findOneAndUpdate({
        tokenId: req.body.tokenId,
        tokenAddr: {
          '$regex': '^' + req.body.tokenAddr + '$',
          "$options": "i"
        }
      }, {
        status: req.body.status
      });

      updateNft.exec(err => {
        if (err) throw err;
        res.status(200).json({
          message: "Status Updated Successfully"
        });
      });
    } else {
      res.status(400).json({
        message: "Nft not found"
      });
    }
  });
});
routes.post("/most-liked-nft", async (req, res) => {
  let filterData = await _models.default.nftControllerModel.aggregate([{
    $match: {
      isOnSell: true,
      status: "active"
    }
  }, {
    $lookup: {
      from: "viewandlikes",
      // collection to join
      let: {
        tokenAddr: "$tokenAddr",
        tokenId: "$tokenId"
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ["$tokenAddr", "$$tokenAddr"]
            }, {
              $eq: ["$tokenId", "$$tokenId"]
            }]
          }
        }
      }],
      as: "likes" // output array field

    }
  }, {
    $unwind: "$likes"
  }, {
    $addFields: {
      "likes": "$likes.likes"
    }
  }, {
    "$sort": {
      "likes": -1
    }
  }, {
    $facet: {
      data: [{
        $skip: (req.body.page - 1) * req.body.size
      }, {
        $limit: req.body.size
      }],
      Total: [{
        $group: {
          _id: null,
          count: {
            $sum: 1
          }
        }
      }]
    }
  }]).exec();
  let count = filterData[0].Total[0].count;
  let totalPage = Math.ceil(count / req.body.size);
  res.status(200).json({
    mostLikedNft: filterData[0].data,
    totalPage: totalPage
  });
});
routes.post("/least-liked-nft", async (req, res) => {
  // let leastLikeNft=[]
  let filterData = await _models.default.nftControllerModel.aggregate([{
    $match: {
      isOnSell: true,
      status: "active"
    }
  }, {
    $lookup: {
      from: "viewandlikes",
      // collection to join
      let: {
        tokenAddr: "$tokenAddr",
        tokenId: "$tokenId"
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ["$tokenAddr", "$$tokenAddr"]
            }, {
              $eq: ["$tokenId", "$$tokenId"]
            }]
          }
        }
      }],
      as: "likes" // output array field

    }
  }, {
    $unwind: "$likes"
  }, {
    $addFields: {
      "likes": "$likes.likes"
    }
  }, {
    "$sort": {
      "likes": 1
    }
  }, {
    $facet: {
      data: [{
        $skip: (req.body.page - 1) * req.body.size
      }, {
        $limit: req.body.size
      }],
      Total: [{
        $group: {
          _id: null,
          count: {
            $sum: 1
          }
        }
      }]
    }
  }]).exec();
  let count = filterData[0].Total[0].count;
  let totalPage = Math.ceil(count / req.body.size);
  res.status(200).json({
    leastLikedNft: filterData[0].data,
    totalPage: totalPage
  });
});
routes.post("/price-range-nft", (req, res) => {
  let filterData = _models.default.nftControllerModel.find({
    isOnSell: true,
    status: "active",
    price: {
      $gt: req.body.startPrice,
      $lt: req.body.endPrice
    }
  }).skip((req.body.page - 1) * req.body.size).limit(req.body.size);

  _models.default.nftControllerModel.countDocuments({
    isOnSell: true,
    status: "active",
    price: {
      $gt: req.body.startPrice,
      $lt: req.body.endPrice
    }
  }, function (err, count) {
    let totalPage = Math.ceil(count / req.body.size);
    filterData.exec(async (err, data) => {
      if (err) throw err;

      if (data[0] == undefined || data[0] == null) {
        res.status(200).json({
          message: "No NFT found in this Price range",
          totalPage: totalPage,
          errs: true
        });
      } else {
        res.status(200).json({
          nft: data,
          totalPage: totalPage
        });
      }
    });
  });
});
routes.get("/oldest-nft", (req, res) => {
  let filterData = _models.default.nftControllerModel.find({
    isOnSell: true,
    status: "active"
  }).limit(1).sort({
    $natural: 1
  });

  filterData.exec(async (err, data) => {
    if (err) throw err;

    if (data[0] == undefined || data[0] == null) {
      res.status(200).json({
        message: "No NFT found",
        errs: true
      });
    } else {
      res.status(200).json({
        nft: data
      });
    }
  });
});
routes.get("/newest-nft", (req, res) => {
  let filterData = _models.default.nftControllerModel.find({
    isOnSell: true,
    status: "active"
  }).limit(1).sort({
    $natural: -1
  });

  filterData.exec(async (err, data) => {
    if (err) throw err;

    if (data[0] == undefined || data[0] == null) {
      res.status(200).json({
        message: "No NFT found",
        errs: true
      });
    } else {
      res.status(200).json({
        nft: data
      });
    }
  });
});
routes.get("/count-nft", (req, res) => {
  _models.default.nftControllerModel.countDocuments({}, function (err, count) {
    res.status(202).json(count);
  });
});
routes.post("/nft-pagination", (req, res) => {
  let limitedNft = _models.default.nftControllerModel.find({}).skip((req.body.page - 1) * req.body.size).limit(req.body.size);

  _models.default.nftControllerModel.countDocuments({}, function (err, count) {
    let totalPage = Math.ceil(count / req.body.size);
    limitedNft.exec((err, data) => {
      if (err) throw err;

      if (data[0] !== undefined && data[0] !== null) {
        res.status(202).json({
          nft: data,
          totalPage: totalPage
        });
      }
    });
  });
});
routes.get("/feature-nft", (req, res) => {
  var nftdata = _models.default.nftControllerModel.find({
    featured: true
  });

  nftdata.exec().then(data => {
    if (data[0] !== undefined && data[0] !== null) {
      res.status(200).json(data);
    } else {
      res.status(400).json({
        message: "No any Nft is featured"
      });
    }
  }).catch(err => res.status(500).json({
    message: error.toString()
  }));
});
routes.post("/feature-nft", (req, res) => {
  _models.default.nftControllerModel.countDocuments({
    featured: true
  }, function (err, documents) {
    if (documents == 10 && req.body.isFeatured == true) {
      res.status(202).json({
        message: "Feature nft limit exceed"
      });
    } else if (documents == 3 && req.body.isFeatured == false) {
      res.status(202).json({
        message: "Minimum 3 should be featured"
      });
    } else {
      let filterData = _models.default.nftControllerModel.findOne({
        tokenId: req.body.tokenId,
        tokenAddr: {
          '$regex': '^' + req.body.tokenAddr + '$',
          "$options": "i"
        }
      });

      filterData.exec((err, data) => {
        if (err) throw err;

        if (data !== undefined && data !== null) {
          if (data.status == "active") {
            let updateNft = _models.default.nftControllerModel.findOneAndUpdate({
              tokenId: req.body.tokenId,
              tokenAddr: {
                '$regex': '^' + req.body.tokenAddr + '$',
                "$options": "i"
              }
            }, {
              featured: req.body.isFeatured
            });

            updateNft.exec(err => {
              if (err) throw err;
              res.status(200).json({
                message: "Nft Updated Successfully"
              });
            });
          } else {
            res.status(400).json({
              message: "Nft not activated"
            });
          }
        } else {
          res.status(400).json({
            message: "Nft not found"
          });
        }
      });
    }
  });
});
routes.post("/count-nft-category-vise", (req, res) => {
  if (req.body.category == undefined && req.body.category == null && req.body.category == false) {
    res.status(500).json({
      message: "Data is not defined"
    });
  } else if (req.body.category == "All NFTs") {
    _models.default.nftControllerModel.countDocuments({}, function (err, count) {
      res.status(202).json(count);
    });
  } else {
    _models.default.nftControllerModel.countDocuments({
      selectedCat: req.body.category
    }, function (err, count) {
      res.status(202).json(count);
    });
  }
});
routes.post("/nft-category-vise", (req, res) => {
  if (req.body.isMarketPlace) {
    if (req.body.category == undefined && req.body.category == null && req.body.category == false) {
      res.status(200).json({
        message: "Data is not defined"
      });
    } else if (req.body.category == "All NFTs") {
      let limitedNft = _models.default.nftControllerModel.find({
        isOnSell: true,
        status: "active"
      }).skip((req.body.page - 1) * req.body.size).limit(req.body.size);

      _models.default.nftControllerModel.countDocuments({
        isOnSell: true,
        status: "active"
      }, function (err, count) {
        let totalPage = Math.ceil(count / req.body.size);
        limitedNft.exec((err, data) => {
          if (err) throw err;

          if (data[0] !== undefined && data[0] !== null) {
            res.status(202).json({
              nft: data,
              totalPage: totalPage
            });
          } else {
            res.status(200).json({
              message: "No NFT found"
            });
          }
        });
      });
    } else {
      let limitedNft = _models.default.nftControllerModel.find({
        selectedCat: req.body.category,
        isOnSell: true,
        status: "active"
      }).skip((req.body.page - 1) * req.body.size).limit(req.body.size);

      _models.default.nftControllerModel.countDocuments({
        selectedCat: req.body.category,
        isOnSell: true,
        status: "active"
      }, function (err, count) {
        if (err) throw err;

        if (count == undefined || count == null || count == false || count == 0) {
          res.status(200).json({
            message: "No NFT found for this Category"
          });
        } else {
          let totalPage = Math.ceil(count / req.body.size);
          limitedNft.exec((err, data) => {
            if (err) throw err;

            if (data[0] !== undefined && data[0] !== null) {
              res.status(202).json({
                nft: data,
                totalPage: totalPage
              });
            } else {
              res.status(200).json({
                message: "No NFT found for this Category"
              });
            }
          });
        }
      });
    }
  } else {
    let limitedNft = _models.default.nftControllerModel.find({}).skip((req.body.page - 1) * req.body.size).limit(req.body.size);

    _models.default.nftControllerModel.countDocuments({}, function (err, count) {
      let totalPage = Math.ceil(count / req.body.size);
      limitedNft.exec((err, data) => {
        if (err) throw err;

        if (data[0] !== undefined && data[0] !== null) {
          res.status(202).json({
            nft: data,
            totalPage: totalPage
          });
        } else {
          res.status(200).json({
            message: "No NFT found"
          });
        }
      });
    });
  }
});
const filePath = path.join(__dirname, "../", "../public/sliderimage/"); // for file upload

var Storage = multer.diskStorage({
  destination: filePath,
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: Storage
}).single('pic');
routes.post("/add_slider", upload, (req, res) => {
  if (req.file == undefined) {
    res.status("400").json({
      message: "Image is Required"
    });
  } else if (req.body.link == undefined) {
    res.status("400").json({
      message: "Link is Required"
    });
  } else {
    _models.default.uploadSliderModel.countDocuments({}, function (err, documents) {
      if (documents == 10) {
        res.status(202).json({
          msg: "slider limit exceed"
        });
      } else {
        fs.readFile(req.file.path, (err, data) => {
          if (err) throw err;
          const params = {
            Bucket: 'closedsea',
            // pass your bucket name
            Key: req.file.filename,
            // file will be saved
            ACL: "public-read",
            ContentType: req.file.mimetype,
            Body: data
          };
          s3.upload(params, function (s3Err, data) {
            if (s3Err) throw s3Err;
            let uploadslider = new _models.default.uploadSliderModel({
              link: req.body.link,
              imageUrl: data.Location
            });
            uploadslider.save(err => {
              if (err) throw err;
              res.status(200).json({
                message: "Success"
              });
            });
          });
        });
      }
    });
  }
});
routes.post("/update_slider", upload, (req, res) => {
  if (req.file == undefined) {
    res.status(400).json({
      message: "Image is Required"
    });
  } else if (req.body.link == undefined) {
    res.status(400).json({
      message: "Link is Required"
    });
  } else {
    console.log(req.file);
    fs.readFile(req.file.path, (err, data) => {
      if (err) throw err;
      const params = {
        Bucket: 'closedsea',
        // pass your bucket name
        Key: req.file.filename,
        // file will be saved as testBucket/contacts.csv
        ACL: "public-read",
        ContentType: req.file.mimetype,
        Body: data
      };
      s3.upload(params, function (s3Err, data) {
        if (s3Err) throw s3Err;

        let uploadslider = _models.default.uploadSliderModel.findOneAndUpdate({
          _id: req.body.id
        }, {
          link: req.body.link,
          imageUrl: data.Location
        });

        uploadslider.exec(err => {
          if (err) throw err;
          res.status(200).json({
            message: "Success"
          });
        });
      });
    });
  }
});
routes.delete("/delete_slider/:id", upload, (req, res) => {
  let url = req.query.q.split(".com/")[1];

  var deleteSlider = _models.default.uploadSliderModel.findOneAndDelete({
    _id: req.params.id
  });

  s3.deleteObject({
    Bucket: "closedsea",
    Key: url
  }, function (err, data) {
    deleteSlider.exec(function (err) {
      if (err) throw err;
      res.status(200).json({
        message: "Successfully deleted"
      });
    });
  });
});
routes.get("/getsliders", (req, res) => {
  let filterData = _models.default.uploadSliderModel.find();

  filterData.exec(function (err, data) {
    if (err) throw err;

    if (data) {
      res.status(200).json(data);
    }
  });
});
routes.route("/search").get(async (req, res) => {
  try {
    const {
      name
    } = req.query;
    console.log(name);

    if (name) {
      const collections = await _models.default.collectionModel.find({
        name: {
          $regex: '^' + name,
          $options: 'i'
        }
      });
      const users = await _models.default.userModel.find({
        userName: {
          $regex: '^' + name,
          $options: 'i'
        }
      });
      res.status(200).json({
        message: "success",
        data: {
          collections,
          users
        }
      });
    } else {
      res.status(200).json({
        message: "success",
        data: {
          collections: "",
          users: ""
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.toString()
    });
  }
});
module.exports = routes;
//# sourceMappingURL=index.js.map