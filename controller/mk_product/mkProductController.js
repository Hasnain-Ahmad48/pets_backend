const mkProductModel = require("../../models/mk_product/mkProductModel");
const slugify = require("slugify");
const shopModel = require("../../models/shop/shopModel");
const authUserModel = require("../../models/AuthUser/authUserModel")
const reviewModel = require("../../models/mk_product_reviews/productReviewModel")
const nodemailer = require('nodemailer');
const logTransaction = require('../../middleware/logTransaction');
const db = require("../../config/DatabaseConnection");
const  logTransactionResponse  = require("../../middleware/logTrasactionResponse");
const BreedsModel = require("../../models/Breeds/BreedsModel.js");

const mkProductController = async (req, res) => {
  const {
    shop_id,
    cat_id,
    sub_cat_id,
    name,
    description,
    original_price,
    search_tag,
    highlight_information,
    is_featured,
    is_available,
    code,
    status,
    added_user_id,
    shipping_cost,
    minimum_order,
    product_unit,
    product_measurement,
    colors,
    shopTags,
    brand_id
  } = req.body;

  const newProductTags = shopTags.split(",").map((tag) => tag.trim());
  console.log("newShopTags", newProductTags);

  // Handle file uploads
  const imageFiles = req.files.images || [];
  const featuredImageFile = req.files.featuredImage
    ? req.files.featuredImage[0]
    : null;
  const featuredImage = featuredImageFile
    ? "product/" + featuredImageFile.filename
    : null;

  const imagePaths = imageFiles.map((file) => `product/${file.filename}`);

  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
  });
  let slug = baseSlug;
  let slugExists = await mkProductModel.checkSlugExists(slug);
  let slugCounter = 1;

  // If slug exists, append a counter to it until a unique slug is found
  while (slugExists) {
    slug = `${baseSlug}-${slugCounter}`;
    slugExists = await mkProductModel.checkSlugExists(slug);
    slugCounter++;
  }

  try {
    const result = await mkProductModel.mkProductModel(
      shop_id,
      cat_id,
      sub_cat_id,
      slug,
      name,
      description,
      original_price,
      search_tag,
      highlight_information,
      is_featured,
      is_available,
      code,
      status,
      added_user_id,
      shipping_cost,
      minimum_order,
      product_unit,
      product_measurement,
      colors,
      imagePaths, // Pass image paths to the model
      featuredImage, // Pass featured image path to the model
     newProductTags,
     brand_id
    );
    res.status(200).json({ message: "Product created successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

const searchProductsAndBreeds = async  (req, res) => {
 try {
    const query = req.query.query || "";
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.json({ products: [], breeds: [] });
    }

    const [products, breeds] = await Promise.all([
      mkProductModel.searchProducts(query, limit),
      BreedsModel.searchBreeds(query, limit),
    ]);

    res.json({ products, breeds });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err });
  }
};

// get all products controller

// const getAllProducts = (req, res) => {
//   const { page } = req.params;
//   try {
//     const limit = parseInt(req.query.limit) || 20;
//     mkProductModel.getAllProductsPagination(page, limit, (err, data, total) => {
//       if (err) {
//         return res.status(500).json({ message: err.message });
//       } else {
//         const totalPages = Math.ceil(total / limit);
//         res.json({
//           data,
//           total,
//           totalPages,
//           currentPage: parseInt(page)
//         });
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const getAllProducts = (req, res) => {
  const { page } = req.params;
  try {
    const limit = parseInt(req.query.limit) || 20;

    // ✅ brands and tags are arrays directly from query (e.g., ?brands[]=Nike&brands[]=Adidas)
    const {
      cat_id,
      sub_cat_id,
      slug,
      name,
      original_price,
      brands,      // array
      search_tag,   // array
    min_price,
    max_price
        
    } = req.query;


    mkProductModel.getAllProductsPagination(
      page,
      limit,
      {
        cat_id,
        sub_cat_id,
        slug,
        name,
        original_price,
        brands: Array.isArray(brands) ? brands : [],
        search_tag: Array.isArray(search_tag) ? search_tag : [],
        min_price,
        max_price
      },
      (err, data, total) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        } else {
          const totalPages = Math.ceil(total / limit);
          res.json({
            data,
            total,
            totalPages,
            currentPage: parseInt(page)
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductReviews = async  (req, res) => {
    try {
    const { product_id, user_id, page, limit } = req.query;

    const result = await reviewModel.getReviews(product_id, user_id, page, limit );

    res.status(200).json({
      message: 'Reviews fetched successfully',
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err });
  }
};

const addOrUpdateOrderReview = async (req, res) => {
  try {

    const user_id = req.user.id;
    const { order_id, rating, review } = req.body;

    if (!order_id || !user_id || !rating) {
      return res.status(400).json({ message: "order_id, user_id, rating are required" });
    }

    // Step 1: Verify transaction belongs to user and is delivered
    const verify = await reviewModel.verifyOrder(order_id, user_id);

    if (!verify) {
      return res.status(400).json({
        message: "Order not found, not delivered, or does not belong to this user"
      });
    }

    // Step 2: Insert or Update review
    const result = await reviewModel.addOrUpdateReview( order_id, user_id, rating, review );

    return res.status(200).json({
      message: result.action === "update"
        ? "Review updated successfully"
        : "Review added successfully",
      data: result.data
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};

const addOrUpdateProductReview = async (req, res) => {
  try {

   const user_id = req.user.id;
    const { order_id,product_id,rating, review } = req.body;

    if (!order_id || !product_id|| !user_id || !rating) {
      return res.status(400).json({ message: "order_id,product_id, user_id, rating are required" });
    }

    // Step 1: Verify transaction belongs to user and is delivered
    const verify = await reviewModel.verifyOrder(order_id, user_id);

    if (!verify) {
      return res.status(400).json({
        message: "Order not found, not delivered, or does not belong to this user"
      });
    }

    // Step 2: Insert or Update review
    const result = await reviewModel.addOrUpdateProductReview( order_id, user_id,product_id, rating, review );

    return res.status(200).json({
      message: result.action === "update"
        ? "Review updated successfully"
        : "Review added successfully",
      data: result.data
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};


const getAllProductsController = async (req, res) => {
  try {
    const result = await mkProductModel.getAllProducts();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
// const getAllFilterProductsController = async (req, res) => {
//   const id = req.params.id
//   console.log(id,"check controller")
//   const {slug} = req.body
//   console.log(slug,"chck slug")
//   try {
//     const result = await mkProductModel.getFilterProducts(id,slug);
//     res.status(200).json({ result });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };
const getAllFilterProductsController = async (req, res) => {
  const { slug } = req.params;  // Fetch slug from req.params

  try {
    const result = await mkProductModel.getFilterProducts(slug);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getProductsSubCategory = async (req, res) => {
  const { subCategory } = req.params;  // Fetch slug from req.params

  try {
    const result = await mkProductModel.getProductsSubCategory(subCategory);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
const getAllFilterPriceProductsController = async (req, res) => {
  const {fromPrice,toPrice,slug} = req.body;
 
  console.log(req.body,"check controller")

 
   

  try {
    const result = await mkProductModel.getFilterPriceProducts(fromPrice,toPrice,slug);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};



const getAllProductsbyShopId = async (req, res) => {
  const shop_id = req.params.shop_id;
  try {
    const result = await mkProductModel.getAllProductsByShopId(shop_id);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getProductByIdController = async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await mkProductModel.getProductById(productId);
    res.status(200).json({ result: product });
  } catch (error) {
    console.error("Error in getProductByIdController:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      shop_id,
      cat_id,
      sub_cat_id,
      name,
      description,
      original_price,
      search_tag,
      highlight_information,
      is_featured,
      is_available,
      code,
      status,
      added_user_id,
      shipping_cost,
      minimum_order,
      product_unit,
      product_measurement,
      colors,
    } = req.body;
    const imageFiles = req.files.images || [];
    const featuredImageFile = req.files.featuredImage
      ? req.files.featuredImage[0]
      : null;
    const featuredImage = featuredImageFile
      ? "product/" + featuredImageFile.filename
      : null;

    const imagePaths = imageFiles.map((file) => `product/${file.filename}`);
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
    });
    let slug = baseSlug;
    let slugExists = await mkProductModel.checkSlugExists(slug);
    let slugCounter = 1;

    // If slug exists, append a counter to it until a unique slug is found
    while (slugExists) {
      slug = `${baseSlug}-${slugCounter}`;
      slugExists = await mkProductModel.checkSlugExists(slug);
      slugCounter++;
    }
    const result = await mkProductModel.updateProductById(
      id,
      shop_id,
      cat_id,
      sub_cat_id,
      slug,
      name,
      description,
      original_price,
      search_tag,
      highlight_information,
      is_featured,
      is_available,
      code,
      status,
      added_user_id,
      shipping_cost,
      minimum_order,
      product_unit,
      product_measurement,
      colors,
      imagePaths,
      featuredImage
    );

    console.log("result controller ", result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Failed to update product", error });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mkProductModel.deleteProductById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Failed to delete product", error });
  }
};

const getAllFeaturedProductsController = async (req, res) => {
  try {
    const result = await mkProductModel.getAllFeaturedProducts();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getProductImageController = async (req, res) => {
  const productId = req.params.id; // Assuming the product ID is passed as a route parameter
  console.log("check produt id", productId);

  try {
    const images = await mkProductModel.getProductImages(productId);
    res.status(200).json({ images });
  } catch (error) {
    res.status(404).json({ message: "Error retrieving product images", error });
  }
};

const deleteProductImageController = async (req, res) => {
  const id = req.params.id; // Assuming the product ID is passed as a route parameter
  console.log("check product delete id", id);

  try {
    const images = await mkProductModel.deleteProductImages(id);
    res.status(200).json({ images });
  } catch (error) {
    res.status(404).json({ message: "Error retrieving product images", error });
  }
};

const getProductBySlugController = async (req, res) => {
  const slug = req.params.slug;

  try {
    const product = await mkProductModel.getProductBySlug(slug);
    res.status(200).json({ result: product });
  } catch (error) {
    console.error("Error in getProductByIdController:", error);
    res.status(500).json({ message: error.message });
  }
};


const transporter = nodemailer.createTransport({
  host: 'wowpetspalace.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'sales@wowpetspalace.com',
    pass: 'buRK!D6DbsZf'
  }
});

// Function to send email
const sendEmail = async (to, subject, htmlContent, textContent) => {
  console.log(`Attempting to send email to ${to} with subject: ${subject}`);
  try {
    const info = await transporter.sendMail({
      from: '"WowPetsPalace" <sales@wowpetspalace.com>',
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    console.log('Full info:', JSON.stringify(info, null, 2));
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
  }
}


 const generateRandomId = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "ord_";
    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters[randomIndex];
    }
    return id;
  };
  
  
  
  
// create payment intent

 const createPaymentIntent = async (req, res, next) => {
   
    // const user_id = req.user.id;
    // const user_id = 8;
    // const currency = "eur";
    // const paymentMethodType ="card";
     const user_id = req.user.id;
      const {
    shipping_cost = 0, 
    paymentMethodType,
    currency,
    items
  } = req.body;
  
  try{
   
   
                            const balance_amount = 0;
                            let totalPrice = 0;
                            let totalPriceWithOutDiscount=0;
                            let totalShipping = 0;
                            let totalDiscount = 0;
                            let totalQuantity=0;
                            const resultItems = [];

                        if (!Array.isArray(items)) {
                          return res.status(400).json({ error: "Items should be an array." });
                        }
                        
                         for (const product of items) {
                          try {
                            // Fetch product details by ID
                            const pro = await mkProductModel.getProductById(product.id);
                        
                        totalPriceWithOutDiscount += pro.original_price*product.quantity;
                            // Extract necessary fields from the product
                            const proPrice = pro.original_price;
                         
                            const discountPercentage = pro.discountPercentage || 0;
                        
                            // Calculate discounted price
                            let discountedPrice;
                            let discount_on_item=0;
                            
                            if (!isNaN(discountPercentage) && discountPercentage > 0) {
                              discountedPrice = proPrice - (proPrice * discountPercentage / 100);
                            } else {
                              discountedPrice = proPrice;
                            }
                        
                            // Update total price and shipping based on quantity
                            totalPrice += discountedPrice * product.quantity;
                            totalShipping += pro.shipping_cost * product.quantity;
                            
                            
                            // Calculate total discount if applicable
                            if (discountPercentage > 0) {
                              totalDiscount += (proPrice - discountedPrice) * product.quantity;
                              
                              discount_on_item=proPrice - discountedPrice;
                              
                            }
                            
                            totalQuantity +=product.quantity;
                            
                             // Add price, quantity, and ID to the result array
                                resultItems.push({
                                  shop_id: product.shop_id,
                                  product_id: product.id,
                                  product_name:pro.name,
                                  original_price:proPrice,
                                  price:proPrice*product.quantity,
                                  discount_amount:discountedPrice *product.quantity,
                                  qty:product.quantity,
                                  discount_value:discount_on_item,
                                  discount_percentage:discountPercentage,
                                  product_unit:pro.product_measurement,
                                  shipping_cost:pro.shipping_cost * product.quantity
                                });

                        
                          } catch (error) {
                          
                            console.error(`Error fetching product with ID ${product.id}:`, error);
                            // Optionally, handle the error (e.g., continue, break, or return an error response)
                            // For example, you might skip this product and continue with others:
                            continue;
                          }
                        }

    const total_item_amount_with_shipping = totalPrice + totalShipping;
   
   /////////////// for later to show wallet etc
    // const customer = await stripe.customers.create();
    
    //  const ephemeralKey = await stripe.ephemeralKeys.create(
    //         { customer: customer.id },
    //         { apiVersion: '2022-11-15' } // Use the API version you're using on mobile
    //     );
////////////////////////////////        
   const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_item_amount_with_shipping * 100),
      currency: currency || "usd",
      payment_method_types: [paymentMethodType || "card"],
      metadata: { user_id },
    });
    
      // Log transaction
        //   await logTransaction({
        //     "0",
        //     user_id,
        //     amount:total_item_amount_with_shipping,
        //     currency,
        //     payment_method: paymentMethodType,
        //     payment_status: paymentIntent.status,
        //     transaction_date: new Date(),
        //     gateway_response: paymentIntent.id,
        //   });
          
    if (!paymentIntent) {
      return res.status(400).json({ message: "Payment intent creation failed" });
    }
    
    
        res.status(200).json({
      message: "Order initialized successfully",
      id: paymentIntent.id,
      order_no:0,
      client_secret: paymentIntent.client_secret,
    });   
  }
  
  catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ message: "Order creation failed", error: error.message });
  }
   
    
  };
  
  // Order prodcut controller
const placeOrder = async (req, res, next) => {
  
   const user_id = req.user.id;
  const {
    billingDetails,
    shippingDetails,
    shop_id,
    name,
    shipping_cost = 0, 
    paymentMethodType,
    currency,
    items
  } = req.body;

     const {
    firstName: billing_first_name,
    lastName: billing_last_name,
    company: billing_company,
    country: billing_country,
    address1: billing_address_1,
    address2: billing_address_2,
    city: billing_city,
    state: billing_state,
    zipCode: billing_postal_code,
    phone: billing_phone,
    email: billing_email
  } = billingDetails;

  const {
    firstName: shipping_first_name,
    lastName: shipping_last_name,
    company: shipping_company,
    country: shipping_country,
    address1: shipping_address_1,
    address2: shipping_address_2,
    city: shipping_city,
    state: shipping_state,
    zipCode: shipping_postal_code,
    phone: shipping_phone,
    email: shipping_email
  } = shippingDetails;

                        try
                        {
                              
                              
                              const shopdetails = await shopModel.getShopByIdModel(shop_id);
                              
                            
                            const balance_amount = 0;
                            let totalPrice = 0;
                            let totalPriceWithOutDiscount=0;
                            let totalShipping = 0;
                            let totalDiscount = 0;
                            let totalQuantity=0;
                            const resultItems = [];

                        if (!Array.isArray(items)) {
                          return res.status(400).json({ error: "Items should be an array." });
                        }
  
                        const order_no = generateRandomId();                      
                        
                        
                        for (const product of items) {
                          try {
                            // Fetch product details by ID
                            const pro = await mkProductModel.getProductById(product.id);
                        
                        totalPriceWithOutDiscount += pro.original_price*product.quantity;
                            // Extract necessary fields from the product
                            const proPrice = pro.original_price;
                         
                            const discountPercentage = pro.discountPercentage || 0;
                        
                            // Calculate discounted price
                            let discountedPrice;
                            let discount_on_item=0;
                            
                            if (!isNaN(discountPercentage) && discountPercentage > 0) {
                              discountedPrice = proPrice - (proPrice * discountPercentage / 100);
                            } else {
                              discountedPrice = proPrice;
                            }
                        
                            // Update total price and shipping based on quantity
                            totalPrice += discountedPrice * product.quantity;
                            totalShipping += pro.shipping_cost * product.quantity;
                            
                            
                            // Calculate total discount if applicable
                            if (discountPercentage > 0) {
                              totalDiscount += (proPrice - discountedPrice) * product.quantity;
                              
                              discount_on_item=proPrice - discountedPrice;
                              
                            }
                            
                            totalQuantity +=product.quantity;
                            
                             // Add price, quantity, and ID to the result array
                                resultItems.push({
                                  shop_id: product.shop_id,
                                  product_id: product.id,
                                  product_name:pro.name,
                                  original_price:proPrice,
                                  price:proPrice*product.quantity,
                                  discount_amount:discountedPrice *product.quantity,
                                  qty:product.quantity,
                                  discount_value:discount_on_item,
                                  discount_percentage:discountPercentage,
                                  product_unit:pro.product_measurement,
                                  shipping_cost:pro.shipping_cost * product.quantity
                                });

                        
                          } catch (error) {
                          
                            console.error(`Error fetching product with ID ${product.id}:`, error);
                            // Optionally, handle the error (e.g., continue, break, or return an error response)
                            // For example, you might skip this product and continue with others:
                            continue;
                          }
                        }


// return res.status(400).json({ message: totalPrice +" "+totalShipping +" "+totalDiscount});
 

  
    
    // const shippingCost = parseFloat(shipping_cost_);
    // const sub_total_amount = pricePerUnit * quantity;
    const total_item_amount_with_shipping = totalPrice + totalShipping;

    const { currency_symbol, currency_short_form } = shopdetails[0];
    //const original_price = pricePerUnit;
    
    
 
  const contact_name = `${shipping_first_name} ${shipping_last_name}`;
  const contact_phone = shipping_phone;
  const payment_method = paymentMethodType;
  const added_user_id = user_id;
  const trans_status_id = 1;
    
    // Use Promises for transaction handling
    await new Promise(async (resolve, reject) => {
      db.beginTransaction(async (err) => {
        if (err) return reject(err);

        try {
        
         // Create order
      const result = await mkProductModel.createOrderModel(
          order_no,
        user_id,
        shop_id,
        totalPrice, // total amount
        totalDiscount, // total discount on order
        0,
        0,
        0,
        totalShipping,
        0,
        0,
        "Default",
        balance_amount,
        total_item_amount_with_shipping, // total with shipping
        totalQuantity,
        contact_name,
        contact_phone,
        payment_method,
        added_user_id,
        trans_status_id,
        currency_symbol,
        currency_short_form,
        billing_first_name,
        billing_last_name,
        billing_company,
        billing_address_1,
        billing_address_2,
        billing_country,
        billing_state,
        billing_city,
        billing_postal_code,
        billing_email,
        billing_phone,
        shipping_first_name,
        shipping_last_name,
        shipping_company,
        shipping_address_1,
        shipping_address_2,
        shipping_country,
        shipping_state,
        shipping_city,
        shipping_postal_code,
        shipping_email,
        shipping_phone,
        resultItems
      );

          const order_id = result.insertId;

           // Log transaction
        //   await logTransaction({
        //     order_id,
        //     user_id,
        //     amount:total_item_amount_with_shipping,
        //     currency,
        //     payment_method: paymentMethodType,
        //     payment_status: paymentIntent.status,
        //     transaction_date: new Date(),
        //     gateway_response: paymentIntent.id,
        //   });

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => reject(commitErr));
            }
            resolve(order_id);
          });
        } catch (transactionError) {
          db.rollback(() => reject(transactionError));
        }
      });
    });
    
    const currentDate = new Date();
    const rows = resultItems.map((service, index) => 
    
    `
<tr style="background-color:#f9f9f9;">
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">${service.product_name}</td>
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">${service.qty}</td>
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${service.original_price.toFixed(2)}</td>
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${service.price.toFixed(2)}</td>
</tr>
    `).join('');
    
    // Send emails after successful transaction
    const user = await authUserModel.getAllAppUsersById(user_id);
    const { email: user_email, firstName, lastName } = user[0];
    const { email: shop_email } = shopdetails[0];

//     await sendEmail(
//       user_email,
//       "Order Confirmation",
//       `<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
// <head>
// <title></title>
// <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
// <meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
// <style>
// 		* {
// 			box-sizing: border-box;
// 		}

// 		body {
// 			margin: 0;
// 			padding: 0;
// 		}

// 		a[x-apple-data-detectors] {
// 			color: inherit !important;
// 			text-decoration: inherit !important;
// 		}

// 		#MessageViewBody a {
// 			color: inherit;
// 			text-decoration: none;
// 		}

// 		p {
// 			line-height: inherit
// 		}

// 		.desktop_hide,
// 		.desktop_hide table {
// 			mso-hide: all;
// 			display: none;
// 			max-height: 0px;
// 			overflow: hidden;
// 		}

// 		.image_block img+div {
// 			display: none;
// 		}

// 		sup,
// 		sub {
// 			font-size: 75%;
// 			line-height: 0;
// 		}

// 		@media (max-width:670px) {

// 			.desktop_hide table.icons-inner,
// 			.social_block.desktop_hide .social-table {
// 				display: inline-block !important;
// 			}

// 			.icons-inner {
// 				text-align: center;
// 			}

// 			.icons-inner td {
// 				margin: 0 auto;
// 			}

// 			.mobile_hide {
// 				display: none;
// 			}

// 			.row-content {
// 				width: 100% !important;
// 			}

// 			.stack .column {
// 				width: 100%;
// 				display: block;
// 			}

// 			.mobile_hide {
// 				min-height: 0;
// 				max-height: 0;
// 				max-width: 0;
// 				overflow: hidden;
// 				font-size: 0px;
// 			}

// 			.desktop_hide,
// 			.desktop_hide table {
// 				display: table !important;
// 				max-height: none !important;
// 			}

// 			.row-3 .column-1 .block-1.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 36px !important;
// 			}

// 			.row-3 .column-1 .block-1.paragraph_block td.pad,
// 			.row-3 .column-2 .block-1.paragraph_block td.pad {
// 				padding: 0 !important;
// 			}

// 			.row-3 .column-1 .block-3.spacer_block {
// 				height: 20px !important;
// 			}

// 			.row-3 .column-1 .block-2.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 16px !important;
// 			}

// 			.row-3 .column-2 .block-1.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 14px !important;
// 			}

// 			.row-4 .column-1 .block-3.paragraph_block td.pad>div,
// 			.row-7 .column-1 .block-3.paragraph_block td.pad>div {
// 				text-align: center !important;
// 			}

// 			.row-4 .column-1 .block-3.paragraph_block td.pad,
// 			.row-7 .column-1 .block-3.paragraph_block td.pad {
// 				padding: 5px !important;
// 			}

// 			.row-5 .column-1 .block-3.paragraph_block td.pad>div {
// 				font-size: 15px !important;
// 			}

// 			.row-7 .column-1 .block-2.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 32px !important;
// 			}

// 			.row-7 .column-1 .block-2.paragraph_block td.pad {
// 				padding: 5px 5px 0 !important;
// 			}

// 			.row-9 .column-1 .block-1.spacer_block {
// 				height: 40px !important;
// 			}

// 			.row-3 .column-1 {
// 				padding: 30px 30px 0 !important;
// 			}

// 			.row-3 .column-2 {
// 				padding: 0 30px !important;
// 			}
// 		}
// 	</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]--><!--[if true]><style>.forceBgColor{background-color: white !important}</style><![endif]-->
// </head>
// <body class="body forceBgColor" style="background-color: transparent; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
// <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: transparent; background-repeat: no-repeat; background-image: none; background-position: top left; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #ffffff; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 650px;"><img alt="" height="auto" src="images/BEE_May20_MarketingAgency_DashboardMetrics_v01.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="650"/></div>
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #f6f5f1; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 650px;"><img alt="" height="auto" src="images/BEE_May20_MarketingAgency_Invoice_v01.jpg" style="display: block; height: auto; border: 0; width: 100%;" title="" width="650"/></div>
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-repeat: no-repeat; border-radius: 0; color: #000000; background-size: auto; background-color: #007c86; background-image: url('images/BEE_May20_MarketingAgency_Invoice_v02.jpg'); width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 50px; padding-left: 50px; padding-top: 60px; vertical-align: bottom; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:15px;padding-left:5px;padding-right:5px;">
// <div style="color:#ffffff;font-family:TimesNewRoman, 'Times New Roman', Times, Beskerville, Georgia, serif;font-size:70px;font-weight:400;letter-spacing:-2px;line-height:120%;text-align:left;mso-line-height-alt:84px;">
// <p style="margin: 0; word-break: break-word;"><em><span style="word-break: break-word; color: #ffffff;">Invoice</span></em></p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:18px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:21.599999999999998px;">
// <p style="margin: 0;">order # ${order_no}<br/>Date: ${ currentDate.toISOString().split('T')[0]}</p>
// </div>
// </td>
// </tr>
// </table>
// <div class="spacer_block block-3" style="height:30px;line-height:30px;font-size:1px;"> </div>
// </td>
// <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 50px; padding-right: 50px; padding-top: 50px; vertical-align: bottom; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:18px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:right;mso-line-height-alt:21.599999999999998px;">
// <p style="margin: 0;">Bill to:<br/>${user_email}<br/>${billing_address_1}<br/>${billing_address_2}<br/>${billing_city}<br/>${billing_state}<br/>${billing_country}</p>
// </div>
// </td>
// </tr>
// </table>
// <div class="spacer_block block-2" style="height:30px;line-height:30px;font-size:1px;"> </div>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #f6f5f1; border-left: 30px solid transparent; border-right: 30px solid transparent; border-top: 30px solid transparent; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-bottom: 30px; padding-top: 30px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="text-align:center;width:100%;">
// <h1 style="margin: 0; color: #222222; direction: ltr; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: -1px; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 28.799999999999997px;"><span class="tinyMce-placeholder" style="word-break: break-word;">Amount:</span></h1>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#222222;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:40px;font-weight:700;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:48px;">
// <p style="margin: 0;"><strong>€${total_item_amount_with_shipping.toFixed(2)}</strong></p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-top:5px;">
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f5f1; border-radius: 0; color: #000000; background-size: auto; border-left: 30px solid transparent; border-right: 30px solid transparent; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#222222;font-family:TimesNewRoman, 'Times New Roman', Times, Beskerville, Georgia, serif;font-size:24px;font-weight:400;letter-spacing:-1px;line-height:120%;text-align:left;mso-line-height-alt:28.799999999999997px;">
// <p style="margin: 0; word-break: break-word;">Dear <em>${firstName} ${lastName}</em>,</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-top:10px;">
// <div style="color:#222222;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
// <p style="margin: 0;">Thank you for placing your order with us! We’re excited to process your request and ensure a smooth delivery experience.<br/><br/>Your order is being prepared, and you’ll receive a confirmation email once it’s shipped. If you have any questions, feel free to contact us at sales@wowpetspalace.com.<br/><br/>Thank you for choosing Wow Pets Palace. We look forward to serving you!
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f5f1; border-radius: 0; color: #000000; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 20px solid transparent; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="10" cellspacing="0" class="table_block mobile_hide block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad">
// <table style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; width: 100%; table-layout: fixed; direction: ltr; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; color: #222222; text-align: right; letter-spacing: 0px; word-break: break-all;" width="100%">
// <thead style="vertical-align: top; background-color: #eddab2; color: #222222; font-size: 16px; line-height: 120%;">
// <tr>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%"><strong>Item</strong></th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Qty</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Price</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Total</th>
// </tr>
// </thead>
// <tbody style="vertical-align: top; font-size: 14px; line-height: 120%;">
//   ${rows}
 
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Subtotal</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">${totalPriceWithOutDiscount}</td>
// </tr>
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Discount</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${totalDiscount}</td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>GRAND TOTAL</strong></td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>€${totalPrice}</strong></td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="10" cellspacing="0" class="table_block desktop_hide block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-hide: all; display: none; max-height: 0; overflow: hidden;" width="100%">
// <tr>
// <td class="pad">
// <table style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-hide: all; display: none; max-height: 0; overflow: hidden; border-collapse: collapse; width: 100%; table-layout: fixed; direction: ltr; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; color: #222222; text-align: right; letter-spacing: 0px; word-break: break-all;" width="100%">
// <thead style="vertical-align: top; background-color: #eddab2; color: #222222; font-size: 11px; line-height: 120%;">
// <tr>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%"><strong>Service</strong></th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Qty</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Price</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Total</th>
// </tr>
// </thead>
// <tbody style="vertical-align: top; font-size: 11px; line-height: 120%;">
//  ${rows}
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Subtotal</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${(totalPrice + totalDiscount).toFixed(2)}</td>
// </tr>
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Discount</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${totalDiscount.toFixed(2)}</td>
// </tr>
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>Shipping</strong></td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>€${totalShipping.toFixed(2)}</strong></td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>GRAND TOTAL</strong></td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>€${total_item_amount_with_shipping.toFixed(2)}</strong></td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-repeat: no-repeat; background-color: #f6f5f1; border-radius: 0; color: #000000; background-image: url('images/BG-yellow_2.jpg'); background-size: cover; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 40px; padding-left: 15px; padding-right: 15px; padding-top: 40px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 28px;"><img alt="" height="auto" src="images/Flower-green_1.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="28"/></div>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-left:25px;padding-right:25px;">
// <div style="color:#222222;font-family:TimesNewRoman, 'Times New Roman', Times, Beskerville, Georgia, serif;font-size:38px;font-weight:400;letter-spacing:-1px;line-height:120%;text-align:center;mso-line-height-alt:45.6px;">
// <p style="margin: 0; word-break: break-word;">Have<em> questions?</em></p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:5px;padding-left:25px;padding-right:25px;padding-top:5px;">
// <div style="color:#222222;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
// <p style="margin: 0; word-break: break-word;">We have answers. Get in touch with us via email, phone or support chat.</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="button_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="padding-top:10px;text-align:center;">
// <div align="center" class="alignment"><!--[if mso]>
// <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.wowpetspalace.com/contact-us" style="height:38px;width:181px;v-text-anchor:middle;" arcsize="27%" stroke="false" fillcolor="#222222">
// <w:anchorlock/>
// <v:textbox inset="0px,0px,0px,0px">
// <center dir="false" style="color:#ffffff;font-family:Arial, sans-serif;font-size:14px">
// <![endif]--><a href="https://www.wowpetspalace.com/contact-us" style="background-color:#222222;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:10px;border-right:0px solid transparent;border-top:0px solid transparent;color:#ffffff;display:inline-block;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;" target="_blank"><span style="word-break: break-word; padding-left: 30px; padding-right: 30px; font-size: 14px; display: inline-block; letter-spacing: 2px;"><span style="margin: 0; word-break: break-word; line-height: 28px;">GET IN TOUCH</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #f6f5f1; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 650px;"><img alt="" height="auto" src="images/BEE_May20_MarketingAgency_Invoice_v01.jpg" style="display: block; height: auto; border: 0; width: 100%;" title="" width="650"/></div>
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #007c86; border-radius: 0; color: #000000; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 20px; padding-right: 20px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <div class="spacer_block block-1" style="height:40px;line-height:40px;font-size:1px;"> </div>
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 91.5px;"><img alt="" height="auto" src="images/MC-logo-white.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="91.5"/></div>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:30px;padding-left:10px;padding-right:10px;padding-top:20px;">
// <div style="color:#ffffff;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:12px;letter-spacing:2px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
// <p style="margin: 0; word-break: break-word;">Wow Pets Palace</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="social_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:10px;text-align:center;padding-right:0px;padding-left:0px;">
// <div align="center" class="alignment">
// <table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="168px">
// <tr>
// <td style="padding:0 5px 0 5px;"><a href="https://www.instagram.com/wowpetspalace/" target="_blank"><img alt="Instagram" height="auto" src="https://wowpetspalace.com/dashboard/email/instagram2x.png" style="display: block; height: auto; border: 0;" title="Instagram" width="32"/></a></td>
// <td style="padding:0 5px 0 5px;"><a href="https://www.facebook.com/people/Wow-Pets-Palace/61555678081345/" target="_blank"><img alt="Facebook" height="auto" src="https://wowpetspalace.com/dashboard/email/facebook2x.png" style="display: block; height: auto; border: 0;" title="Facebook" width="32"/></a></td>
// <td style="padding:0 5px 0 5px;"><a href="https://www.tiktok.com/@wow.pets.palace" target="_blank"><img alt="TikTok" height="auto" src="https://wowpetspalace.com/dashboard/email/tiktok2x.png" style="display: block; height: auto; border: 0;" title="TikTok" width="32"/></a></td>
// </tr>
// </table>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
// <p style="margin: 0;">Rr: Irfan Tomini, 1001<br/>Tirana, Albania</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
// <p style="margin: 0;"><a href="http://www.wowpetspalace.com/unsubcribe" rel="noopener" style="text-decoration: underline; color: #ffffff;" target="_blank">Unsubscribe</a> or <a href="http://www.wowpetspalace.com" rel="noopener" style="text-decoration: underline; color: #ffffff;" target="_blank">Manage Preferences</a></p>
// </div>
// </td>
// </tr>
// </table>
// <div class="spacer_block block-7" style="height:40px;line-height:40px;font-size:1px;"> </div>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-10" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center; line-height: 0;" width="100%">
// <tr>
// <td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;"><!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
// <!--[if !vml]><!-->
// <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
// <tr>
// <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="https://wowpetspalace.com/" style="text-decoration: none;" target="_blank"><img align="center" alt="Wow Pets Palace Logo" class="icon" height="auto" src="https://wowpetspalace.com/dashboard/email/wowpetspalacelogo.png" style="display: block; height: auto; margin: 0 auto; border: 0;" width="34"/></a></td>
// <td style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: undefined; color: #1e0e4b; vertical-align: middle; letter-spacing: undefined; text-align: center; line-height: normal;"><a href="http://https://wowpetspalace.com/" style="color: #1e0e4b; text-decoration: none;" target="_blank">© 2025 WowPetsPalace. All rights reserved</a></td>
// </tr>
// </table>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table><!-- End -->
// </body>
// </html>`
//     );

//     await sendEmail(
//       shop_email,
//       "New Order Placed",
//       `<p>A new order has been placed by ${firstName} ${lastName}.<br>Product: ${name}<br>Quantity: ${1}<br>Total Amount: ${currency_symbol}${total_item_amount_with_shipping}</p>`
//     );
    
    
    // Send response
    res.status(200).json({
      message: "Order created successfully",
      order_no,
      id: 0,
      client_secret: 0,
    });
    
}
catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ message: "Order creation failed", error: error.message });
  }
      
};
// Deprecated
const createOrder = async (req, res, next) => {
  const {
    user_id,
    billingDetails,
    shippingDetails,
    shop_id,
    name,
    shipping_cost = 0, 
    paymentMethodType,
    currency,
    items
  } = req.body;

     const {
    firstName: billing_first_name,
    lastName: billing_last_name,
    company: billing_company,
    country: billing_country,
    address1: billing_address_1,
    address2: billing_address_2,
    city: billing_city,
    state: billing_state,
    zipCode: billing_postal_code,
    phone: billing_phone,
    email: billing_email
  } = billingDetails;

  const {
    firstName: shipping_first_name,
    lastName: shipping_last_name,
    company: shipping_company,
    country: shipping_country,
    address1: shipping_address_1,
    address2: shipping_address_2,
    city: shipping_city,
    state: shipping_state,
    zipCode: shipping_postal_code,
    phone: shipping_phone,
    email: shipping_email
  } = shippingDetails;

                        try
                        {
                              
                              
                              const shopdetails = await shopModel.getShopByIdModel(shop_id);
                              
                            
                            const balance_amount = 0;
                            let totalPrice = 0;
                            let totalPriceWithOutDiscount=0;
                            let totalShipping = 0;
                            let totalDiscount = 0;
                            let totalQuantity=0;
                            const resultItems = [];

                        if (!Array.isArray(items)) {
                          return res.status(400).json({ error: "Items should be an array." });
                        }
  
                        const order_no = generateRandomId();                      
                        
                        
                        for (const product of items) {
                          try {
                            // Fetch product details by ID
                            const pro = await mkProductModel.getProductById(product.id);
                        
                        totalPriceWithOutDiscount += pro.original_price*product.quantity;
                            // Extract necessary fields from the product
                            const proPrice = pro.original_price;
                         
                            const discountPercentage = pro.discountPercentage || 0;
                        
                            // Calculate discounted price
                            let discountedPrice;
                            let discount_on_item=0;
                            
                            if (!isNaN(discountPercentage) && discountPercentage > 0) {
                              discountedPrice = proPrice - (proPrice * discountPercentage / 100);
                            } else {
                              discountedPrice = proPrice;
                            }
                        
                            // Update total price and shipping based on quantity
                            totalPrice += discountedPrice * product.quantity;
                            totalShipping += pro.shipping_cost * product.quantity;
                            
                            
                            // Calculate total discount if applicable
                            if (discountPercentage > 0) {
                              totalDiscount += (proPrice - discountedPrice) * product.quantity;
                              
                              discount_on_item=proPrice - discountedPrice;
                              
                            }
                            
                            totalQuantity +=product.quantity;
                            
                             // Add price, quantity, and ID to the result array
                                resultItems.push({
                                  shop_id: product.shop_id,
                                  product_id: product.id,
                                  product_name:pro.name,
                                  original_price:proPrice,
                                  price:proPrice*product.quantity,
                                  discount_amount:discountedPrice *product.quantity,
                                  qty:product.quantity,
                                  discount_value:discount_on_item,
                                  discount_percentage:discountPercentage,
                                  product_unit:pro.product_measurement,
                                  shipping_cost:pro.shipping_cost * product.quantity
                                });

                        
                          } catch (error) {
                          
                            console.error(`Error fetching product with ID ${product.id}:`, error);
                            // Optionally, handle the error (e.g., continue, break, or return an error response)
                            // For example, you might skip this product and continue with others:
                            continue;
                          }
                        }


// return res.status(400).json({ message: totalPrice +" "+totalShipping +" "+totalDiscount});
 

  
    
    // const shippingCost = parseFloat(shipping_cost_);
    // const sub_total_amount = pricePerUnit * quantity;
    const total_item_amount_with_shipping = totalPrice + totalShipping;

    const { currency_symbol, currency_short_form } = shopdetails[0];
    //const original_price = pricePerUnit;
    
    
 
  const contact_name = `${shipping_first_name} ${shipping_last_name}`;
  const contact_phone = shipping_phone;
  const payment_method = paymentMethodType;
  const added_user_id = user_id;
  const trans_status_id = 1;
 
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_item_amount_with_shipping * 100),
      currency: currency || "usd",
      payment_method_types: [paymentMethodType || "card"],
      metadata: { user_id },
    });

    if (!paymentIntent) {
      return res.status(400).json({ message: "Payment intent creation failed" });
    }
    
    // Use Promises for transaction handling
    await new Promise(async (resolve, reject) => {
      db.beginTransaction(async (err) => {
        if (err) return reject(err);

        try {
        
         // Create order
      const result = await mkProductModel.createOrderModel(
          order_no,
        user_id,
        shop_id,
        totalPrice, // total amount
        totalDiscount, // total discount on order
        0,
        0,
        0,
        totalShipping,
        0,
        0,
        "Default",
        balance_amount,
        total_item_amount_with_shipping, // total with shipping
        totalQuantity,
        contact_name,
        contact_phone,
        payment_method,
        added_user_id,
        trans_status_id,
        currency_symbol,
        currency_short_form,
        billing_first_name,
        billing_last_name,
        billing_company,
        billing_address_1,
        billing_address_2,
        billing_country,
        billing_state,
        billing_city,
        billing_postal_code,
        billing_email,
        billing_phone,
        shipping_first_name,
        shipping_last_name,
        shipping_company,
        shipping_address_1,
        shipping_address_2,
        shipping_country,
        shipping_state,
        shipping_city,
        shipping_postal_code,
        shipping_email,
        shipping_phone,
        resultItems
      );

          const order_id = result.insertId;

          // Log transaction
          await logTransaction({
            order_id,
            user_id,
            amount:total_item_amount_with_shipping,
            currency,
            payment_method: paymentMethodType,
            payment_status: paymentIntent.status,
            transaction_date: new Date(),
            gateway_response: paymentIntent.id,
          });

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => reject(commitErr));
            }
            resolve(order_id);
          });
        } catch (transactionError) {
          db.rollback(() => reject(transactionError));
        }
      });
    });
    
    const currentDate = new Date();
    const rows = resultItems.map((service, index) => 
    
    `
<tr style="background-color:#f9f9f9;">
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">${service.product_name}</td>
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">${service.qty}</td>
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${service.original_price.toFixed(2)}</td>
<td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${service.price.toFixed(2)}</td>
</tr>
    `).join('');
    
    // Send emails after successful transaction
    const user = await authUserModel.getAllAppUsersById(user_id);
    const { email: user_email, firstName, lastName } = user[0];
    const { email: shop_email } = shopdetails[0];

//     await sendEmail(
//       user_email,
//       "Order Confirmation",
//       `<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
// <head>
// <title></title>
// <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
// <meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
// <style>
// 		* {
// 			box-sizing: border-box;
// 		}

// 		body {
// 			margin: 0;
// 			padding: 0;
// 		}

// 		a[x-apple-data-detectors] {
// 			color: inherit !important;
// 			text-decoration: inherit !important;
// 		}

// 		#MessageViewBody a {
// 			color: inherit;
// 			text-decoration: none;
// 		}

// 		p {
// 			line-height: inherit
// 		}

// 		.desktop_hide,
// 		.desktop_hide table {
// 			mso-hide: all;
// 			display: none;
// 			max-height: 0px;
// 			overflow: hidden;
// 		}

// 		.image_block img+div {
// 			display: none;
// 		}

// 		sup,
// 		sub {
// 			font-size: 75%;
// 			line-height: 0;
// 		}

// 		@media (max-width:670px) {

// 			.desktop_hide table.icons-inner,
// 			.social_block.desktop_hide .social-table {
// 				display: inline-block !important;
// 			}

// 			.icons-inner {
// 				text-align: center;
// 			}

// 			.icons-inner td {
// 				margin: 0 auto;
// 			}

// 			.mobile_hide {
// 				display: none;
// 			}

// 			.row-content {
// 				width: 100% !important;
// 			}

// 			.stack .column {
// 				width: 100%;
// 				display: block;
// 			}

// 			.mobile_hide {
// 				min-height: 0;
// 				max-height: 0;
// 				max-width: 0;
// 				overflow: hidden;
// 				font-size: 0px;
// 			}

// 			.desktop_hide,
// 			.desktop_hide table {
// 				display: table !important;
// 				max-height: none !important;
// 			}

// 			.row-3 .column-1 .block-1.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 36px !important;
// 			}

// 			.row-3 .column-1 .block-1.paragraph_block td.pad,
// 			.row-3 .column-2 .block-1.paragraph_block td.pad {
// 				padding: 0 !important;
// 			}

// 			.row-3 .column-1 .block-3.spacer_block {
// 				height: 20px !important;
// 			}

// 			.row-3 .column-1 .block-2.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 16px !important;
// 			}

// 			.row-3 .column-2 .block-1.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 14px !important;
// 			}

// 			.row-4 .column-1 .block-3.paragraph_block td.pad>div,
// 			.row-7 .column-1 .block-3.paragraph_block td.pad>div {
// 				text-align: center !important;
// 			}

// 			.row-4 .column-1 .block-3.paragraph_block td.pad,
// 			.row-7 .column-1 .block-3.paragraph_block td.pad {
// 				padding: 5px !important;
// 			}

// 			.row-5 .column-1 .block-3.paragraph_block td.pad>div {
// 				font-size: 15px !important;
// 			}

// 			.row-7 .column-1 .block-2.paragraph_block td.pad>div {
// 				text-align: center !important;
// 				font-size: 32px !important;
// 			}

// 			.row-7 .column-1 .block-2.paragraph_block td.pad {
// 				padding: 5px 5px 0 !important;
// 			}

// 			.row-9 .column-1 .block-1.spacer_block {
// 				height: 40px !important;
// 			}

// 			.row-3 .column-1 {
// 				padding: 30px 30px 0 !important;
// 			}

// 			.row-3 .column-2 {
// 				padding: 0 30px !important;
// 			}
// 		}
// 	</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]--><!--[if true]><style>.forceBgColor{background-color: white !important}</style><![endif]-->
// </head>
// <body class="body forceBgColor" style="background-color: transparent; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
// <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: transparent; background-repeat: no-repeat; background-image: none; background-position: top left; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #ffffff; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 650px;"><img alt="" height="auto" src="images/BEE_May20_MarketingAgency_DashboardMetrics_v01.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="650"/></div>
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #f6f5f1; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 650px;"><img alt="" height="auto" src="images/BEE_May20_MarketingAgency_Invoice_v01.jpg" style="display: block; height: auto; border: 0; width: 100%;" title="" width="650"/></div>
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-repeat: no-repeat; border-radius: 0; color: #000000; background-size: auto; background-color: #007c86; background-image: url('images/BEE_May20_MarketingAgency_Invoice_v02.jpg'); width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 50px; padding-left: 50px; padding-top: 60px; vertical-align: bottom; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:15px;padding-left:5px;padding-right:5px;">
// <div style="color:#ffffff;font-family:TimesNewRoman, 'Times New Roman', Times, Beskerville, Georgia, serif;font-size:70px;font-weight:400;letter-spacing:-2px;line-height:120%;text-align:left;mso-line-height-alt:84px;">
// <p style="margin: 0; word-break: break-word;"><em><span style="word-break: break-word; color: #ffffff;">Invoice</span></em></p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:18px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:21.599999999999998px;">
// <p style="margin: 0;">order # ${order_no}<br/>Date: ${ currentDate.toISOString().split('T')[0]}</p>
// </div>
// </td>
// </tr>
// </table>
// <div class="spacer_block block-3" style="height:30px;line-height:30px;font-size:1px;"> </div>
// </td>
// <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 50px; padding-right: 50px; padding-top: 50px; vertical-align: bottom; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:18px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:right;mso-line-height-alt:21.599999999999998px;">
// <p style="margin: 0;">Bill to:<br/>${user_email}<br/>${billing_address_1}<br/>${billing_address_2}<br/>${billing_city}<br/>${billing_state}<br/>${billing_country}</p>
// </div>
// </td>
// </tr>
// </table>
// <div class="spacer_block block-2" style="height:30px;line-height:30px;font-size:1px;"> </div>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #f6f5f1; border-left: 30px solid transparent; border-right: 30px solid transparent; border-top: 30px solid transparent; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-bottom: 30px; padding-top: 30px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="text-align:center;width:100%;">
// <h1 style="margin: 0; color: #222222; direction: ltr; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: -1px; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 28.799999999999997px;"><span class="tinyMce-placeholder" style="word-break: break-word;">Amount:</span></h1>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#222222;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:40px;font-weight:700;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:48px;">
// <p style="margin: 0;"><strong>€${total_item_amount_with_shipping.toFixed(2)}</strong></p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-top:5px;">
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f5f1; border-radius: 0; color: #000000; background-size: auto; border-left: 30px solid transparent; border-right: 30px solid transparent; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#222222;font-family:TimesNewRoman, 'Times New Roman', Times, Beskerville, Georgia, serif;font-size:24px;font-weight:400;letter-spacing:-1px;line-height:120%;text-align:left;mso-line-height-alt:28.799999999999997px;">
// <p style="margin: 0; word-break: break-word;">Dear <em>${firstName} ${lastName}</em>,</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-top:10px;">
// <div style="color:#222222;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
// <p style="margin: 0;">Thank you for placing your order with us! We’re excited to process your request and ensure a smooth delivery experience.<br/><br/>Your order is being prepared, and you’ll receive a confirmation email once it’s shipped. If you have any questions, feel free to contact us at sales@wowpetspalace.com.<br/><br/>Thank you for choosing Wow Pets Palace. We look forward to serving you!
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f5f1; border-radius: 0; color: #000000; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 20px solid transparent; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="10" cellspacing="0" class="table_block mobile_hide block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad">
// <table style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; width: 100%; table-layout: fixed; direction: ltr; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; color: #222222; text-align: right; letter-spacing: 0px; word-break: break-all;" width="100%">
// <thead style="vertical-align: top; background-color: #eddab2; color: #222222; font-size: 16px; line-height: 120%;">
// <tr>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%"><strong>Item</strong></th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Qty</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Price</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Total</th>
// </tr>
// </thead>
// <tbody style="vertical-align: top; font-size: 14px; line-height: 120%;">
//   ${rows}
 
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Subtotal</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">${totalPriceWithOutDiscount}</td>
// </tr>
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Discount</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${totalDiscount}</td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>GRAND TOTAL</strong></td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>€${totalPrice}</strong></td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="10" cellspacing="0" class="table_block desktop_hide block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-hide: all; display: none; max-height: 0; overflow: hidden;" width="100%">
// <tr>
// <td class="pad">
// <table style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-hide: all; display: none; max-height: 0; overflow: hidden; border-collapse: collapse; width: 100%; table-layout: fixed; direction: ltr; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; color: #222222; text-align: right; letter-spacing: 0px; word-break: break-all;" width="100%">
// <thead style="vertical-align: top; background-color: #eddab2; color: #222222; font-size: 11px; line-height: 120%;">
// <tr>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%"><strong>Service</strong></th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Qty</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Price</th>
// <th style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent; text-align: right;" width="25%">Total</th>
// </tr>
// </thead>
// <tbody style="vertical-align: top; font-size: 11px; line-height: 120%;">
//  ${rows}
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Subtotal</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${(totalPrice + totalDiscount).toFixed(2)}</td>
// </tr>
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">Discount</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">€${totalDiscount.toFixed(2)}</td>
// </tr>
// <tr>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>Shipping</strong></td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>€${totalShipping.toFixed(2)}</strong></td>
// </tr>
// <tr style="background-color:#f9f9f9;">
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%">​</td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>GRAND TOTAL</strong></td>
// <td style="padding: 10px; word-break: break-word; border-top: 1px solid transparent; border-right: 1px solid transparent; border-bottom: 1px solid transparent; border-left: 1px solid transparent;" width="25%"><strong>€${total_item_amount_with_shipping.toFixed(2)}</strong></td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-repeat: no-repeat; background-color: #f6f5f1; border-radius: 0; color: #000000; background-image: url('images/BG-yellow_2.jpg'); background-size: cover; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 40px; padding-left: 15px; padding-right: 15px; padding-top: 40px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 28px;"><img alt="" height="auto" src="images/Flower-green_1.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="28"/></div>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-left:25px;padding-right:25px;">
// <div style="color:#222222;font-family:TimesNewRoman, 'Times New Roman', Times, Beskerville, Georgia, serif;font-size:38px;font-weight:400;letter-spacing:-1px;line-height:120%;text-align:center;mso-line-height-alt:45.6px;">
// <p style="margin: 0; word-break: break-word;">Have<em> questions?</em></p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:5px;padding-left:25px;padding-right:25px;padding-top:5px;">
// <div style="color:#222222;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:15px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:22.5px;">
// <p style="margin: 0; word-break: break-word;">We have answers. Get in touch with us via email, phone or support chat.</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="button_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="padding-top:10px;text-align:center;">
// <div align="center" class="alignment"><!--[if mso]>
// <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.wowpetspalace.com/contact-us" style="height:38px;width:181px;v-text-anchor:middle;" arcsize="27%" stroke="false" fillcolor="#222222">
// <w:anchorlock/>
// <v:textbox inset="0px,0px,0px,0px">
// <center dir="false" style="color:#ffffff;font-family:Arial, sans-serif;font-size:14px">
// <![endif]--><a href="https://www.wowpetspalace.com/contact-us" style="background-color:#222222;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:10px;border-right:0px solid transparent;border-top:0px solid transparent;color:#ffffff;display:inline-block;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;" target="_blank"><span style="word-break: break-word; padding-left: 30px; padding-right: 30px; font-size: 14px; display: inline-block; letter-spacing: 2px;"><span style="margin: 0; word-break: break-word; line-height: 28px;">GET IN TOUCH</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; background-size: auto; background-color: #f6f5f1; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 650px;"><img alt="" height="auto" src="images/BEE_May20_MarketingAgency_Invoice_v01.jpg" style="display: block; height: auto; border: 0; width: 100%;" title="" width="650"/></div>
// </div>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #007c86; border-radius: 0; color: #000000; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 20px; padding-right: 20px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <div class="spacer_block block-1" style="height:40px;line-height:40px;font-size:1px;"> </div>
// <table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
// <div align="center" class="alignment" style="line-height:10px">
// <div style="max-width: 91.5px;"><img alt="" height="auto" src="images/MC-logo-white.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="91.5"/></div>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:30px;padding-left:10px;padding-right:10px;padding-top:20px;">
// <div style="color:#ffffff;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:12px;letter-spacing:2px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
// <p style="margin: 0; word-break: break-word;">Wow Pets Palace</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="0" cellspacing="0" class="social_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
// <tr>
// <td class="pad" style="padding-bottom:10px;text-align:center;padding-right:0px;padding-left:0px;">
// <div align="center" class="alignment">
// <table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="168px">
// <tr>
// <td style="padding:0 5px 0 5px;"><a href="https://www.instagram.com/wowpetspalace/" target="_blank"><img alt="Instagram" height="auto" src="https://wowpetspalace.com/dashboard/email/instagram2x.png" style="display: block; height: auto; border: 0;" title="Instagram" width="32"/></a></td>
// <td style="padding:0 5px 0 5px;"><a href="https://www.facebook.com/people/Wow-Pets-Palace/61555678081345/" target="_blank"><img alt="Facebook" height="auto" src="https://wowpetspalace.com/dashboard/email/facebook2x.png" style="display: block; height: auto; border: 0;" title="Facebook" width="32"/></a></td>
// <td style="padding:0 5px 0 5px;"><a href="https://www.tiktok.com/@wow.pets.palace" target="_blank"><img alt="TikTok" height="auto" src="https://wowpetspalace.com/dashboard/email/tiktok2x.png" style="display: block; height: auto; border: 0;" title="TikTok" width="32"/></a></td>
// </tr>
// </table>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
// <p style="margin: 0;">Rr: Irfan Tomini, 1001<br/>Tirana, Albania</p>
// </div>
// </td>
// </tr>
// </table>
// <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
// <tr>
// <td class="pad">
// <div style="color:#ffffff;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
// <p style="margin: 0;"><a href="http://www.wowpetspalace.com/unsubcribe" rel="noopener" style="text-decoration: underline; color: #ffffff;" target="_blank">Unsubscribe</a> or <a href="http://www.wowpetspalace.com" rel="noopener" style="text-decoration: underline; color: #ffffff;" target="_blank">Manage Preferences</a></p>
// </div>
// </td>
// </tr>
// </table>
// <div class="spacer_block block-7" style="height:40px;line-height:40px;font-size:1px;"> </div>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-10" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
// <tbody>
// <tr>
// <td>
// <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 650px; margin: 0 auto;" width="650">
// <tbody>
// <tr>
// <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
// <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center; line-height: 0;" width="100%">
// <tr>
// <td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;"><!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
// <!--[if !vml]><!-->
// <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; padding-left: 0px; padding-right: 0px;"><!--<![endif]-->
// <tr>
// <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="https://wowpetspalace.com/" style="text-decoration: none;" target="_blank"><img align="center" alt="Wow Pets Palace Logo" class="icon" height="auto" src="https://wowpetspalace.com/dashboard/email/wowpetspalacelogo.png" style="display: block; height: auto; margin: 0 auto; border: 0;" width="34"/></a></td>
// <td style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: undefined; color: #1e0e4b; vertical-align: middle; letter-spacing: undefined; text-align: center; line-height: normal;"><a href="http://https://wowpetspalace.com/" style="color: #1e0e4b; text-decoration: none;" target="_blank">© 2025 WowPetsPalace. All rights reserved</a></td>
// </tr>
// </table>
// </td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// </td>
// </tr>
// </tbody>
// </table><!-- End -->
// </body>
// </html>`
//     );

//     await sendEmail(
//       shop_email,
//       "New Order Placed",
//       `<p>A new order has been placed by ${firstName} ${lastName}.<br>Product: ${name}<br>Quantity: ${1}<br>Total Amount: ${currency_symbol}${total_item_amount_with_shipping}</p>`
//     );
    
    
    // Send response
    res.status(200).json({
      message: "Order created successfully",
      order_no,
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    });
    
}
catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ message: "Order creation failed", error: error.message });
  }
      
};


// Controller
const getAllOrder = async (req, res) => {
  try {
    const user_id  = req.user.id; //req.query;
    const page = req.query.page || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const result = await mkProductModel.getAllOrders(user_id, limit, offset);
    
    res.status(200).json({
      totalPages: Math.ceil(result.totalCount / limit),
      currentPage: Number(page),
      data: result.data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};


//Deprecated for future use, use getAllOrder
const getAllOrderController = async (req,res) => {
   try {
    const result = await mkProductModel.getAllOrdersModel();
    res.status(200).json({result})
   } catch (error) {
     res.status(404).json(error)

   }
}
const getAllOrderByIDController = async (req, res) => {
    const id = req.params.id;

  
    try {
        const result = await mkProductModel.getAllOrdersModelById(id);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// delete orders
const deleteOrderController = async(req,res)=>{
  const id = req.params.id;
  try {
    const result = await mkProductModel.deleteOrders(id);
    if (result) {
      res.status(200).json({ message: 'Order deleted successfully' });
    }
    else {
      res.status(404).json({ message: 'Order not found' });
    }
   } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getAllOrderStatus = async(req,res)=>{
  try {
    const result = await mkProductModel.getOrderStatus();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const updateOrderStatus = async(req,res)=>{
  const id = req.params.id;
  const { status } = req.body;
  try {
    const result = await mkProductModel.updateOrderStatus(id, status);
    if (result) {
      res.status(200).json({ message: 'Order status updated successfully' });
    }
    else {
      res.status(404).json({ message: 'Order not found' });
    }
   } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getTransactionRecordController = async(req,res)=>{
  try {
    const result = await mkProductModel.getTransactionRecord();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


// const createDiscountController = async (req, res) => {
//     const { shop_id, name, discount, isPublish, productId } = req.body;

   
   
//    const image = req.file ? "discount/" + req.file.filename : null;  // Corrected file path

//     try {
//         const result = await mkProductModel.createDiscount(shop_id, name, discount, isPublish, image, productId);
//         res.status(200).json({ message: "Discount created successfully", result });
//     } catch (error) {
//         res.status(404).json(error);
//     }
// };

const createDiscountController = async (req, res) => {
    const { shop_id, name, discount, isPublish } = req.body;
    const productId = JSON.parse(req.body.productId);  // Parse the JSON string back to an array
   
    const image = req.file ? "discount/" + req.file.filename : null;

    try {
        const result = await mkProductModel.createDiscount(shop_id, name, discount, isPublish, image, productId);
        res.status(200).json({ message: "Discount created successfully", result });
    } catch (error) {
        res.status(404).json(error);
    }
};



const getDiscountProductController = async (req,res) =>{
 // const id = req.params.id;


  try {
    const result = await mkProductModel.getDiscountsProducts();
    res.status(200).json({result});
  } catch (error) {
    res.status(404).json(error)

  }
}
const getDiscountbyIdController = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await mkProductModel.getDiscountById(id);
    res.status(200).json({ result });
  } catch (error) {
    res.status(404).json(error);
  }
};

const updateDiscountController = async (req, res) => {
  const discountId = req.params.discountId;
  console.log(discountId, "check discount id");
  const { name, discount, isPublish } = req.body;
  const productId = req.body.productId ? JSON.parse(req.body.productId) : [];
  const image = req.file ? "discount/" + req.file.filename : null;

  console.log(name, discount, isPublish, "controller");

  try {
    const result = await mkProductModel.updateDiscount(
      discountId,
      name,
      discount,
      isPublish,
      image,
      productId
    );
    res.status(200).json({ message: "Discount updated successfully", result });
  } catch (error) {
    res.status(404).json(error);
  }
};



const deleteDiscount = async(req,res) =>{
  const id = req.params.id;
  try {
    const result = await mkProductModel.deleteDiscount(id);
    res.status(200).json({message:"Discount Deleted Sucessfully"})
  } catch (error) {
    res.status(200).json(error)
  }
}

const getDiscountedProducts = async (req, res) => {
    try {
        const discountedProducts = await mkProductModel.getAllDiscountProducts();
        res.status(200).json({
            success: true,
            data: discountedProducts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving discounted products',
            error: error.message,
        });
    }
};


const getAllDiscountsContoroller = async (req,res) =>{
  try {
    const result = await mkProductModel.getAllDiscounts();
    res.status(200).json({result});
  } catch (error) {
    res.status(404).json(error)
  }
}


const getMaxMinPriceController = async(req,res)=>{
  try {
    const result = await mkProductModel.getMinMaxPrice();
    res.status(200).json({result})
  } catch (error) {
    res.status(404).json(error)
    
  }
}

module.exports = {
  mkProductController,
  getAllProductsController,
  getAllProductsbyShopId,
  getProductByIdController,
  updateProduct,
  deleteProduct,
  getAllFeaturedProductsController,
  getProductImageController,
  deleteProductImageController,
  getProductBySlugController,
  createOrder,
  getAllOrderController,
  getAllOrderByIDController,
  deleteOrderController,
  getAllOrderStatus,
  updateOrderStatus,
  getTransactionRecordController,
  createDiscountController,
  getDiscountProductController,
  getDiscountbyIdController,
  updateDiscountController,
  deleteDiscount,
  getDiscountedProducts,
  getAllDiscountsContoroller,
  getAllFilterProductsController,
  getAllFilterPriceProductsController,
  getMaxMinPriceController,
  getProductsSubCategory,
  getAllProducts,
  getProductReviews,
  addOrUpdateOrderReview,
  addOrUpdateProductReview,
  searchProductsAndBreeds,
  createPaymentIntent,
  placeOrder,
  getAllOrder
  
};
