"use strict";

var _cors = _interopRequireDefault(require("cors"));

var _express = _interopRequireDefault(require("express"));

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require("dotenv").config();

const bodyParser = require("body-parser");

const routes = require("./routes");

const app = (0, _express.default)();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(_express.default.json());
app.use((0, _cors.default)());
app.use("/", routes);
app.listen(process.env.PORT || 6000, () => {
  console.log(`Server is Ready on ${process.env.PORT || 4000} PORT`);

  _mongoose.default.connect('mongodb://127.0.0.1:27017/closeadsea', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log(`MongoDB connected Successfully`);
  }); // mongoose.connect('mongodb+srv://closedsea_user:UQVwYPgpy5ZEZKll@cluster0.voxu3.mongodb.net/closedsea?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
  //   console.log(`MongoDB connected Successfully`);
  // });

});
//# sourceMappingURL=index.js.map