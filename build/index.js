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
app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is Ready on ${process.env.PORT || 4000} PORT`);

  _mongoose.default.connect('mongodb+srv://adilghani:Allah150n30nly0n3@cluster0.akgrw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/Allah150n30nly0n3', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log(`MongoDB connected`);
  });
});
//# sourceMappingURL=index.js.map