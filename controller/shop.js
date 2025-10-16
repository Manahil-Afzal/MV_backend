const express = require("express");
const Path = require("path");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const {upload} = require("../multer");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendShopToken = require("../utils/shopToken");
const { isAuthenticated, isSeller } = require("../middleware/auth");



router.post("/create-shop", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password, address, phoneNumber, zipCode } = req.body;
   
    const sellerEmail = await Shop.findOne({ email });
    if (sellerEmail) {
      if (req.file) fs.unlinkSync(req.file.path);
      return next(new ErrorHandler("Shop already exists with this email", 400));
    }
    const fileUrl = req.file ? Path.join(req.file.filename) : "";
    const seller = {
      name,
      email,
      password,
      avatar: fileUrl,
      address,
      phoneNumber,
      zipCode,
    };

    // 3️⃣ Create activation token
    const activationToken = createActivationToken(seller);
    const activationUrl = `http://localhost:5173/seller/activation/${activationToken}`;

    // 4️⃣ Send activation email
    try {
      await sendMail({
        email: seller.email,
        subject: "Activate Your Shop",
        message: `Hello ${seller.name}, please click on the link to activate your shop: ${activationUrl}`,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email (${seller.email}) to activate your shop!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }

});
// create activation token
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });

};


// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );
     console.log(newSeller);

      if (!newSeller) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar, zipCode, address, phoneNumber } =
        newSeller;

      let seller = await Shop.findOne({ email });

      if (seller) {
        return next(new ErrorHandler("User already exists", 400));
      }

      seller = await Shop.create({
        name,
        email,
        avatar,
        password,
        zipCode,
        address,
        phoneNumber,
      });

      sendShopToken(seller, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);




//login user
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      const user = await Shop.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      sendShopToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }

  })
);



// load shop
router.get(
  "/get-seller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const shop = await Shop.findById(req.seller._id);
    if (!shop) return next(new ErrorHandler("Shop not found", 400));

    res.status(200).json({ success: true, shop });
  })
);


module.exports = router;



// const express = require("express");
// const Path = require("path");
// const router = express.Router();
// const fs = require("fs");
// const jwt = require("jsonwebtoken");
// const { upload } = require("../multer");
// const Shop = require("../model/shop");
// const ErrorHandler = require("../utils/ErrorHandler");
// const catchAsyncErrors = require("../middleware/catchAsyncErrors");
// const sendMail = require("../utils/sendMail");
// const sendShopToken = require("../utils/shopToken");
// const { isAuthenticated } = require("../middleware/auth");

// // -------------------- CREATE SHOP --------------------
// router.post("/create-shop", upload.single("file"), async (req, res, next) => {
//   try {
//     const { name, email, password, address, phoneNumber, zipCode } = req.body;

//     const existingShop = await Shop.findOne({ email });
//     if (existingShop) {
//       if (req.file) fs.unlinkSync(req.file.path);
//       return next(new ErrorHandler("Shop already exists with this email", 400));
//     }

//     const fileUrl = req.file ? { public_id: req.file.filename, url: `/uploads/${req.file.filename}` } : null;

//     const shop = {
//       name,
//       email,
//       password,
//       avatar: fileUrl,
//       address,
//       phoneNumber,
//       zipCode,
//     };

//     // 1️⃣ Create activation token
//     const activationToken = createActivationToken(shop);
//     const activationUrl = `http://localhost:5173/seller/activation/${activationToken}`;

//     // 2️⃣ Send activation email
//     try {
//       await sendMail({
//         email: shop.email,
//         subject: "Activate Your Shop",
//         message: `Hello ${shop.name}, please click on the link to activate your shop: ${activationUrl}`,
//       });

//       res.status(201).json({
//         success: true,
//         message: `Please check your email (${shop.email}) to activate your shop!`,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }

//     // 3️⃣ Save shop to DB
//     const newShop = new Shop(shop);
//     await newShop.save();

//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// });

// // -------------------- CREATE ACTIVATION TOKEN --------------------
// const createActivationToken = (shop) => {
//   return jwt.sign(shop, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
// };

// // -------------------- ACTIVATE SHOP --------------------
// router.post(
//   "/activation",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { activation_token } = req.body;
//       const shopData = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);

//       if (!shopData) return next(new ErrorHandler("Invalid token", 400));

//       const { name, email, password, avatar, address, phoneNumber, zipCode } = shopData;

//       let shop = await Shop.findOne({ email });
//       if (shop) return next(new ErrorHandler("Shop already exists", 400));

//       shop = await Shop.create({ name, email, password, avatar, address, phoneNumber, zipCode });

//       sendShopToken(shop, 201, res);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // -------------------- LOGIN SHOP --------------------
// router.post(
//   "/login-shop",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email, password } = req.body;

//       if (!email || !password) return next(new ErrorHandler("Please provide all fields!", 400));

//       const shop = await Shop.findOne({ email }).select("+password");
//       if (!shop) return next(new ErrorHandler("Shop doesn't exist!", 400));

//       const isPasswordValid = await shop.comparePassword(password);
//       if (!isPasswordValid) return next(new ErrorHandler("Incorrect credentials", 400));

//       sendShopToken(shop, 201, res);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // -------------------- GET SHOP PROFILE --------------------
// router.get(
//   "/get-shop",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     const shop = await Shop.findById(req.user.id);
//     if (!shop) return next(new ErrorHandler("Shop not found", 400));

//     res.status(200).json({ success: true, shop });
//   })
// );

// // -------------------- LOGOUT SHOP --------------------
// router.get(
//   "/logout",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });
//     res.status(200).json({ success: true, message: "Logout successful!" });
//   })
// );

// module.exports = router;
