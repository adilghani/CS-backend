"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

var _helpers = require("../utils/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// mongoose.connect('mongodb://localhost:27017/default', {useNewUrlParser: true, useUnifiedTopology: true});
const userSchema = new _mongoose.default.Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  userName: {
    type: String
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
  follower: Array,
  following: Array
});
userSchema.plugin(_helpers.timeStamp);
const collectionSchema = new _mongoose.default.Schema({
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String
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
const viewAndLikeSchema = new _mongoose.default.Schema({
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
const nftControllerSchema = new _mongoose.default.Schema({
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
    imageUrl: String,
    name: String,
    description: String,
    externalLink: String
  },
  tokenUri: String
});
const adminRegiterSchema = new _mongoose.default.Schema({
  walletAddress: {
    type: String,
    required: true
  }
});
const uploadSliderSchema = new _mongoose.default.Schema({
  slider: String,
  imageUrl: {
    type: String,
    required: true
  },
  link: String
});

const userModel = _mongoose.default.model('user', userSchema);

const collectionModel = _mongoose.default.model('collection', collectionSchema);

const viewAndLikeModel = _mongoose.default.model('viewAndLike', viewAndLikeSchema);

const nftControllerModel = _mongoose.default.model('nftController', nftControllerSchema);

const adminRegisterModel = _mongoose.default.model('Admins', adminRegiterSchema);

const uploadSliderModel = _mongoose.default.model('slider', uploadSliderSchema);

const models = {
  userModel,
  collectionModel,
  viewAndLikeModel,
  nftControllerModel,
  adminRegisterModel,
  uploadSliderModel
};
var _default = models;
exports.default = _default;
//# sourceMappingURL=index.js.map