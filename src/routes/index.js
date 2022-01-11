import models from "~/models";
const routes = require("express").Router();
const jwt=require("jsonwebtoken")
const multer = require("multer");
var cookieParser = require('cookie-parser')
const path=require("path");
var uuid = require('uuid');
const cloudinary=require('cloudinary');

// Keys For cloudinary
cloudinary.config({
  cloud_name: "dscolw4gq",
  api_key: "541579474534226",
  api_secret: "VrR4OzZXjU2NzrCnSx8mv8fRM2Q",
});

routes.use(cookieParser())

routes.get("/", (req, res) => {
  res.status(200).json({ message: "Connected!" });
});

routes
  .route("/profile")
  .post(async (req, res) => {
    try {
      const { body } = req;
      await models.userModel.create({
        ...body,
        address: body.address.toLowerCase(),
      });
      res.status(200).json("Successfully registered");
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

routes
  .route("/collection")
  .post(async (req, res) => {
    try {
      const { body } = req;
      const existingOne = await models.collectionModel.findOne({
        name: body.name,
      });
      if (existingOne) {
        throw new Error("Already Exist name");
      }
      await models.collectionModel.create({
        name: body.name,
        owner: body.owner?.toLowerCase(),
        nftAddress: body.nftAddress?.toLowerCase(),
        avatar: body.avatar,
        background: body.background,
        description: body.description,
        externalUrl: body.externalUrl,
        tokens: body.tokens || [],
      });
      res.status(200).json("Successfully created!");
    } catch (error) {
      console.log("[collection post] error => ", error);
      res.status(500).json({ message: error.toString() });
    }
  })
  .put(async (req, res) => {
    try {
      const { body } = req;
      console.log("aj : **** body => ", body);
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
      const existingOne = await models.collectionModel.findOneAndDelete({
        _id: body._id,
      });
      return res.status(200).json("Successfully deleted");
    } catch (error) {
      console.log("[collection delete] error => ", error);
    }
  });

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
    const collections = await models.collectionModel
      .find({ owner })
      .lean()
      .exec();
    console.log("aj : ***** collections => ", collections);
    res.status(200).json(collections);
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
      const tokens = collection.tokens
        ? [...collection.tokens, body.token]
        : [body.token];
      await models.collectionModel.updateOne({ name: body.name }, { tokens });
      res.status(200).json("success");
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

        // if (parseInt(body.views) === parseInt(obj.views)) {
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
  .catch((err)=>console.log(err))
})

routes.get("/nft-collector",(req, res) => {
  var nftdata=models.nftControllerModel.find();
  nftdata.exec()
  .then((data)=>{
    res.header( "Access-Control-Allow-Origin" );
    res.send(data);
  })
  .catch((err)=>console.log(err))
})

routes.post("/nft-collector",(req, res) => {
    let createNft=new models.nftControllerModel({
        tokenAddr: req.body.tokenAddr,
        tokenId: req.body.tokenId,
        price: req.body.price,
        metadata: {
            imageUrl:req.body.metadata.imageUrl,
            name:req.body.metadata.name,
            description:req.body.metadata.description,
            externalLink:req.body.metadata.externalLink
          },
        tokenUri:req.body.tokenUri
    })
    createNft.save(function(){
      res.send("done");
    });
})

console.log(path.join(__dirname,"../","../public/sliderimage/"))
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

routes.post("/upload_slider",upload,(req,res)=>{
  console.log(req.file);
    cloudinary.v2.uploader.upload(req.file.path,{folder: 'closedsea'},function(error, result){
      if (error) throw error;
        let uploadslider= models.uploadSliderModel.findOneAndUpdate({slider:req.body.slider},{
          link: req.body.link,
          imageUrl:result.url
        })
        uploadslider.exec((err)=>{
          if(err) throw err;
          console.log(`File uploaded successfully`)
          res.status(200).json({message:"Success"})
      })  
  });
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
module.exports = routes;