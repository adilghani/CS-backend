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

routes.use(cookieParser())

// Body Parsers
routes.use(bodyParser.urlencoded({ extended: false }));
routes.use(bodyParser.json());

const s3 = new AWS.S3({
  accessKeyId: "AKIASAFVMRRSMD5RISOV",
  secretAccessKey: "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"
});

routes.get("/", (req, res) => {
  res.status(200).json({ message: "Connected!" });
});

routes
  .route("/profile")
  .post(async (req, res) => {
    try {
      const { body } = req;
      let check = await models.userModel.findOne({address: body.address.toLowerCase()}).exec();
      if(check == null || check == undefined){
        res.status(200).json({ message: "This wallet address is already exist" });
      }
      else{
        await models.userModel.create({
          ...body,
          address: body.address.toLowerCase(),
        });
        res.status(200).json("Successfully registered");
      }
    } catch (error) {
      console.log("[profile post] error => ", error);
      res.status(500).json({ message: "Server Error" });
    }
  })
  .put(async (req, res) => {
    try {
      const { body } = req;
      const userFromDB = await models.userModel.findOne({
        address: body.address.toLowerCase(),
      });
      if (userFromDB) {
        await models.userModel.updateOne(
          { address: body.address.toLowerCase() },
          { ...body, address: body.address.toLowerCase() },
          { runValidators: true }
        );
        res.status(200).json("Successfully updated");
      } else {
        res.status(500).json({ message: "User not registered yet." });
      }
    } catch (error) {
      console.log("[profile post] error => ", error);
      res.status(500).json({ message: "Server Error" });
    }
  })
  .get(async (req, res) => {
    const address = req.query.address;
    const user = await models.userModel
      .findOne({ address: address.toLowerCase() })
      .lean()
      .exec();
    res.status(200).json({ ...user });
  });

  routes.post("/verified_user",(req,res)=>{
    let VerifiedCollection= models.userModel.findOneAndUpdate({address:req.body.address},{
      isVerified: req.body.isverified
    })
    VerifiedCollection.exec((err)=>{
      if(err) throw err;
      res.status(200).json({message:"Successfully Verified"})
    })
  })

routes.get("/get-all-users", (req, res) => {
    let user = models.userModel.find();
    user.exec((err,data)=>{
      res.status(200).json({data});
    })
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
          $push: {'tokens': parseInt(body.tokens)}
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
          tokens: parseInt(body.tokens) || [],
        });
        res.status(200).json("Successfully created!");
      }
    } catch (error) {
      console.log("[collection post] error => ", error);
      res.status(500).json({ message: error.toString() });
    }
  })
  .put(async (req, res) => {
    try {
      const { body } = req;
      const existingOne = await models.collectionModel.findOne({
        _id: body._id,
      });
      if (!existingOne) {
        throw new Error("No exist id");
      }
      let data = {
        name: body.name?.toLowerCase(),
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
      await models.collectionModel.updateOne({ _id: body._id }, data);
      res.status(200).json("Successfully updated!");
    } catch (error) {
      console.log("[collection put] error => ", error);
      res.status(500).json({ message: error.toString() });
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
      console.log("[collection get] error => ", error);
      res.status(500).json({ message: error.toString() });
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
   
  routes.post("/feature_collection",uploadcoll,(req,res)=>{
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
  });

  routes.get("/feature_collection", async (req, res) => {
    models.uploadfeaturemodel.find((err,data)=>{
      if(err) throw err;
      res.status(200).json({data})
    })
  })

  routes.post("/verified_collection",(req,res)=>{
    let VerifiedCollection= models.collectionModel.findOneAndUpdate({name:req.body.collection_name},{
      isVerified: req.body.isverified
    })
    VerifiedCollection.exec((err)=>{
      if(err) throw err;
      res.status(200).json({message:"Successfully Verified"})
    })
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
})

routes.get("/collection-names", async (req, res) => {
  try {
    const collections = await models.collectionModel
      .find({})
      .select("name -_id")
      .exec();
    res.status(200).json(collections);
  } catch (error) {
    console.log("[collection names] get error => ", error);
    res.status(500).json({ message: error.toString() });
  }
});

routes.get("/my-collections", async (req, res) => {
  try {
    const owner = req.query.owner?.toLowerCase();
    const token = req.query.token;
    if(owner && token){
      const collections = await models.collectionModel.find({$and:[ {owner:owner},{tokens:parseInt(token)} ]}).lean().exec();
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
    console.log("[collection names] get error => ", error);
    res.status(500).json({ message: error.toString() });
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
    console.log("[collection names] get error => ", error);
    res.status(500).json({ message: error.toString() });
  }
});

routes
  .route("/view-and-like")
  .get(async (req, res) => {
    try {
      const { tokenAddr, tokenId } = req.query;

      const obj = await models.viewAndLikeModel
        .findOne({ tokenAddr, tokenId })
        .lean()
        .exec();

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
      console.log("[view and like] get error => ", error);
      res.status(500).json({ message: error.toString() });
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
            throw new Error("Already viewed");
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
            throw new Error("Already Liked");
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
          { tokenAddr: body.tokenAddr?.toLowerCase(), tokenId: body.tokenId },
          {
            views: obj.views + body.views,
            likes: obj.likes + body.likes,
          },
          { new: true }
        );
        res.status(200).json(newUpdatedInfo);
      } else {
        await models.viewAndLikeModel.create({
          tokenAddr: body.tokenAddr?.toLowerCase(),
          tokenId: body.tokenId,
          views: body.views > 0 ? 1 : 0,
          likes: body.likes > 0 ? 1 : 0,
          viewedAddresses: body.views > 0 ? [body.address?.toLowerCase()] : [],
          likedAccounts: body.likes > 0 ? [body.address?.toLowerCase()] : [],
        });
      }
    } catch (error) {
      console.log("[view and like] post error => ", error);
      res.status(500).json({ message: error.toString() });
    }
  });

routes.get("/views_and_likes",(req, res) => {
    var viewAndLike=models.viewAndLikeModel.find();
    viewAndLike.exec()
    .then((data)=>{
      res.send(data);
    })
    .catch((err)=>res.status(500).json({ message: error.toString()}))
})

routes.post("/usersviews_and_userslikes",(req, res) => {
  let likedNft =[];
    var like=models.viewAndLikeModel.find({likedAccounts:req.body.userAddress});
    like.exec((err,data)=>{
      data.forEach(function(token){
        let nftdata=models.nftControllerModel.findOne({tokenId:token.tokenId});
        nftdata.exec((err,nft)=>{
          if (err) throw err
          likedNft.push(nft)
        })
      })
      setTimeout(()=>res.status(200).json({likedNft}),3000);
    })
})


routes.post("/usersviews",(req, res) => {
  let viewedNft =[];
    var view=models.viewAndLikeModel.find({viewedAddresses:req.body.userAddress});
    view.exec((err,data)=>{
      data.forEach(function(token){
        let nftdata=models.nftControllerModel.findOne({tokenId:token.tokenId});
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
    var user=models.userModel.findOne({address:req.body.userAddress});
    user.exec((err,data)=>{
      if(err) throw err;
      if(data!==undefined && data!==null){
        if(data.follower[0]!==undefined && data.follower[0]!==null){
         data.follower.map(function(address){
          let userdata=models.userModel.findOne({address:address});
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
    var user=models.userModel.findOne({address:req.body.userAddress});
    user.exec((err,data)=>{
      if(err) throw err;
      if(data!==undefined && data!==null){
        if(data.following[0]!==undefined && data.following[0]!==null){
          data.following.map(function(address){
            let userdata=models.userModel.findOne({address:address});
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

routes.post("/admin-register",(req, res) => {
  if(req.body.account){
    let createAdmin=new models.adminRegisterModel({
      walletAddress: req.body.account,
    })
    createAdmin.save(function(){
      res.send("Admin Stored Succcesfully");
    });
  }
  else{
    res.status.send("address are empty")
  }
})

routes.post("/admin-login",(req, res) => {
  let adminData=models.adminRegisterModel.findOne({walletAddress:req.body.account});
  adminData.exec()
  .then((data)=>{
    if(data){
      const token=jwt.sign({walletAddress:req.body.account},"walletaddress12345678123456781234")
      res.cookie('closedSeaAdmin',token,{expires:new Date(Date.now()+6000000)})
      res.status(200).send("Sucessfull Login")
    }
    else{
      res.status(400).send("Wallet Not Found")
    }
  })
  .catch((err)=>res.status(500).json({ message: error.toString()}))
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
  let filterData=models.nftControllerModel.findOne({tokenId: req.body.tokenId});
  filterData.exec((err,data)=>{
    if (err) throw err;
    if(data!==null){
      let updateNft= models.nftControllerModel.findOneAndUpdate({tokenId: req.body.tokenId},{
        price: req.body.price,
        owner:req.body.ownerOf,
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

})

routes.post("/search-nft",(req, res) => {
  if (req.body.name !==undefined && req.body.name !== null && req.body.name !== false){
    let limitedNft=models.nftControllerModel.find({"metadata.name": { $regex:'.*' + req.body.name + ".*", $options: 'i'}}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
      models.nftControllerModel.countDocuments({"metadata.name": { $regex:'.*' + req.body.name + ".*", $options: 'i'}}, function(err, count) {
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

routes.post("/update-nft-status",(req, res) => {
  let filterData=models.nftControllerModel.findOne({tokenId: req.body.tokenId});
  filterData.exec((err,data)=>{
    if (err) throw err;
    if(data!==undefined && data!==null){
      let updateNft= models.nftControllerModel.findOneAndUpdate({tokenId: req.body.tokenId},{
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

routes.post("/most-liked-nft",(req, res) => {
  let mostLikeNft=[]
  let filterData=models.viewAndLikeModel.find().skip((req.body.page-1)*req.body.size).limit(req.body.size).sort({likes:-1});
  models.viewAndLikeModel.countDocuments({}, function(err, count) {
    let totalPage=Math.ceil(count/req.body.size);  
    filterData.exec(async(err,datas)=>{
      if (err) throw err;
      for await (const data of datas){
        let temp={};
        let filterNft=models.nftControllerModel.findOne({tokenId:data.tokenId,isOnSell:true,status:"active"});
        filterNft.exec((err,nft)=>{
          if(err) throw err;
          if(nft !== null && nft !== undefined){
            temp.tokenAddr=nft.tokenAddr;
            temp.tokenId=nft.tokenId;
            temp.price=nft.price;
            temp.owner=nft.owner;
            temp.metadata=nft.metadata;
            temp.tokenUri=nft.tokenUri;
            temp.selectedCat=nft.selectedCat;
            temp.status=nft.status;
            temp.chainId=nft.chainId;
            temp.relatedCollectionId=nft.relatedCollectionId;
            temp.featured=nft.featured;
            temp.isOnSell=nft.isOnSell;
            temp.likes=data.likes;
            mostLikeNft.push(temp)
          }
        })
      }
      setTimeout(()=>{
        mostLikeNft.sort(function(a, b) {
          return parseFloat(b.likes) - parseFloat(a.likes);
      });
        res.status(200).json({mostLikedNft:mostLikeNft,totalPage:totalPage});
      },3000)
    })
  })
})

routes.post("/least-liked-nft",(req, res) => {
  let mostLikeNft=[]
  let filterData=models.viewAndLikeModel.find().skip((req.body.page-1)*req.body.size).limit(req.body.size).sort({likes:1});
  models.viewAndLikeModel.countDocuments({}, function(err, count) {
    let totalPage=Math.ceil(count/req.body.size);  
    filterData.exec(async(err,datas)=>{
      if (err) throw err;
      for await (const data of datas){
        let temp={};
        let filterNft=models.nftControllerModel.findOne({tokenId:data.tokenId,isOnSell:true,status:"active"});
        filterNft.exec((err,nft)=>{
          if(err) throw err;
          if(nft!==null && nft!==undefined)
            {
            temp.tokenAddr=nft.tokenAddr;
            temp.tokenId=nft.tokenId;
            temp.price=nft.price;
            temp.owner=nft.owner;
            temp.metadata=nft.metadata;
            temp.tokenUri=nft.tokenUri;
            temp.selectedCat=nft.selectedCat;
            temp.status=nft.status;
            temp.chainId=nft.chainId;
            temp.relatedCollectionId=nft.relatedCollectionId;
            temp.featured=nft.featured;
            temp.isOnSell=nft.isOnSell;
            temp.likes=data.likes;
            mostLikeNft.push(temp)
          }
        })
      }
      setTimeout(()=>{
        mostLikeNft.sort(function(a, b) {
          return parseFloat(a.likes) - parseFloat(b.likes);
      });
        res.status(200).json({mostLikedNft:mostLikeNft,totalPage:totalPage});
      },3000)
    })
  })
})

routes.post("/price-range-nft",(req, res) => {
  let filterData=models.nftControllerModel.find({isOnSell:true,status:"active",price:{$gt:req.body.startPrice,$lt:req.body.endPrice}}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
  models.nftControllerModel.countDocuments({isOnSell:true,status:"active",price:{$gt:req.body.startPrice,$lt:req.body.endPrice}}, function(err, count) {
    let totalPage=Math.ceil(count/req.body.size);  
    filterData.exec(async(err,data)=>{
      if (err) throw err;
      if(data[0]==undefined || data[0]==null){
        res.status(200).json({message:"No NFT found in this Price range",totalPage:totalPage});
      }
      else{
        res.status(200).json({nft:data,totalPage:totalPage});
      }
    })
  })
})

routes.get("/oldest-nft",(req, res) => {
  let filterData=models.nftControllerModel.find({isOnSell:true,status:"active"}).limit(1).sort({$natural:1})
    filterData.exec(async(err,data)=>{
      if (err) throw err;
      if(data[0]==undefined || data[0]==null){
        res.status(200).json({message:"No NFT found"});
      }
      else{
        res.status(200).json({nft:data});
      }
  })
})

routes.get("/newest-nft",(req, res) => {
  let filterData=models.nftControllerModel.find({isOnSell:true,status:"active"}).limit(1).sort({$natural:-1});
    filterData.exec(async(err,data)=>{
      if (err) throw err;
      if(data[0]==undefined || data[0]==null){
        res.status(200).json({message:"No NFT found"});
      }
      else{
        res.status(200).json({nft:data});
      }
  })
})

routes.get("/count-nft",(req, res) => {
  models.nftControllerModel.countDocuments({}, function(err, count) {
    res.status(202).json(count)
  })
})

routes.post("/nft-pagination",(req, res) => {
  let limitedNft=models.nftControllerModel.find({}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
  models.nftControllerModel.countDocuments({}, function(err, count) {
    let totalPage=Math.ceil(count/req.body.size);
    limitedNft.exec((err,data)=>{
      if(err) throw err;
      if(data[0]!==undefined && data[0]!==null){
        res.status(202).json({nft:data,totalPage:totalPage})
      }
    })
  })
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

routes.post("/feature-nft",(req, res) => {
  models.nftControllerModel.countDocuments({featured: true}, function(err, documents) {
    if(documents==10 && req.body.isFeatured==true){
      res.status(202).json({message:"Feature nft limit exceed"})
    }
    else if(documents==3 && req.body.isFeatured==false){
      res.status(202).json({message:"Minimum 3 should be featured"})
    }
    else{
      let filterData=models.nftControllerModel.findOne({tokenId: req.body.tokenId});
      filterData.exec((err,data)=>{
        if (err) throw err;
        if(data!==undefined && data!==null){
          if(data.status=="active"){
            let updateNft= models.nftControllerModel.findOneAndUpdate({tokenId: req.body.tokenId},{
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
        let limitedNft=models.nftControllerModel.find({isOnSell:true,status:"active"}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
        models.nftControllerModel.countDocuments({isOnSell:true,status:"active"}, function(err, count) {
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
        let limitedNft=models.nftControllerModel.find({selectedCat:req.body.category,isOnSell:true,status:"active"}).skip((req.body.page-1)*req.body.size).limit(req.body.size);
        models.nftControllerModel.countDocuments({selectedCat:req.body.category,isOnSell:true,status:"active"}, function(err, count) {
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
 

routes.post("/add_slider",upload,(req,res)=>{
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

routes.post("/update_slider",upload,(req,res)=>{
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

routes.delete("/delete_slider/:id",upload,(req,res)=>{
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