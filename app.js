const express = require ("express");
// const ErrorHandler = require("./utils/ErrorHandler");
const app = express();
const cookieParser = require ("cookie-parser");
const bodyParser = require ("body-parser");
const errorMiddleware = require("./middleware/error");
const cors = require("cors");


app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true, limit:"50mb"}));


//config 
if(process.env.NODE_ENV !== "PRODUCTION" ){
    require("dotenv").config({
        path:"config/.env",
    });
}


// imports routes
const user = require("./controller/user");
const  shop = require("./controller/shop");

// app.use(cors({
//   origin: "http://localhost:5173", 
//   credentials: true
// }));


app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);


app.use(errorMiddleware);
// app.use(ErrorHandler);
module.exports = app;