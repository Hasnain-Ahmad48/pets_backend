const path = require("path");
const sizeOf = require("image-size");

const shopModel = require("../../models/shop/shopModel");

const getTagsController = async (req, res) => {
  try {
    const result = await shopModel.getTagsModel();
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json(error);
  }
};

const createShopController = async (req, res) => {
  const {
    name,
    description,
    email,
    phone1,
    phone2,
    shopTags,
    phone3,
    statusForPublish,
    isFeatured,
    address1,
    address2,
    aboutWebsiteLink,
    facebook,
    google,
    instagram,
    youtube,
    pinterest,
    twitter,
    whatsappNumber,
    messenger,
    stripePublishableKey,
    stripeSecretKey,
    isEnabledStripe,
    paypalEnvironment,
    paypalMerchantId,
    paypalPublicKey,
    paypalPrivateKey,
    isEnabledPaypal,
    bankAccount,
    bankName,
    bankCode,
    branchCode,
    swiftCode,
    isEnabledBankTransfer,
    codEmail,
    isEnabledCod,
    razorKey,
    isEnabledRazor,
    currencySymbol,
    currencyShortForm,
    emailAccount,
    overallTax,
    shippingTax,
    refundPolicy,
    termsLabel,
    privacyPolicy,
    standard_shipping_enable,
    zone_shipping_enable,
    no_shipping_enable,
  } = req.body;

  const newShopTags = shopTags
  ? shopTags.split(",").map((tag) => tag.trim())
  : [];


  const shopCoverPhoto =
    req.files && req.files.shopCoverPhoto
      ? "shop/" + req.files.shopCoverPhoto[0].filename
      : null;
  const shopIconPhoto =
    req.files && req.files.shopIconPhoto
      ? "shop/" + req.files.shopIconPhoto[0].filename
      : null;

   

  try {
    let coverPhotoDimensions, iconPhotoDimensions;

    if (shopCoverPhoto) {
      const coverPhotoPath = path.join(
        __dirname,
        "../../public/",
        shopCoverPhoto
      );
      coverPhotoDimensions = sizeOf(coverPhotoPath);
      console.log(
        `Cover Photo Dimensions: ${coverPhotoDimensions.width}x${coverPhotoDimensions.height}`
      );
    }

    if (shopIconPhoto) {
      const iconPhotoPath = path.join(
        __dirname,
        "../../public/",
        shopIconPhoto
      );
      iconPhotoDimensions = sizeOf(iconPhotoPath);
      console.log(
        `Icon Photo Dimensions: ${iconPhotoDimensions.width}x${iconPhotoDimensions.height}`
      );
    }

    const result = await shopModel.createShopModel(
      name,
      phone1,
      description,
      phone2,
      newShopTags,
      phone3,
      statusForPublish,
      isFeatured,
      email,
      address1,
      address2,
      aboutWebsiteLink,
      facebook,
      google,
      instagram,
      youtube,
      pinterest,
      twitter,
      whatsappNumber,
      messenger,
      stripePublishableKey,
      stripeSecretKey,
      isEnabledStripe,
      paypalEnvironment,
      paypalMerchantId,
      paypalPublicKey,
      paypalPrivateKey,
      isEnabledPaypal,
      bankAccount,
      bankName,
      bankCode,
      branchCode,
      swiftCode,
      isEnabledBankTransfer,
      codEmail,
      isEnabledCod,
      razorKey,
      isEnabledRazor,
      currencySymbol,
      currencyShortForm,
      emailAccount,
      overallTax,
      shippingTax,
      refundPolicy,
      termsLabel,
      privacyPolicy,
      standard_shipping_enable,
      zone_shipping_enable,
      no_shipping_enable,
      shopCoverPhoto,
      shopIconPhoto,
      coverPhotoDimensions,
      iconPhotoDimensions
    );

    res.status(200).json({ message: "Shop Created Successfully", result });
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = { createShopController };

// get all shops controller
const getAllShopsController = async (req, res) => {
  try {
    const result = await shopModel.getAllShopModel();
    
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// get shop by id controller
const getShopByIdController = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await shopModel.getShopByIdModel(id);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// delete controller for shop
const deleteShopController = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await shopModel.deleteShopModel(id);
    res.status(200).json({ message: "Shop Deleted Successfully", result });
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = {
  createShopController,
  getAllShopsController,
  getTagsController,

  getShopByIdController,
  deleteShopController,
};
