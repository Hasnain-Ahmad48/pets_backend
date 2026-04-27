var express = require("express");
var bodyParser = require("body-parser");
var dotenv = require("dotenv");
var pageRoutes = require("./routes/PageRoutes/pageRoutes.js");
var roleRoutes = require("./routes/Roles/RoleRoutes.js");
var permissionRoutes = require("./routes/Permission/PermissionRoutes.js");
var UserDetailsRoutes = require("./routes/User/UserDetailsRoutes.js");
var ArticleCategoryRoutes = require("./routes/CategoryRoute/ArticlesCategoryRoutes.js");
var cors = require("cors");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var categoryArticleRoute = require("./routes/CategoryRoute/CategoryArticleRoutes.js");
var breedsCategory = require("./routes/BreedRoutes/BreedCategory.js");
var authUserRoutes = require("./routes/AuthUserRoutes/authUserRoutes.js");
var AdvertisementRoutes = require("./routes/Advertisement/AdvertisementRoutes.js");
var sliderRoutes = require("./routes/Slider/sliderRoutes.js");
var privacyAndTermRoutes = require("./routes/PrivacyRoutes/privacyRoutes.js");
var contactUsRoutes = require("./routes/contactUsRoutes/contactUsRoutes.js");
var shopRoutes = require("./routes/shop/shopRoutes.js");
var mkProductCategoryRoutes = require("./routes/mk_product_category/mkProductCategoryRoutes.js");
var mkProductRoutes = require("./routes/mk_product/mkProductRoutes.js");
var shelterRoutes = require("./routes/shelters/sheltersRoute.js");
var petRoutes = require("./routes/Pets/petRoutes.js");
var brandRoutes = require("./routes/Brand/brandRoutes");
var mkProductReviewRoutes = require("./routes/mk_product_reviews/productReviewRoutes.js");
var recommendationRoutes = require("./routes/recommendation/recommendationRoutes.js");
var videosRoutes = require("./routes/Videos/videosRoutes.js");
var tagsRoutes = require("./routes/tagsRoutes/tagsRoutes.js")

dotenv.config({path: "./config/Config.env"});

var app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

// app.use(cors());

// const allowedOrigins = [
//     'https://www.wowpetspalace.com',
//     'https://wowpetspalace.com',
//     'http://localhost:5173'
// ];
// app.use(cors({
//     origin: function (origin, callback) {
//         // Allow both versions of the domain or no origin (for internal requests)
//         if (allowedOrigins.includes(origin) || !origin) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'OPTIONS'],
//     allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
// }));

app.use(cookieParser());

app.use(
  session({
    secret: "HJSDHDSLDLSDJSL",
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false},
  }),
);

// var prerender = require('prerender-node');
// prerender.set('prerenderToken', 'YOUR_PRERENDER_TOKEN');
// app.use(prerender);

app.use(express.static("public"));

app.use("/test/pages", pageRoutes);
app.use("/test/role", roleRoutes);
app.use("/test/permission", permissionRoutes);
app.use("/test/users", UserDetailsRoutes);
app.use("/test/article", ArticleCategoryRoutes);
app.use("/test/categoryarticle", categoryArticleRoute);
app.use("/test/breed", breedsCategory);
app.use("/test/slider", sliderRoutes);
app.use("/test/privacyAndTermRoutes", privacyAndTermRoutes);
app.use("/test/contact", contactUsRoutes);
app.use("/test/shelters", shelterRoutes);
// User Routes
app.use("/test/authUser", authUserRoutes);
app.use("/test/advertisment", AdvertisementRoutes);
app.use("/test/shop", shopRoutes);
app.use("/test/subCategory", mkProductCategoryRoutes);
app.use("/test/product", mkProductRoutes);
app.use("/test/pets", petRoutes);
app.use("/test/brands", brandRoutes);

app.use("/test/reviews", mkProductReviewRoutes);
app.use("/test/recommendation", recommendationRoutes);
app.use("/test/video", videosRoutes);
app.use("/test/tags", tagsRoutes);

// app.use("/pages", pageRoutes);
// app.use("/role", roleRoutes);
// app.use("/permission", permissionRoutes);
// app.use("/users", UserDetailsRoutes);
// app.use("/article", ArticleCategoryRoutes);
// app.use("/categoryarticle", categoryArticleRoute);
// app.use("/breed", breedsCategory);

// app.use("/slider", sliderRoutes);
// app.use("/privacyAndTermRoutes", privacyAndTermRoutes);
// app.use("/contact", contactUsRoutes);

// // User Routes
// app.use("/authUser", authUserRoutes);
// app.use("/advertisement", AdvertisementRoutes);
// app.use("/shop", shopRoutes);
// app.use("/subCategory", mkProductCategoryRoutes);
// app.use("/product", mkProductRoutes);

app.listen(process.env.PORT, function () {
  console.log("Server is Running on PORT " + process.env.PORT);
});
