require("dotenv").config();
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

const bodyParser = require("body-parser");
const routes = require("./routes");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());
app.use("/", routes);

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is Ready on ${process.env.PORT || 4000} PORT`);
  mongoose.connect('mongodb+srv://adilghani:Allah150n30nly0n3@cluster0.akgrw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/closedseabackend', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log(`MongoDB connected`);
  });
});
