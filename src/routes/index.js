import models from "~/models";
const routes = require("express").Router();
const jwt=require("jsonwebtoken")
const multer = require("multer");
var cookieParser = require('cookie-parser')
const path=require("path");
const bodyParser=require("body-parser");
var uuid = require('uuid');
const fs = require('fs');
const AWS = require('aws-sdk')
const secret="1b4b2481e997ff0b8be28106f97040aa d4cb154b4a0b7e135354946c2b572110 b5d60d263e8e9596acd942a9402b23e0 e2705442w261f902b08fa9d220e3c906037 b8184ea414e848d2323838b30367703be82e c4e417215bb9dsddd4d231a8df5799d7f84 eb3e951fd15ae401513b56c684514ea3";
routes.use(cookieParser())
const apiAuth=require("./middleware")

// Body Parsers
routes.use(bodyParser.urlencoded({ extended: false }));
routes.use(bodyParser.json());

const s3 = new AWS.S3({
  accessKeyId: "AKIASAFVMRRSMD5RISOV",
  secretAccessKey: "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"
});

routes.use(apiAuth.userAuth)

async function auth(req, res, next) {
  var authHeader = req.header('authorization');
  let token,decode;
  if (!authHeader){
    res.status(500).json({message:"Token is not defined"})
  } 
  else if (authHeader.startsWith("Bearer ")){
    token = authHeader.substring(7, authHeader.length);
    jwt.verify(token, secret, async function(err, decode) {
      if (err) {
        res.status(400).json({message:"You Token is expired"})
      }
      else{
        if(decode?.walletAddress){
          var decryptedData = await models.adminRegisterModel.findOne({walletAddress:{'$regex' : '^'+decode.walletAddress+'$', "$options": "i"}}).exec();
          if(decryptedData){
            next()
          }
          else{
            res.status(400).json({message:"You are not authorized person"})
          }
        }
        else{
          res.status(400).json({message:"Your token is not valid/expired"})
        }
      }
    });
  } 
  else {
    jwt.verify(token, secret, async function(err, decode) {
      if (err) {
        res.status(400).json({message:"You Token is expired"})
      }
      else{
        if(decode?.walletAddress){
          var decryptedData = await models.adminRegisterModel.findOne({walletAddress:{'$regex' : '^'+decode.walletAddress+'$', "$options": "i"}}).exec();
          if(decryptedData){
            next()
          }
          else{
            res.status(400).json({message:"You are not authorized person"})
          }
        }
        else{
          res.status(400).json({message:"Your token is not valid/expired"})
        }
      }
    });
  }
};

routes.get("/",(req, res) => {
  res.status(200).json({ message: "ClosedSea Backend Service" });
});

routes
  .route("/profile")
  .post(async (req, res) => {
    try {
      const { body } = req;
      let check = await models.userModel.findOne({address: {'$regex' : '^'+body.address+'$', "$options": "i"}}).exec();
      console.log(check)
      if(check !== null && check !== undefined){
        res.status(200).json({ message: "This wallet address is already exist" });
      }
      else{
        await new models.userModel({
          address: body.address,
          userName: body.userName,
          description: body.description,
          avatar: body.avatar,
          background: body.background,
          twitter: body.twitter,
          facebook:body.facebook,
          instagram: body.instagram,
          isVerified:body.isVerified
        }).save();
        res.status(200).json("Successfully registered");
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong",error:error.message });
    }
  })
  .put(async (req, res) => {
    try {
      const { body } = req;
      const userFromDB = await models.userModel.findOne({
        address:{'$regex' : '^'+body.address+'$', "$options": "i"},
      });
      if (userFromDB) {
        await models.userModel.findOneAndUpdate({address:{'$regex' : '^'+body.address+'$', "$options": "i"}},{ ...body},
          { runValidators: true }
        );
        res.status(200).json("Successfully updated");
      } else {
        res.status(500).json({ message: "User not registered yet." });
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .get(async (req, res) => {
    try{
      const address = req.query.address;
      const user = await models.userModel.findOne({address:{'$regex' : '^'+address+'$', "$options": "i"}}).lean().exec();
      res.status(200).json({ ...user });
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  });

routes.post("/verified_user",(req,res)=>{
    try{ 
      if(!req.body.address || req.body.isverified == undefined){
        res.status(500).json({message:"Parameters are wrong"})
      }
      else{
        let VerifiedCollection= models.userModel.findOneAndUpdate({address:{'$regex' : '^'+req.body.address+'$', "$options": "i"}},{
          isVerified: req.body.isverified
        })
        VerifiedCollection.exec((err)=>{
          if(err) throw err;
          res.status(200).json({message:"Successfully Verified"})
        })
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  
routes.post("/auction_user",(req,res)=>{
    try{ 
      if(!req.body.address || req.body.auction == undefined){
        res.status(500).json({message:"Parameters are wrong"})
      }
      else{
        let auctionUser= models.userModel.findOneAndUpdate({address:{'$regex' : '^'+req.body.address+'$', "$options": "i"}},{
          auction:req.body.auction
        })
        auctionUser.exec((err)=>{
          if(err) throw err;
          res.status(200).json({message:"Success"})
        })
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })

routes.post("/search_user",(req,res)=>{
    try{ 
        let User= models.userModel.find({$or:[{address:{'$regex' : '^'+req.body.user+'$', "$options": "i"}},{userName:{'$regex' : req.body.user, "$options": "i"}}]})
        User.exec((err,data)=>{
          if(err) throw err;
          res.status(200).json(data)
        })
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })

routes.get("/get-all-users", (req, res) => {
  try{
    let user = models.userModel.find();
    user.exec((err,data)=>{
      res.status(200).json({data});
    })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
});

routes
  .route("/collection")
  .post(async (req, res) => {
    try {
      const { body } = req;
      const existingOne = await models.collectionModel.findOne({
        name: body.name,
      });
      
      if (existingOne) {
        let tokenUpdate=models.collectionModel.findOneAndUpdate({name: body.name},{
          $push: {'tokens.tokenId': parseInt(body.tokens)},
          category:body.category
        })
        tokenUpdate.exec((err)=>{
          if(err) throw err;
          res.send("Successfully token Added!")
        })
      }
      else{
        await models.collectionModel.create({
          name: body.name,
          owner: body.owner?.toLowerCase(),
          nftAddress: body.nftAddress?.toLowerCase(),
          avatar: body.avatar,
          background: body.background,
          description: body.description,
          externalUrl: body.externalUrl,
          category:body.category,
          tokens: {"tokenId":parseInt(body.tokens)} || [],
        });
        res.status(200).json("Successfully created!");
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .put(async (req, res) => {
    try {
      const { body } = req;
      const existingOne = await models.collectionModel.findOne({_id: body._id,}).lean().exec();
      if (!existingOne) {
        return res.status(500).json("No exist id");
      }
      else{
        let data = {
          name: body.name
        };
        if (!!body.avatar) {
          data = { ...data, avatar: body.avatar };
        }
        if (!!body.background) {
          data = { ...data, background: body.background };
        }
        if (!!body.description) {
          data = { ...data, description: body.description };
        }
        if (!!body.externalUrl) {
          data = { ...data, externalUrl: body.externalUrl };
        }
        if (!!body.tokens) {
          data = { ...data, tokens: body.tokens };
        }
        if (!!body.category) {
          data = { ...data, category:body.category };
        }
        await models.collectionModel.updateOne({ _id: body._id }, data);
        res.status(200).json("Successfully updated!");
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .get(async (req, res) => {
    try {
      const name = req.query.name;
      const collection = await models.collectionModel
        .findOne({ name })
        .lean()
        .exec();
      res.status(200).json({ ...collection });
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .delete(async (req, res) => {
    try {
      const { body } = req;
      await models.collectionModel.findOneAndDelete({
        _id: body._id,
      });
      return res.status(200).json("Successfully deleted");
    } catch (error) {
      console.log("[collection delete] error => ", error);
      res.status(500).json({ message: error.toString() });
    }
  });


// Version 2 of Collection API
routes
  .route("/collection/v2")
  .post(async (req, res) => {
    try {
      const { body } = req;
      const existingOne = await models.collectionModel.findOne({
        name: body.name,
      });

      if (existingOne) {
        let tokenUpdate=models.collectionModel.findOneAndUpdate({name: body.name},{
          $push: {'tokens':{ $each: body.tokens}},
          category:body.category
        })
        tokenUpdate.exec((err)=>{
          if(err) throw err;
          res.send("Successfully token Added!")
        })
      }
      else{
        await models.collectionModel.create({
          name: body.name,
          owner: body.owner?.toLowerCase(),
          nftAddress: body.nftAddress?.toLowerCase(),
          avatar: body.avatar,
          background: body.background,
          description: body.description,
          externalUrl: body.externalUrl,
          category:body.category,
          tokens: body.tokens || [],
        });
        res.status(200).json("Successfully created!");
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .put(async (req, res) => {
    try {
      const { body } = req;
      const existingOne = await models.collectionModel.findOne({_id: body._id,}).lean().exec();
      if (!existingOne) {
        return res.status(500).json("No exist id");
      }
      else{
        let data = {
          name: body.name
        };
        if (!!body.avatar) {
          data = { ...data, avatar: body.avatar };
        }
        if (!!body.background) {
          data = { ...data, background: body.background };
        }
        if (!!body.description) {
          data = { ...data, description: body.description };
        }
        if (!!body.externalUrl) {
          data = { ...data, externalUrl: body.externalUrl };
        }
        if (!!body.tokens) {
          data = { ...data, tokens: body.tokens};
        }
        if (!!body.category) {
          data = { ...data, category:body.category };
        }
        await models.collectionModel.updateOne({ _id: body._id }, data);
        res.status(200).json("Successfully updated!");
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .get(async (req, res) => {
    try {
      const name = req.query.name;
      const collection = await models.collectionModel
        .findOne({ name })
        .lean()
        .exec();
      res.status(200).json({ ...collection });
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .delete(async (req, res) => {
    try {
      const { body } = req;
      await models.collectionModel.findOneAndDelete({
        _id: body._id,
      });
      return res.status(200).json("Successfully deleted");
    } catch (error) {
      console.log("[collection delete] error => ", error);
      res.status(500).json({ message: error.toString() });
    }
  });


  const featureCollectionPath = path.join(__dirname,"../","../public/featureCollectionImage/");
  // for file upload
  var Storage=multer.diskStorage({
    destination:featureCollectionPath,
    filename:(req,file,cb)=>{
      cb(null,uuid.v4()+path.extname(file.originalname))
    }
  })
  
  var uploadcoll=multer({
    storage:Storage
  }).single('pic');
   
  routes.post("/feature_collection",auth,uploadcoll,(req,res)=>{
    try {
      if(req.file == undefined){
        res.status(400).json({message:"Image is Required"})
      }
      else if(req.body.link == undefined){
        res.status(400).json({message:"Link is Required"})
      }
      else{
      fs.readFile(req.file.path, (err, data) => {
        if (err) throw err;
        const params = {
            Bucket: 'closedsea', // pass your bucket name
            Key: req.file.filename, // file will be saved as testBucket/contacts.csv
            ACL: "public-read",
            ContentType: req.file.mimetype,
            Body: data
        };
        s3.upload(params, function(err, data) {
            if (err) throw err
            let filterFeatureCollection= models.uploadfeaturemodel.findOneAndUpdate({collection_name:req.body.collection},{
              link: req.body.link,
              imageUrl:data.Location
            })
            filterFeatureCollection.exec((err)=>{
              if(err) throw err;
              res.status(200).json({message:"Success"})
            })
        });
    });
    }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
});

  routes.get("/feature_collection", async (req, res) => {
    try{
      models.uploadfeaturemodel.find().lean().exec((err,data)=>{
        if(err) throw err;
        res.status(200).json({data})
      })
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })

  routes.post("/verified_collection",(req,res)=>{
   try{
      let VerifiedCollection= models.collectionModel.findOneAndUpdate({name:req.body.collection_name},{
        isVerified: req.body.isverified
      })
      VerifiedCollection.exec((err)=>{
        if(err) throw err;
        res.status(200).json({message:"Successfully Verified"})
      })
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })

const profilefilePath = path.join(__dirname,"../","../public/commonimage/");
// for file upload
var Storage=multer.diskStorage({
  destination:profilefilePath,
  filename:(req,file,cb)=>{
    cb(null,uuid.v4()+path.extname(file.originalname))
  }
})

var uploadImage=multer({
  storage:Storage
}).single('file');
 
routes.post("/upload_file_to_s3",uploadImage,(req,res)=>{
 try{
    if(req.file == undefined){
      res.status("400").json({message:"Image is Required"})
    }
    else{
        fs.readFile(req.file.path, (err, data) => {
          if (err) throw err;
          const params = {
              Bucket: 'closedsea', // pass your bucket name
              Key: req.body.fname, // file will be saved
              ACL: "public-read",
              ContentType: req.file.mimetype,
              Body: data
          };
          s3.upload(params, function(s3Err, data) {
              if (s3Err) throw s3Err
              res.status(200).json(data);
          });
        });
      }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.get("/collection-names", async (req, res) => {
  try {
    const collections = await models.collectionModel
      .find({})
      .select("name -_id")
      .exec();
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
});

routes.get("/get-all-collections", async (req, res) => {
  try {
    const collections = await models.collectionModel.find().lean().exec();
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
});

routes.post("/get-verified-collection",(req, res) => {
  try{
    let decimal=parseInt(req.body.chainId);
    let filterData=models.collectionModel.find({isVerified:true}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size)).lean();
    models.collectionModel.countDocuments({isVerified:true}, function(err, count) {
      let totalPage=Math.ceil(count/parseInt(req.body.size));  
      filterData.exec(async(err,data)=>{
          if (err) throw err;
          if(data[0]==undefined || data[0]==null){
            res.status(200).json({message:"No Collection found",errs:true});
          }
          else{
            res.status(200).json({nft:data,totalPage:totalPage});
          }
      })
    })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.post("/oldest-collection",(req, res) => {
  try{
    let decimal=parseInt(req.body.chainId);
    let filterData=models.collectionModel.find().sort({$natural:1}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size)).lean();
    models.collectionModel.countDocuments( function(err, count) {
      let totalPage=Math.ceil(count/parseInt(req.body.size));  
      filterData.exec(async(err,data)=>{
          if (err) throw err;
          if(data[0]==undefined || data[0]==null){
            res.status(200).json({message:"No Collection found",errs:true});
          }
          else{
            res.status(200).json({nft:data,totalPage:totalPage});
          }
      })
    })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.post("/newest-collection",(req, res) => {
  try{
  let decimal=parseInt(req.body.chainId);
  let filterData=models.collectionModel.find().sort({$natural:-1}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size)).lean();
    models.collectionModel.countDocuments(function(err, count) {
      let totalPage=Math.ceil(count/parseInt(req.body.size));  
      filterData.exec(async(err,data)=>{
          if (err) throw err;
          if(data[0]==undefined || data[0]==null){
            res.status(200).json({message:"No Collection found",errs:true});
          }
          else{
            res.status(200).json({nft:data,totalPage:totalPage});
          }
      })
    })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.get("/my-collections", async (req, res) => {
  try {
    const owner = { '$regex' : '^'+req.query.owner+'$', "$options": "i" };
    const token = req.query.token;
    if(owner && token){
      const collections = await models.collectionModel.find({owner:owner,"tokens.tokenId": parseInt(token)}).lean().exec();
      res.status(200).json(collections);
    }
    else if(owner){
      const collections = await models.collectionModel.find({ owner }).lean().exec();
      res.status(200).json(collections);
    }
    else{
      res.status(400).json({message:"Required value not found"});
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
});

routes.get("/my-collections/v2", async (req, res) => {
  try {
    const owner = { '$regex' : '^'+req.query.owner+'$', "$options": "i" };
    if(owner && req.query.tokenId && req.query.tokenAddress){
      const collections = await models.collectionModel.find({owner:owner,tokens:{$elemMatch:{tokenId: parseInt(req.query.tokenId),tokenAddress: {'$regex': '^'+req.query.tokenAddress+'$','$options': 'i'}}}}).lean().exec();
      res.status(200).json(collections);
    }
    else if(owner){
      const collections = await models.collectionModel.find({ owner }).lean().exec();
      res.status(200).json(collections);
    }
    else{
      res.status(400).json({message:"Required value not found"});
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
});

routes.put("/insert-token-to-collection", async (req, res) => {
  try {
    const { body } = req;
    const collection = await models.collectionModel
      .find({ name: body.name })
      .lean()
      .exec();
    if (collection) {
      let tokenUpdate=models.collectionModel.findOneAndUpdate({name: body.name},{
        $push: {'tokens': parseInt(body.token)}
      })
      tokenUpdate.exec((err)=>{
        if(err) throw err;
        res.status(200).json({message:"Successfully token Added!"})
      })
    }
    else{
      res.status(200).json({message:"Document not found!"})
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
});

routes
  .route("/view-and-like")
  .get(async (req, res) => {
    try {
      const { tokenAddr, tokenId } = req.query;
      const obj = await models.viewAndLikeModel.findOne({ tokenAddr: { '$regex' : '^'+req.query.tokenAddr+'$', "$options": "i" }, tokenId:req.query.tokenId }).lean().exec();

      if (obj) {
        res.status(200).json({ ...obj });
      } else {
        res.status(200).json({
          views: 0,
          likes: 0,
          tokenAddr,
          tokenId,
          likedAccounts: [],
          viewedAddresses: [],
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  })
  .post(async (req, res) => {
    try {
      const { body } = req;
      console.log({ body });
      const obj = await models.viewAndLikeModel.findOne({
        tokenAddr: body.tokenAddr,
        tokenId: body.tokenId,
      });
      console.log({ obj });
      if (obj) {
        // update

        //VIEWS ARE NOT EQUAL ? THEN CHECK IF ADDRESS IS PRESENT IN ARRAY
        if (
          (parseInt(body.views) !== parseInt(obj.views) &&
            parseInt(body.views) !== 0) ||
          (parseInt(body.views) === parseInt(obj.views) &&
            parseInt(body.views) !== 0)
        ) {
          if (obj.viewedAddresses?.includes(body.address)) {
            return res.status(200).json({message:"Already viewed",error:true});
          } else {
            await models.viewAndLikeModel.findOneAndUpdate(
              { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
              { viewedAddresses: [...obj.viewedAddresses, body.address] },
              { new: true }
            );
          }
        }

        if (
          (parseInt(body.likes) !== parseInt(obj.likes) &&
            parseInt(body.likes) !== 0) ||
          (parseInt(body.likes) === parseInt(obj.likes) &&
            parseInt(body.likes) !== 0)
        ) {
          if (obj.likedAccounts?.includes(body.address)) {
            return res.status(200).json({message:"Already Liked",error:true});
          }
          //else if
          else {
            await models.viewAndLikeModel.findOneAndUpdate(
              { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
              { likedAccounts: [...obj.likedAccounts, body.address] },
              { new: true }
            );
          }
        }
        const newUpdatedInfo = await models.viewAndLikeModel.findOneAndUpdate(
          { tokenAddr: body.tokenAddr, tokenId: body.tokenId },
          {
            views: obj.views + body.views,
            likes: obj.likes + body.likes,
          },
          { new: true }
        );
        res.status(200).json(newUpdatedInfo);
      } else {
        await models.viewAndLikeModel.create({
          tokenAddr: body.tokenAddr,
          tokenId: body.tokenId,
          views: body.views > 0 ? 1 : 0,
          likes: body.likes > 0 ? 1 : 0,
          viewedAddresses: body.views > 0 ? [body.address?.toLowerCase()] : [],
          likedAccounts: body.likes > 0 ? [body.address?.toLowerCase()] : [],
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
    }
  });

routes.get("/views_and_likes",(req, res) => {
    var viewAndLike=models.viewAndLikeModel.find();
    viewAndLike.exec()
    .then((data)=>{
      res.send(data);
    })
    .catch((err)=>res.status(500).json({ message: error.message}))
})

routes.post("/usersviews_and_userslikes",(req, res) => {
  let likedNft =[];
    var like=models.viewAndLikeModel.find({likedAccounts:req.body.userAddress});
    like.exec((err,data)=>{
      data.forEach(function(token){
        let nftdata=models.nftControllerModel.findOne({tokenId:token.tokenId,tokenAddr: { '$regex' : '^'+token.tokenAddr+'$', "$options": "i" }});
        nftdata.exec((err,nft)=>{
          if (err) throw err
          likedNft.push(nft)
        })
      })
      setTimeout(()=>res.status(200).json({likedNft}),3000);
    })
})

routes.post("/update-notification-bar",async(req, res) => {
  try{
    let noti=await models.notificationmodel.findOne().lean().exec();
    await models.notificationmodel.findOneAndUpdate({_id:noti._id},req.body).exec();
    return res.status(200).json("Updated Successfully")
  } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.get("/get-notification-bar",apiAuth.userAuth,async(req, res) => {
  try{
    let noti=await models.notificationmodel.findOne().lean().exec();
    return res.status(200).json(noti)
  } catch (error) {
      res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.post("/usersviews",(req, res) => {
  let viewedNft =[];
    var view=models.viewAndLikeModel.find({viewedAddresses:req.body.userAddress});
    view.exec((err,data)=>{
      data.forEach(function(token){
        let nftdata=models.nftControllerModel.findOne({tokenId:token.tokenId,tokenAddr: { '$regex' : '^'+token.tokenAddr+'$', "$options": "i" }});
        nftdata.exec((err,nft)=>{
          if (err) throw err
          viewedNft.push(nft)
        })
      })
      setTimeout(()=>res.status(200).json({viewedNft}),3000);
    })
})

routes.post("/users_follow",(req, res) => {
  let follower=models.userModel.findOneAndUpdate({address:req.body.follower},{
    $push: {'follower': req.body.following}
  })
  follower.exec((err)=>{
    if(err) throw err;
    let following=models.userModel.findOneAndUpdate({address:req.body.following},{
      $push: {'following': req.body.follower}
    })
    following.exec((err)=>{
      if(err) throw err;
      res.send("success")
    })
  })
})

routes.post("/get-followers",(req, res) => {
  let followers=[];
    var user=models.userModel.findOne({address:{'$regex' : '^'+req.body.userAddress+'$', "$options": "i"}});
    user.exec((err,data)=>{
      if(err) throw err;
      if(data!==undefined && data!==null){
        if(data.follower[0]!==undefined && data.follower[0]!==null){
         data.follower.map(function(address){
          let userdata=models.userModel.findOne({address:{'$regex' : '^'+address+'$', "$options": "i"}});
          userdata.exec((err,fdata)=>{
            if (err) throw err
            if(fdata!==undefined && fdata!==null){
              followers.push(fdata)
            }
          })
        })
          setTimeout(()=>res.status(200).json({followers}),3000);
          }
        else{
          res.status(400).json({msg:"No followers"})
        }
      }
      else{
        res.status(400).json({msg:"No Data"})
      }
    })
})

routes.post("/get-following",(req, res) => {
  let followings=[];
    var user=models.userModel.findOne({address:{'$regex' : '^'+req.body.userAddress+'$', "$options": "i"}});
    user.exec((err,data)=>{
      if(err) throw err;
      if(data!==undefined && data!==null){
        if(data.following[0]!==undefined && data.following[0]!==null){
          data.following.map(function(address){
            let userdata=models.userModel.findOne({address:{'$regex' : '^'+address+'$', "$options": "i"}});
            userdata.exec((err,fdata)=>{
              if (err) throw err
              if(fdata!==undefined && fdata!==null){
                followings.push(fdata)
              }
            })
          })
        setTimeout(()=>res.status(200).json({followings}),3000);
      }
      else{
        res.status(400).json({msg:"No followings"})
      }
    }
      else{
        res.status(400).json({msg:"No Data"})
      }
  })
})

routes.post("/admin-register",async(req, res) => {
  try{
    if(!req.body.walletAddress || !req.body.name || !req.body.email){
      return res.status(500).json("Parameters are wrong");
    }
    else{
      let adminData=await models.adminRegisterModel.findOne({walletAddress:{'$regex' : '^'+req.body.walletAddress+'$', "$options": "i"}}).exec();
      if(adminData){
        res.status(500).json("Already Admin");
      }
      else{
        let createAdmin=new models.adminRegisterModel({
          walletAddress: req.body.walletAddress,
          name:req.body.name,
          email:req.body.email
        })
        createAdmin.save(function(){
          res.status(200).json("Admin registerd Succcesfully");
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.post("/admin-update",async(req, res) => {
  try{
      let adminData=await models.adminRegisterModel.findOne({walletAddress:{'$regex' : '^'+req.body.walletAddress+'$', "$options": "i"}}).exec();
      if(adminData){
        await models.adminRegisterModel.findOneAndUpdate({walletAddress:{'$regex' : '^'+req.body.walletAddress+'$', "$options": "i"}},req.body).exec();
        res.status(200).json("Updated succesfully");
      }
      else{
        res.status(500).json("Wallet Address is necessary to update Admin");
      }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.post("/admin-delete",async(req, res) => {
  try{
      let adminData=await models.adminRegisterModel.findOne({walletAddress:{'$regex' : '^'+req.body.walletAddress+'$', "$options": "i"}}).exec();
      if(adminData){
        await models.adminRegisterModel.findOneAndDelete({walletAddress:{'$regex' : '^'+req.body.walletAddress+'$', "$options": "i"}}).exec();
        res.status(200).json("Deleted succesfully");
      }
      else{
        res.status(500).json("Wallet Adddress is necessary to delete Admin");
      }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.get("/admin-all",async(req, res) => {
  try{
      let adminData=await models.adminRegisterModel.find().lean().exec();
      res.status(200).json(adminData);
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.post("/admin-login",async(req, res) => {
  if(req.body.address){
    let adminData=await models.adminRegisterModel.findOne({walletAddress:{'$regex' : '^'+req.body.address+'$', "$options": "i"}}).exec();
    if(adminData){
      const jwtData = {
        expiresIn:"2 hours" 
    };
      const token=jwt.sign({walletAddress:req.body.address},secret,jwtData)
      res.status(200).json(token)
    }
    else{
      res.status(400).send("Wallet Not Found")
    }
  }
  else{
    res.status(400).send("Wallet Not Found")
  }
})

routes.post("/single-nft",(req, res) => {
  if(req.body.tokenId == undefined || req.body.tokenAddr==undefined){
    res.status(500).json("Payload are wrong")
  }
  else{
    var nftdata=models.nftControllerModel.findOne({tokenId: req.body.tokenId , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }});;
    nftdata.exec()
    .then((data)=>{
      res.status(200).json(data)
    })
    .catch((err)=>res.status(500).json({ message: error.toString()}))
  }
})

routes.post("/nft-wrt-owner",(req, res) => {
  if(req.body.owner == undefined){
    res.status(500).json("Parameters are wrong")
  }
  else{
    var nftdata=models.nftControllerModel.find({owner: { '$regex' : '^'+req.body.owner+'$', "$options": "i" }});
    nftdata.exec()
    .then((data)=>{
      res.status(200).json(data)
    })
    .catch((err)=>res.status(500).json({ message: error.toString()}))
  }
})

routes.post("/nfts-wrt-chainId",async (req, res) => {
  try{
    if( req.body.chainId.decimal == undefined || req.body.chainId.hexa==undefined){
      res.status(500).json("Payload are wrong")
    }
    else{
      let decimal=parseInt(req.body.chainId.decimal);
      let hexa=String(req.body.chainId.hexa);
      let Nft = models.nftControllerModel.find({chainId:{decimal:decimal,hexa:hexa}});
      Nft.exec((err,data)=>{
        if(err) throw err;
        res.status(200).json(data)
      })
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.post("/nfts-wrt-tokenaddr",async (req, res) => {
  try{
    if(req.body.tokenIds == undefined || req.body.tokenAddr == undefined || req.body.tokenIds.length < 1 || req.body.tokenIds.length == undefined){
      res.status(500).json("Payload are wrong")
    }
    else{
      let data=[];
      let tokenIds=req.body.tokenIds;
      let i=0;
      findNft(tokenIds[i]);
      async function findNft(id){
        let nft =await models.nftControllerModel.findOne({tokenId: id , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }}).lean().exec();
        if(nft){
          data.push(nft)
        }
        if(i!==tokenIds.length-1){
          i++;
          await findNft(tokenIds[i]);
        }
        else{
          return res.status(200).json(data);
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.post("/nfts-wrt-tokenaddr-and-id",async (req, res) => {
  try{
    if(req.body.nftToken == undefined || req.body.nftToken.length < 1 || req.body.nftToken.length == undefined){
      res.status(500).json("Payload are wrong")
    }
    else{
      let data=[];
      let tokens=req.body.nftToken;
      let i=0;
      findNft(tokens[i]);
      async function findNft(token){
        if(!Object.keys(token).length<2 && token.id && token.address){
          let nft =await models.nftControllerModel.findOne({tokenId: token.id , tokenAddr: { '$regex' : '^'+token.address+'$', "$options": "i" }}).lean().exec();
          if(nft){
            data.push(nft)
          }
        }
        if(i!==tokens.length-1){
          i++;
          await findNft(tokens[i]);
        }
        else{
          return res.status(200).json(data);
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
  }
})

routes.get("/nft-collector",(req, res) => {
  var nftdata=models.nftControllerModel.find();
  nftdata.exec()
  .then((data)=>{
    res.status(200).json(data)
  })
  .catch((err)=>res.status(500).json({ message: error.toString()}))
})

routes.post("/nft-collector",(req, res) => {
  try{
    if(req.body.tokenId && req.body.tokenAddr){
    let filterData=models.nftControllerModel.findOne({tokenId: String(req.body.tokenId) , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }});
      filterData.exec((err,data)=>{
        if (err) throw err;
        if(data!==null){
          let updateNft= models.nftControllerModel.findOneAndUpdate({tokenId: String(req.body.tokenId),tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }},{
            price: req.body.price,
            owner:req.body.ownerOf,
            selectedCat:req.body.selectedCat,
            isOnSell:req.body.isOnSell
          })
          updateNft.exec((err)=>{
            if(err) throw err;
            res.status(200).json({message:"Updated Success"})
          })
        }
        else{
          let createNft=new models.nftControllerModel({
            tokenAddr: req.body.tokenAddr,
            tokenId: req.body.tokenId,
            price: req.body.price,
            owner:req.body.ownerOf,
            metadata: req.body.metadata,
            selectedCat:req.body.selectedCat,
            tokenUri:req.body.tokenUri,
            chainId:req.body.chainId,
            relatedCollectionId:req.body.relatedCollectionId,
            status:"pending"
          })
          createNft.save(function(){
            res.status(200).json({message:"Success"})
        });
        }
      })
    }
    else{
      res.status(500).json("Token Id or TokenAddress is not Defined");
    }
  } catch (error) {
  res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.post("/external-nft",(req, res) => {
  try{
    let query;
    if(parseInt(req.body.chainId)==56 || String(req.body.chainId)=="0x38"){
      query={
        owner:{ '$regex' : '^'+req.body.owner+'$', "$options": "i" },
        $or:[{"chainId.decimal":parseInt(req.body.chainId)},{"decimal.hexa":String(req.body.chainId)}],
        $and:[
          {tokenAddr: {$ne:"0xB2D4C7AfFa1B01fa33C82A8aC63075BD366df4b0"}},
          {tokenAddr: {$ne:"0x5b31d474dcadc1c2a1dfc7d4562b2268b0feea43"}},
          {tokenAddr: {$ne:"0xA84ABA462A3dc12A5874c8D0D61d757256C905a5"}},
          {tokenAddr: {$ne:"0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"}},
          {tokenAddr: {$ne:"0x69903cd9dBBEC1bcaB81E1ffe003260e9e487Ca4"}},
          {tokenAddr: {$ne:"0xe9e7cea3dedca5984780bafc599bd69add087d56"}}
        ],
      }
    }
    else if(parseInt(req.body.chainId)==97 || String(req.body.chainId)=="0x61"){
      query={
        owner:{ '$regex' : '^'+req.body.owner+'$', "$options": "i" },
        $or:[{"chainId.decimal":parseInt(req.body.chainId)},{"decimal.hexa":String(req.body.chainId)}],
        $and:[
          {tokenAddr: {$ne:"0x69536bdf4B18499181EB386B0E4019a28C4Fb096"}},
          {tokenAddr: {$ne:"0xA4fb840986B10aC44aA893793cfe755c81c3740D"}},
          {tokenAddr: {$ne:"0xBec98ca675EE0099E7eaF0d626a38abAE42Ef24D"}},
          {tokenAddr: {$ne:"0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"}},
          {tokenAddr: {$ne:"0x51c19275686d84c1553f3edd2945dba6ec0c7de4"}},
          {tokenAddr: {$ne:"0x8301f2213c0eed49a7e28ae4c3e91722919b8b47"}}
        ],
      }
    }
    else if(parseInt(req.body.chainId)==4 || String(req.body.chainId)=="0x4"){
      query={
        owner:{ '$regex' : '^'+req.body.owner+'$', "$options": "i" },
        $or:[{"chainId.decimal":parseInt(req.body.chainId)},{"decimal.hexa":String(req.body.chainId)}],
        $and:[
          {tokenAddr: {$ne:"0xDB753bacDFb788c4d70CEc237F898db21017B11d"}},
          {tokenAddr: {$ne:"0x848655Ccc2E571cA9470954BF08C4Eab3436830B"}},
          {tokenAddr: {$ne:"0x8A36a5395CAa70da6545f030BFB659Fc8e820A59"}}
        ],
      }
    }
    else if(parseInt(req.body.chainId)==1 || String(req.body.chainId)=="0x1"){
      query={
        owner:{ '$regex' : '^'+req.body.owner+'$', "$options": "i" },
        chainId:{decimal:1,hexa:"0x1"},
      }
    }
    else if(parseInt(req.body.chainId)==137 || String(req.body.chainId)=="0x89"){
      query={
        owner:{ '$regex' : '^'+req.body.owner+'$', "$options": "i" },
        $or:[{"chainId.decimal":parseInt(req.body.chainId)},{"decimal.hexa":String(req.body.chainId)}],
      }
    }
    else if(parseInt(req.body.chainId)==80001 || String(req.body.chainId)=="0x13881"){
      query={
        owner:{ '$regex' : '^'+req.body.owner+'$', "$options": "i" },
        $or:[{"chainId.decimal":parseInt(req.body.chainId)},{"decimal.hexa":String(req.body.chainId)}],
      }
    }
    let externalNft= models.nftControllerModel.find(query)
    externalNft.exec((err,data)=>{
      if(err) throw err;
      res.status(200).json(data)
    })
  }
  catch(err) {
    console.error(err);
  }
})

routes.post("/insert-multiple-nft",async (req, res) => {
  try{
    if(req.body.nfts.length<1){
      res.status(400).json({message:"NFT array not defined"})
    }
    else{
      let nfts=req.body.nfts;
      let i=0;
      storeNFT(0);
      async function storeNFT(i){
        let check = await models.nftControllerModel.findOne({tokenId: nfts[i].tokenId , tokenAddr: { '$regex' : '^'+nfts[i].tokenAddr+'$', "$options": "i" }}).exec();
        if(check==null){
           await new models.nftControllerModel({
              tokenAddr: nfts[i].tokenAddr,
              tokenId: nfts[i].tokenId,
              price: nfts[i].price,
              owner:nfts[i].ownerOf,
              metadata: nfts[i].metadata,
              selectedCat:nfts[i].selectedCat,
              tokenUri:nfts[i].tokenUri,
              chainId:nfts[i].chainId,
              relatedCollectionId:nfts[i].relatedCollectionId,
              status:"pending"
          }).save();
        }
        if(i==nfts.length-1){
          res.status(200).json({message:"Successfully stored"})
        }
        else{
          i++;
          await storeNFT(i);
        }
      }
    }
  }
  catch(err) {
    console.error(err);
  }
})

routes.post("/search-nft",(req, res) => {
  if (req.body.name !==undefined && req.body.name !== null && req.body.name !== false){
    let decimal=parseInt(req.body.chainId);
    let limitedNft=models.nftControllerModel.find({"metadata.name": { $regex:'.*' + req.body.name + ".*", $options: 'i'},"chainId.decimal":decimal}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
      models.nftControllerModel.countDocuments({"metadata.name": { $regex:'.*' + req.body.name + ".*", $options: 'i'},"chainId.decimal":decimal}, function(err, count) {
        let totalPage=Math.ceil(count/req.body.size);
        limitedNft.exec((err,data)=>{
          if(err) throw err;
          if(data[0]!==undefined && data[0]!==null){
            res.status(202).json({nft:data,totalPage:totalPage})
          }
          else{
            res.status(500).json({message:"No NFT found"})
          }
        })
      })
  }
  else{
    res.status(500).json({message:"Data is not defined"})
  }
})

routes.post("/update-nft-status",auth,(req, res) => {
  let filterData=models.nftControllerModel.findOne({tokenId: req.body.tokenId , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }});
  filterData.exec((err,data)=>{
    if (err) throw err;
    if(data!==undefined && data!==null){
      let updateNft= models.nftControllerModel.findOneAndUpdate({tokenId: req.body.tokenId , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }},{
        status: req.body.status,
      })
      updateNft.exec((err)=>{
        if(err) throw err;
        res.status(200).json({message:"Status Updated Successfully"})
      })
    }
    else{
      res.status(400).json({message:"Nft not found"})
    }
})

})

routes.post("/most-liked-nft",async (req, res) => {
  let limit=parseInt(req.body.size);
  let page=parseInt(req.body.page);
  let decimal=parseInt(req.body.chainId);
  let filterData=await models.nftControllerModel.aggregate([
    {$match : {isOnSell:true,status:"active","chainId.decimal":decimal}},
    {$lookup: {
      from: "viewandlikes", // collection to join
      let: {tokenAddr: "$tokenAddr", tokenId: "$tokenId"},
					pipeline: [
						{
							$match:
								{
									$expr:
										{
											$and:
												[{$eq: ["$tokenAddr", "$$tokenAddr"]},{$eq: ["$tokenId", "$$tokenId"]} ]
										}
								}
						}
					],
      as: "likes"// output array field
      }},
      { $unwind : "$likes" },
      {$addFields: {"likes": "$likes.likes"}},
      { "$sort": {"likes":-1} },
      {$facet: {
        data: [
          { $skip : (page-1)*limit},
          { $limit : limit }
        ],
        Total:[
          { $group:{ _id :null ,count:{$sum:1}}}
        ]
      }}
  ]).exec();
  let count=0;
  if(filterData){
    count=filterData[0].Total[0].count;
  }
  let totalPage=Math.ceil(count/req.body.size);
  res.status(200).json({mostLikedNft:filterData[0].data,totalPage:totalPage});
})

routes.post("/least-liked-nft",async (req, res) => {
  let limit=parseInt(req.body.size);
  let page=parseInt(req.body.page);
  let decimal=parseInt(req.body.chainId);
  let filterData=await models.nftControllerModel.aggregate([
    {$match : {isOnSell:true,status:"active","chainId.decimal":decimal}},
    {$lookup: {
      from: "viewandlikes", // collection to join
      let: {tokenAddr: "$tokenAddr", tokenId: "$tokenId"},
					pipeline: [
						{
							$match:
								{
									$expr:
										{
											$and:
												[{$eq: ["$tokenAddr", "$$tokenAddr"]},{$eq: ["$tokenId", "$$tokenId"]} ]
										}
								}
						}
					],
      as: "likes"// output array field
      }},
      { $unwind : "$likes" },
      {$addFields: {"likes": "$likes.likes"}},
      { "$sort": {"likes":1} },
      {$facet: {
        data: [
          { $skip : (page-1)*limit},
          { $limit : limit }
        ],
        Total:[
          { $group:{ _id :null ,count:{$sum:1}}}
        ]
      }}
  ]).exec();
  let count=0;
  if(filterData){
    count=filterData[0].Total[0].count;
  }
  let totalPage=Math.ceil(count/req.body.size);
  res.status(200).json({leastLikedNft:filterData[0].data,totalPage:totalPage});
})

routes.post("/price-range-nft",(req, res) => {
  let decimal=parseInt(req.body.chainId);
  let filterData=models.nftControllerModel.find({isOnSell:true,status:"active","chainId.decimal":decimal,price:{$gt:req.body.startPrice,$lt:req.body.endPrice}}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
  models.nftControllerModel.countDocuments({isOnSell:true,status:"active","chainId.decimal":decimal,price:{$gt:req.body.startPrice,$lt:req.body.endPrice}}, function(err, count) {
    let totalPage=Math.ceil(count/req.body.size);  
    filterData.exec(async(err,data)=>{
      if (err) throw err;
      if(data[0]==undefined || data[0]==null){
        res.status(200).json({message:"No NFT found in this Price range",totalPage:totalPage,errs:true});
      }
      else{
        res.status(200).json({nft:data,totalPage:totalPage});
      }
    })
  })
})

routes.post("/oldest-nft",(req, res) => {
  try{
    let decimal=parseInt(req.body.chainId);
    let filterData=models.nftControllerModel.find({isOnSell:true,status:"active","chainId.decimal":decimal}).sort({$natural:1}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size));
    models.nftControllerModel.countDocuments({isOnSell:true,status:"active","chainId.decimal":decimal}, function(err, count) {
      let totalPage=Math.ceil(count/parseInt(req.body.size));  
      filterData.exec(async(err,data)=>{
          if (err) throw err;
          if(data[0]==undefined || data[0]==null){
            res.status(200).json({message:"No NFT found",errs:true});
          }
          else{
            res.status(200).json({nft:data,totalPage:totalPage});
          }
      })
    })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.post("/newest-nft",(req, res) => {
  try{
  let decimal=parseInt(req.body.chainId);
  let filterData=models.nftControllerModel.find({isOnSell:true,status:"active","chainId.decimal":decimal}).sort({$natural:-1}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size));
    models.nftControllerModel.countDocuments({isOnSell:true,status:"active","chainId.decimal":decimal}, function(err, count) {
      let totalPage=Math.ceil(count/parseInt(req.body.size));  
      filterData.exec(async(err,data)=>{
          if (err) throw err;
          if(data[0]==undefined || data[0]==null){
            res.status(200).json({message:"No NFT found",errs:true});
          }
          else{
            res.status(200).json({nft:data,totalPage:totalPage});
          }
      })
    })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.get("/count-nft",(req, res) => {
  models.nftControllerModel.countDocuments({}, function(err, count) {
    res.status(202).json(count)
  })
})

routes.post("/nft-pagination",(req, res) => {
  let limitedNft=models.nftControllerModel.find({}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size));
  models.nftControllerModel.countDocuments({}, function(err, count) {
    let totalPage=Math.ceil(count/parseInt(req.body.size));
    limitedNft.exec((err,data)=>{
      if(err) throw err;
      res.status(202).json({nft:data,totalPage:totalPage})
    })
  })
})

routes.post("/collection-pagination",(req, res) => {
  try{
  let limitedCollection=models.collectionModel.find({category:req.body.category}).skip((parseInt(req.body.page)-1)*parseInt(req.body.size)).limit(parseInt(req.body.size)).lean();
  models.collectionModel.countDocuments({category:req.body.category}, function(err, count) {
    let totalPage=Math.ceil(count/parseInt(req.body.size));
    limitedCollection.exec((err,data)=>{
      if(err) throw err;
      res.status(202).json({collection:data,totalPage:totalPage})
    })
  })
  } catch (error) {
    res.status(500).json({ message: "Some thing went wrong" , error:error.message});
}
})

routes.get("/feature-nft",(req, res) => {
  var nftdata=models.nftControllerModel.find({featured: true});
  nftdata.exec()
  .then((data)=>{
    if(data[0]!==undefined && data[0]!==null){
      res.status(200).json(data)
    }
    else{
      res.status(400).json({message:"No any Nft is featured"})
    }
  })
  .catch((err)=>res.status(500).json({ message: error.toString()}))
})

routes.post("/feature-nft",auth,(req, res) => {
  models.nftControllerModel.countDocuments({featured: true}, function(err, documents) {
    if(documents==10 && req.body.isFeatured==true){
      res.status(202).json({message:"Feature nft limit exceed"})
    }
    else if(documents==3 && req.body.isFeatured==false){
      res.status(202).json({message:"Minimum 3 should be featured"})
    }
    else{
      let filterData=models.nftControllerModel.findOne({tokenId: req.body.tokenId , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }});
      filterData.exec((err,data)=>{
        if (err) throw err;
        if(data!==undefined && data!==null){
          if(data.status=="active"){
            let updateNft= models.nftControllerModel.findOneAndUpdate({tokenId: req.body.tokenId , tokenAddr: { '$regex' : '^'+req.body.tokenAddr+'$', "$options": "i" }},{
              featured: req.body.isFeatured,
            })
            updateNft.exec((err)=>{
              if(err) throw err;
              res.status(200).json({message:"Nft Updated Successfully"})
            })
        }
        else{
          res.status(400).json({message:"Nft not activated"})
        }
      }
        else{
          res.status(400).json({message:"Nft not found"})
        }
      })
    }
  })
})

routes.post("/count-nft-category-vise",(req, res) => {
  if (req.body.category ==undefined && req.body.category == null && req.body.category == false){
    res.status(500).json({message:"Data is not defined"})
  }
  else if(req.body.category=="All NFTs"){
    models.nftControllerModel.countDocuments({}, function(err, count) {
      res.status(202).json(count)
    })
  }
  else{
    models.nftControllerModel.countDocuments({selectedCat:req.body.category}, function(err, count) {
      res.status(202).json(count)
    })
  }
})

routes.post("/nft-category-vise",(req, res) => {
  if(req.body.isMarketPlace){
    if (req.body.category ==undefined && req.body.category == null && req.body.category == false){
      res.status(200).json({message:"Data is not defined"})
    }
    else if(req.body.category=="All NFTs"){
      let decimal=parseInt(req.body.chainId);
        let limitedNft=models.nftControllerModel.find({isOnSell:true,status:"active","chainId.decimal":decimal}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
        models.nftControllerModel.countDocuments({isOnSell:true,status:"active","chainId.decimal":decimal}, function(err, count) {
        let totalPage=Math.ceil(count/req.body.size);
        limitedNft.exec((err,data)=>{
          if(err) throw err;
          if(data[0]!==undefined && data[0]!==null){
            res.status(202).json({nft:data,totalPage:totalPage})
          }
          else{
            res.status(200).json({message:"No NFT found"})
          }
        })
      })
    }
    else{
      let decimal=parseInt(req.body.chainId);
        let limitedNft=models.nftControllerModel.find({selectedCat:req.body.category,isOnSell:true,status:"active","chainId.decimal":decimal}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
        models.nftControllerModel.countDocuments({selectedCat:req.body.category,isOnSell:true,status:"active","chainId.decimal":decimal}, function(err, count) {
          if (err) throw err;
          if(count == undefined || count == null || count == false || count == 0){
            res.status(200).json({message:"No NFT found for this Category"})
          }
          else{
            let totalPage=Math.ceil(count/req.body.size);
            limitedNft.exec((err,data)=>{
              if(err) throw err;
              if(data[0]!==undefined && data[0]!==null){
                res.status(202).json({nft:data,totalPage:totalPage})
              }
              else{
                res.status(200).json({message:"No NFT found for this Category"})
              }
            })
          }
        })
      }
    }
  else{
    let limitedNft=models.nftControllerModel.find({}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
      models.nftControllerModel.countDocuments({}, function(err, count) {
      let totalPage=Math.ceil(count/req.body.size);
      limitedNft.exec((err,data)=>{
        if(err) throw err;
        if(data[0]!==undefined && data[0]!==null){
          res.status(202).json({nft:data,totalPage:totalPage})
        }
        else{
          res.status(200).json({message:"No NFT found"})
        }
      })
    })
  }
})

const filePath = path.join(__dirname,"../","../public/sliderimage/");
// for file upload
var Storage=multer.diskStorage({
  destination:filePath,
  filename:(req,file,cb)=>{
    cb(null,uuid.v4()+path.extname(file.originalname))
  }
})

var upload=multer({
  storage:Storage
}).single('pic');
 

routes.post("/add_slider",auth,upload,(req,res)=>{
  if(req.file == undefined){
    res.status("400").json({message:"Image is Required"})
  }
  else if(req.body.link == undefined){
    res.status("400").json({message:"Link is Required"})
  }
  else{
    models.uploadSliderModel.countDocuments({}, function(err, documents) {
      if(documents==10){
        res.status(202).json({msg:"slider limit exceed"})
      }
      else{
      fs.readFile(req.file.path, (err, data) => {
        if (err) throw err;
        const params = {
            Bucket: 'closedsea', // pass your bucket name
            Key: req.file.filename, // file will be saved
            ACL: "public-read",
            ContentType: req.file.mimetype,
            Body: data
        };
        s3.upload(params, function(s3Err, data) {
            if (s3Err) throw s3Err
            let uploadslider= new models.uploadSliderModel({
              link: req.body.link,
              imageUrl:data.Location
            })
            uploadslider.save((err)=>{
              if(err) throw err;
              res.status(200).json({message:"Success"})
            })
        });
      });
    }
});
}
});

routes.post("/update_slider",auth,upload,(req,res)=>{
  if(req.file == undefined){
    res.status(400).json({message:"Image is Required"})
  }
  else if(req.body.link == undefined){
    res.status(400).json({message:"Link is Required"})
  }
  else{
  console.log(req.file);
  fs.readFile(req.file.path, (err, data) => {
    if (err) throw err;
    const params = {
        Bucket: 'closedsea', // pass your bucket name
        Key: req.file.filename, // file will be saved as testBucket/contacts.csv
        ACL: "public-read",
        ContentType: req.file.mimetype,
        Body: data
    };
    s3.upload(params, function(s3Err, data) {
        if (s3Err) throw s3Err
        let uploadslider= models.uploadSliderModel.findOneAndUpdate({_id:req.body.id},{
          link: req.body.link,
          imageUrl:data.Location
        })
        uploadslider.exec((err)=>{
          if(err) throw err;
          res.status(200).json({message:"Success"})
        })
    });
 });
}
});

routes.delete("/delete_slider/:id",auth,upload,(req,res)=>{
  let url=req.query.q.split(".com/")[1] ;
  var deleteSlider= models.uploadSliderModel.findOneAndDelete({_id:req.params.id});
  s3.deleteObject({
    Bucket: "closedsea",
    Key: url
  },function (err,data){
    deleteSlider.exec(function(err){
      if(err) throw err;
      res.status(200).json({message:"Successfully deleted"})
  })
  })
});

routes.get("/getsliders",(req,res)=>{
  let filterData=models.uploadSliderModel.find();
  filterData.exec(function(err,data){
    if(err) throw err;
    if(data){
      res.status(200).json(data)
    }
  });
})

routes.route("/search").get(async (req, res) => {
  try {
    const { name } = req.query;
    console.log(name);
    if(name){
    const collections = await models.collectionModel.find({ name: { $regex:'^' + name, $options: 'i'} });
    const users = await models.userModel.find({ userName: { $regex:'^' + name, $options: 'i'} });
    
    res.status(200).json({
      message: "success",

      data: {
        collections,
        users,
      },
    });}
    else{
      res.status(200).json({
        message: "success",
  
        data: {
          collections:"",
          users:""
        }
    })
  }
  } catch (error) {
    res.status(500).json({ message: error.toString() });
  }
});

module.exports = routes;