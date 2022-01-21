import mongoose from 'mongoose';
// mongoose.connect('mongodb://localhost:27017/default', {useNewUrlParser: true, useUnifiedTopology: true});
import { timeStamp } from '~/utils/helpers';

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  userName: {
    type: String,
  },
  description: {
    type: String
  },
  avatar: {
    type: String
  },
  background: {
    type: String
  },
  twitter: {
    type: String
  },
  facebook: {
    type: String
  },
  instagram: {
    type: String
  },
  
  follower:Array,
  following:Array
});

userSchema.plugin(timeStamp);

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
  },
  background: {
    type: String
  },
  owner: {
    type: String,
    required: true
  },
  nftAddress: {
    type: String
  },
  description: {
    type: String
  },
  externalUrl: {
    type: String
  },
  tokens: {
    type: Array
  }
});

const viewAndLikeSchema = new mongoose.Schema({
  tokenAddr: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true
  },
  views: {
    type: Number
  },
  likes: {
    type: Number
  },
  viewedAddresses: [String],
  likedAccounts: {
    type: [String]
  }
});

const nftControllerSchema = new mongoose.Schema({
  tokenAddr: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true
  },
  price: {
    type: String
  },
  metadata: {
    imageUrl:String,
    name:String,
    description:String,
    externalLink:String
  },
  tokenUri:String,
  selectedCat:String,
  status:String
});

const adminRegiterSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  }
});

const uploadSliderSchema = new mongoose.Schema({
  slider:String,
  imageUrl: {
    type: String,
    required: true
  },
  link:String
});

const userModel = mongoose.model('user', userSchema);
const collectionModel = mongoose.model('collection', collectionSchema);
const viewAndLikeModel = mongoose.model('viewAndLike', viewAndLikeSchema);
const nftControllerModel = mongoose.model('nftController', nftControllerSchema);
const adminRegisterModel = mongoose.model('Admins', adminRegiterSchema);
const uploadSliderModel = mongoose.model('slider', uploadSliderSchema);

const models = {
  userModel,
  collectionModel,
  viewAndLikeModel,
  nftControllerModel,
  adminRegisterModel,
  uploadSliderModel
};

export default models;
