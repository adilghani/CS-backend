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
    await _models.default.userModel.create({ ...body,
      address: body.address.toLowerCase()
    });
    res.status(200).json("Successfully registered");
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
      throw new Error("Already Exist name");
    }

    await _models.default.collectionModel.create({
      name: body.name,
      owner: body.owner?.toLowerCase(),
      nftAddress: body.nftAddress?.toLowerCase(),
      avatar: body.avatar,
      background: body.background,
      description: body.description,
      externalUrl: body.externalUrl,
      tokens: body.tokens || []
    });
    res.status(200).json("Successfully created!");
  } catch (error) {
    console.log("[collection post] error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
}).put(async (req, res) => {
  try {
    const {
      body
    } = req;
    console.log("aj : **** body => ", body);
    const existingOne = await _models.default.collectionModel.findOne({
      _id: body._id
    });

    if (!existingOne) {
      throw new Error("No exist id");
    }

    let data = {
      name: body.name?.toLowerCase()
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
    const existingOne = await _models.default.collectionModel.findOneAndDelete({
      _id: body._id
    });
    return res.status(200).json("Successfully deleted");
  } catch (error) {
    console.log("[collection delete] error => ", error);
  }
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
    const owner = req.query.owner?.toLowerCase();
    const collections = await _models.default.collectionModel.find({
      owner
    }).lean().exec();
    console.log("aj : ***** collections => ", collections);
    res.status(200).json(collections);
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
      const tokens = collection.tokens ? [...collection.tokens, body.token] : [body.token];
      await _models.default.collectionModel.updateOne({
        name: body.name
      }, {
        tokens
      });
      res.status(200).json("success");
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
      tokenAddr,
      tokenId
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
      tokenAddr: body.tokenAddr,
      tokenId: body.tokenId
    });
    console.log({
      obj
    });

    if (obj) {
      // update
      //VIEWS ARE NOT EQUAL ? THEN CHECK IF ADDRESS IS PRESENT IN ARRAY
      if (parseInt(body.views) !== parseInt(obj.views) && parseInt(body.views) !== 0 || parseInt(body.views) === parseInt(obj.views) && parseInt(body.views) !== 0) {
        if (obj.viewedAddresses?.includes(body.address)) {
          throw new Error("Already viewed");
        } else {
          await _models.default.viewAndLikeModel.findOneAndUpdate({
            tokenAddr: body.tokenAddr,
            tokenId: body.tokenId
          }, {
            viewedAddresses: [...obj.viewedAddresses, body.address]
          }, {
            new: true
          });
        }
      }

      if (parseInt(body.likes) !== parseInt(obj.likes) && parseInt(body.likes) !== 0 || parseInt(body.likes) === parseInt(obj.likes) && parseInt(body.likes) !== 0) {
        if (obj.likedAccounts?.includes(body.address)) {
          throw new Error("Already Liked");
        } //else if
        else {
          await _models.default.viewAndLikeModel.findOneAndUpdate({
            tokenAddr: body.tokenAddr,
            tokenId: body.tokenId
          }, {
            likedAccounts: [...obj.likedAccounts, body.address]
          }, {
            new: true
          });
        }
      } // if (parseInt(body.views) === parseInt(obj.views)) {
      //   if (obj.viewedAddresses?.includes(body.address)) {
      //     throw new Error("Already viewed");
      //   } else {
      //     await models.viewAndLikeModel.updateOne(
      //       { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //       { viewedAddresses: [...obj.viewedAddresses, body.address] }
      //     );
      //   }
      // }
      //LIKE
      // if (parseInt(body.likes) !== parseInt(obj.likes)) {
      //   if (obj.viewedAddresses?.includes(body.address)) {
      //     throw new Error("Already viewed");
      //   } else {
      //     await models.viewAndLikeModel.updateOne(
      //       { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //       { viewedAddresses: [...obj.viewedAddresses, body.address] }
      //     );
      //   }
      // }
      // if (parseInt(body.likes) === parseInt(obj.likes)) {
      //   if (obj.viewedAddresses?.includes(body.address)) {
      //     throw new Error("Already viewed");
      //   } else {
      //     await models.viewAndLikeModel.updateOne(
      //       { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //       { viewedAddresses: [...obj.viewedAddresses, body.address] }
      //     );
      //   }
      // }
      //BODY VIEWS < DB VIEWS ? 1 < 2 ? THEN CHECK THE ARRAY AND FILTER IT
      // if (parseInt(body.views) < parseInt(obj.views)) {
      //   console.log("BEFORE :" + obj.viewedAddresses);
      //   const addresses =
      //     obj.viewedAddresses?.filter(
      //       (v) => v !== body.address?.toLowerCase()
      //     ) !== []
      //       ? [...obj.viewedAddresses, body.address?.toLowerCase()]
      //       : [];
      // }
      // else if (
      //   parseInt(body.views) === parseInt(obj.views) ||
      //   parseInt(body.views) === 0
      // ) {
      //   const addresses =
      //     obj.viewedAddresses?.filter(
      //       (v) => v !== body.address?.toLowerCase()
      //     ) === []
      //       ? [...obj.viewedAddresses]
      //       : [];
      //   console.log("I AM VIEW ADDRESS === or 0" + addresses);
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { viewedAddresses: addresses }
      //   );
      // } else {
      //   const addresses = [
      //     ...obj.viewedAddresses,
      //     body.address?.toLowerCase(),
      //   ];
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { viewedAddresses: addresses }
      //   );
      // }
      // if (parseInt(body.likes) > parseInt(obj.likes)) {
      //   console.log("LIKES");
      //   if (obj.likedAccounts?.includes(body.address)) {
      //     console.log("LIKE INCLUDED");
      //     throw new Error("Already liked");
      //   } else {
      //     console.log("LIKE NOT INCLUDED");
      //   }
      // }
      // if (parseInt(body.views) < parseInt(obj.views)) {
      //   const addresses =
      //     obj.viewedAddresses?.filter(
      //       (v) => v !== body.address?.toLowerCase()
      //     ) === []
      //       ? [...obj.viewedAddresses]
      //       : [];
      //   console.log({ addresses });
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { viewedAddresses: addresses }
      //   );
      // } else if (
      //   parseInt(body.views) === parseInt(obj.views) ||
      //   parseInt(body.views) === 0
      // ) {
      //   const addresses =
      //     obj.viewedAddresses?.filter(
      //       (v) => v !== body.address?.toLowerCase()
      //     ) === []
      //       ? [...obj.viewedAddresses]
      //       : [];
      //   console.log("I AM VIEW ADDRESS === or 0" + addresses);
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { viewedAddresses: addresses }
      //   );
      // } else {
      //   const addresses = [
      //     ...obj.viewedAddresses,
      //     body.address?.toLowerCase(),
      //   ];
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { viewedAddresses: addresses }
      //   );
      // }
      // if (parseInt(body.likes) < parseInt(obj.likes)) {
      //   console.log("I AM LESS");
      //   const addresses =
      //     obj.likedAccounts?.filter(
      //       (v) => v !== body.address?.toLowerCase()
      //     ) || [];
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { likedAccounts: addresses }
      //   );
      // } else if (
      //   parseInt(body.likes) === parseInt(obj.likes) ||
      //   parseInt(body.likes) === 0
      // ) {
      //   const addresses = obj.likedAccounts?.filter(
      //     (v) => v !== body.address?.toLowerCase()
      //   );
      //   console.log({ addresses });
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { likedAccounts: addresses }
      //   );
      // } else {
      //   console.log("I AM + 1");
      //   const addresses = [...obj.likedAccounts, body.address?.toLowerCase()];
      //   await models.viewAndLikeModel.updateOne(
      //     { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
      //     { likedAccounts: addresses }
      //   );
      // }


      const newUpdatedInfo = await _models.default.viewAndLikeModel.findOneAndUpdate({
        tokenAddr: body.tokenAddr?.toLowerCase(),
        tokenId: body.tokenId
      }, {
        views: obj.views + body.views,
        likes: obj.likes + body.likes
      }, {
        new: true
      });
      res.status(200).json(newUpdatedInfo);
    } else {
      await _models.default.viewAndLikeModel.create({
        tokenAddr: body.tokenAddr?.toLowerCase(),
        tokenId: body.tokenId,
        views: body.views > 0 ? 1 : 0,
        likes: body.likes > 0 ? 1 : 0,
        viewedAddresses: body.views > 0 ? [body.address?.toLowerCase()] : [],
        likedAccounts: body.likes > 0 ? [body.address?.toLowerCase()] : []
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
  }).catch(err => console.log(err));
});
routes.post("/usersviews_and_userslikes", (req, res) => {
  let likedNft = [];

  var like = _models.default.viewAndLikeModel.find({
    likedAccounts: req.body.userAddress
  });

  like.exec((err, data) => {
    data.forEach(function (token) {
      let nftdata = _models.default.nftControllerModel.findOne({
        tokenId: token.tokenId
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
        tokenId: token.tokenId
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
  console.log(req.body.userAddress);

  var user = _models.default.userModel.findOne({
    address: req.body.userAddress
  });

  user.exec((err, data) => {
    if (err) throw err;
    console.log(data);

    if (data !== undefined && data !== null) {
      data.follower.map(function (address) {
        let userdata = _models.default.userModel.findOne({
          address: address
        });

        userdata.exec((err, fdata) => {
          if (err) throw err;
          followers.push(fdata);
        });
      });
      setTimeout(() => res.status(200).json({
        followers
      }), 3000);
    } else {
      res.status(400).json({
        msg: "No Data"
      });
    }
  });
});
routes.post("/get-following", (req, res) => {
  let followerings = [];

  var user = _models.default.userModel.findOne({
    address: req.body.userAddress
  });

  user.exec((err, data) => {
    if (err) throw err;

    if (data) {
      data.following.map(function (address) {
        let userdata = _models.default.userModel.findOne({
          address: address
        });

        userdata.exec((err, fdata) => {
          if (err) throw err;
          followerings.push(fdata);
        });
      });
      setTimeout(() => res.status(200).json({
        followerings
      }), 3000);
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
  }).catch(err => console.log(err));
});
routes.get("/nft-collector", (req, res) => {
  var nftdata = _models.default.nftControllerModel.find();

  nftdata.exec().then(data => {
    res.status(200).json(data);
  }).catch(err => console.log(err));
});
routes.post("/nft-collector", (req, res) => {
  let filterData = _models.default.nftControllerModel.findOne({
    tokenId: req.body.tokenId
  });

  filterData.exec((err, data) => {
    if (err) throw err;

    if (data !== undefined) {
      let updateNft = _models.default.nftControllerModel.findOneAndUpdate({
        tokenId: req.body.tokenId
      }, {
        price: req.body.price
      });

      updateNft.exec(err => {
        if (err) throw err;
        res.status(200).json({
          message: "Success"
        });
      });
    } else {
      let createNft = new _models.default.nftControllerModel({
        tokenAddr: req.body.tokenAddr,
        tokenId: req.body.tokenId,
        price: req.body.price,
        metadata: {
          imageUrl: req.body.metadata.imageUrl,
          name: req.body.metadata.name,
          description: req.body.metadata.description,
          externalLink: req.body.metadata.externalLink
        },
        selectedCat: req.body.selectedCat,
        tokenUri: req.body.tokenUri,
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
routes.get("/count-nft", (req, res) => {
  _models.default.nftControllerModel.countDocuments({}, function (err, count) {
    res.status(202).json(count);
  });
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
              console.log(`File uploaded successfully at ${data.Location}`);
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
          console.log(`File uploaded successfully at ${data.Location}`);
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
    console.log(name); // const resp = await models.userModel.find({
    //   username: "OneDabLife ",
    // });

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
    } // const obj = await models.viewAndLikeModel
    //   .findOne({ tokenAddr, tokenId })
    //   .lean()
    //   .exec();

  } catch (error) {
    console.log("Search Error => ", error);
    res.status(500).json({
      message: error.toString()
    });
  }
});
module.exports = routes;
//# sourceMappingURL=index.js.map