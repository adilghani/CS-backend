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
  following:Array,
  isVerified:{type:Boolean,default:false}
},{timestamps: true});

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
  },
  isVerified:{type:Boolean,default:false}
},{timestamps: true});

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
},{timestamps: true});

const nftControllerSchema = new mongoose.Schema({
  tokenAddr: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true,
    unique:true
  },
  price: {
    type: Number
  },
  owner: {
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
  status:String,
  featured:{type:Boolean,default:false},
  chainId:String,
  relatedCollectionId:String,
  isOnSell:{type:Boolean,default:false}
},{timestamps: true});

const adminRegiterSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  }
},{timestamps: true});

const uploadSliderSchema = new mongoose.Schema({
  slider:String,
  imageUrl: {
    type: String,
    required: true
  },
  link:String
},{timestamps: true});

const uploadfeatureSchema = new mongoose.Schema({
  collection_name:String,
  imageUrl: {
    type: String,
    required: true
  },
  link:String
},{timestamps: true});
const userModel = mongoose.model('user', userSchema);
const collectionModel = mongoose.model('collection', collectionSchema);
const viewAndLikeModel = mongoose.model('viewAndLike', viewAndLikeSchema);
const nftControllerModel = mongoose.model('nftController', nftControllerSchema);
const adminRegisterModel = mongoose.model('Admins', adminRegiterSchema);
const uploadSliderModel = mongoose.model('slider', uploadSliderSchema);
const uploadfeaturemodel = mongoose.model('featurecollection', uploadfeatureSchema);

const models = {
  userModel,
  collectionModel,
  viewAndLikeModel,
  nftControllerModel,
  adminRegisterModel,
  uploadSliderModel,
  uploadfeaturemodel
};

export default models;
