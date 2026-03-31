const db = require("../../config/DatabaseConnection");

// get tags from shop tags
const getTagsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM tags`;
    db.query(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

const createShopModel = (
  name,
  phone1,
  description,
  phone2,
  newShopTags,
  phone3,
  statusForPublish,
  isFeatured,
  contactEmail,
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
  iconPhotoDimensions,
  img_type
) => {
  console.log("shop tag model", newShopTags);
  const generateRandomId = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters[randomIndex];
    }
    return id;
  };

  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) {
        return reject(err);
      }

      const id = generateRandomId();
      console.log("id checking===", id);

      const query =
        "INSERT INTO mk_shops (id, email, name, about_phone1, description, about_phone2, about_phone3, address1, address2, status, is_featured, about_website, facebook, google_plus, instagram, youtube, pinterest, twitter, whatsapp_no, messenger, stripe_publishable_key, stripe_secret_key, stripe_enabled, paypal_environment, paypal_merchant_id, paypal_public_key, paypal_private_key, paypal_enabled, bank_account, bank_name, bank_code, branch_code, swift_code, banktransfer_enabled, cod_email, cod_enabled, razor_key, razor_enabled, currency_symbol, currency_short_form, sender_email, overall_tax_value, shipping_tax_value, refund_policy, terms, privacy_policy, standard_shipping_enable, zone_shipping_enable, no_shipping_enable) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

      const values = [
        id,
        contactEmail,
        name,
        phone1,
        description,
        phone2,
        phone3,
        address1,
        address2,
        statusForPublish,
        isFeatured,
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
        standard_shipping_enable ? 1 : 0,
        zone_shipping_enable ? 1 : 0,
        no_shipping_enable ? 1 : 0,
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          return db.rollback(() => {
            reject(err);
          });
        }

        const shopTagsQuery = `
          INSERT INTO mk_shops_tags (tag_id,shop_id) VALUES (?,?)
        `;

        const insertTagPromises = newShopTags.map((tag) => {
          return new Promise((resolve, reject) => {
            db.query(shopTagsQuery, [Number(tag), id], (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        });

        const shopImagesQuery = `
          INSERT INTO mk_core_images (img_parent_id, img_type, img_path, img_height, img_width) VALUES (?,?,?,?,?)
        `;

        const shopImagesValues = [
          {
            shopId: id,
            img_type: "icon",
            img_path: shopIconPhoto,
            img_height: iconPhotoDimensions?.height || null,
            img_width: iconPhotoDimensions?.width || null,
          },
          {
            shopId: id,
            img_type: "shopcover",
            img_path: shopCoverPhoto,
            img_height: coverPhotoDimensions?.height || null,
            img_width: coverPhotoDimensions?.width || null,
          },
        ];

        const insertImagePromises = shopImagesValues.map((image) => {
          return new Promise((resolve, reject) => {
            db.query(
              shopImagesQuery,
              [
                image.shopId,
                image.img_type,
                image.img_path,
                image.img_height,
                image.img_width,
              ],
              (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              }
            );
          });
        });

        Promise.all([...insertTagPromises, ...insertImagePromises])
          .then(() => {
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve(id);
            });
          })
          .catch((err) => {
            db.rollback(() => {
              reject(err);
            });
          });
      });
    });
  });
};

// const createShopModel = (
//   name,
//   phone1,
//   description,
//   phone2,
//   shopTags,
//   phone3,
//   statusForPublish,
//   isFeatured,
//   contactEmail,
//   address1,
//   address2,
//   aboutWebsiteLink,
//   facebook,
//   google,
//   instagram,
//   youtube,
//   pinterest,
//   twitter,
//   whatsappNumber,
//   messenger,
//   stripePublishableKey,
//   stripeSecretKey,
//   isEnabledStripe,
//   paypalEnvironment,
//   paypalMerchantId,
//   paypalPublicKey,
//   paypalPrivateKey,
//   isEnabledPaypal,
//   bankAccount,
//   bankName,
//   bankCode,
//   branchCode,
//   swiftCode,
//   isEnabledBankTransfer,
//   codEmail,
//   isEnabledCod,
//   razorKey,
//   isEnabledRazor,
//   currencySymbol,
//   currencyShortForm,
//   emailAccount,
//   overallTax,
//   shippingTax,
//   refundPolicy,
//   termsLabel,
//   privacyPolicy,
//   standard_shipping_enable,
//   zone_shipping_enable,
//   no_shipping_enable,
//   shopCoverPhoto,
//   shopIconPhoto,
//   coverPhotoDimensions,
//   iconPhotoDimensions
// ) => {
//   const generateRandomId = () => {
//     const characters =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let id = "";
//     for (let i = 0; i < 10; i++) {
//       const randomIndex = Math.floor(Math.random() * characters.length);
//       id += characters[randomIndex];
//     }
//     return id;
//   };

//   return new Promise((resolve, reject) => {
//     db.beginTransaction((err) => {
//       if (err) {
//         return reject(err);
//       }

//       const query =
//         "INSERT INTO mk_shops (id,email,name, about_phone1, description, about_phone2, about_phone3, address1, address2, status, is_featured, about_website, facebook, google_plus, instagram, youtube, pinterest, twitter, whatsapp_no, messenger, stripe_publishable_key, stripe_secret_key, stripe_enabled, paypal_environment, paypal_merchant_id, paypal_public_key, paypal_private_key, paypal_enabled, bank_account, bank_name, bank_code, branch_code, swift_code, banktransfer_enabled, cod_email, cod_enabled, razor_key, razor_enabled, currency_symbol, currency_short_form, sender_email, overall_tax_value, shipping_tax_value, refund_policy, terms, privacy_policy, standard_shipping_enable, zone_shipping_enable, no_shipping_enable) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
//       const id = generateRandomId();
//       console.log("id checking===", id);
//       const values = [
//         id,
//         contactEmail,
//         name,
//         phone1,
//         description,
//         phone2,
//         phone3,
//         address1,
//         address2,
//         statusForPublish,
//         isFeatured,
//         aboutWebsiteLink,
//         facebook,
//         google,
//         instagram,
//         youtube,
//         pinterest,
//         twitter,
//         whatsappNumber,
//         messenger,
//         stripePublishableKey,
//         stripeSecretKey,
//         isEnabledStripe,
//         paypalEnvironment,
//         paypalMerchantId,
//         paypalPublicKey,
//         paypalPrivateKey,
//         isEnabledPaypal,
//         bankAccount,
//         bankName,
//         bankCode,
//         branchCode,
//         swiftCode,
//         isEnabledBankTransfer,
//         codEmail,
//         isEnabledCod,
//         razorKey,
//         isEnabledRazor,
//         currencySymbol,
//         currencyShortForm,
//         emailAccount,
//         overallTax,
//         shippingTax,
//         refundPolicy,
//         termsLabel,
//         privacyPolicy,
//         standard_shipping_enable ? 1 : 0,
//         zone_shipping_enable ? 1 : 0,
//         no_shipping_enable ? 1 : 0,
//       ];
//       db.query(query, values, (err, result) => {
//         if (err) {
//           return db.rollback(() => {
//             reject(err);
//           });
//         }

//         const shopId = result.insertId;
//         console.log("shop inserted id", shopId);

//         const shopTagsQuery = `
//           INSERT INTO mk_tags (shop_id, tag_text) VALUES (?,?)
//         `;
//         // const shopTagsValues = shopTags.map((tag) => [shopId, tag]);

//         // console.log(
//         //   "----------checking images------------",
//         //   shopCoverPhoto,
//         //   shopIconPhoto
//         // );
//         db.query(shopTagsQuery, [shopId, shopTags], (err, result) => {
//           if (err) {
//             return db.rollback(() => {
//               reject(err);
//             });
//           }

//           const shopImagesQuery = `
//             INSERT INTO mk_core_images (img_parent_id, img_path, img_height,img_width) VALUES (?,?,?,?)
//           `;

//           const shopImagesValues = [
//             {
//               shopId: shopId,
//               img_path: shopIconPhoto,
//               img_height: iconPhotoDimensions.height,
//               img_width: iconPhotoDimensions.width,
//             },
//             {
//               shopId: shopId,
//               img_path: shopCoverPhoto,
//               img_height: coverPhotoDimensions.height,
//               img_width: coverPhotoDimensions.width,
//             },
//           ];
//           const insertImagePromises = shopImagesValues.map((image) => {
//             return new Promise((resolve, reject) => {
//               db.query(
//                 shopImagesQuery,
//                 [
//                   image.shopId,
//                   image.img_path,
//                   image.img_height,
//                   image.img_width,
//                 ],
//                 (err, result) => {
//                   if (err) {
//                     reject(err);
//                   } else {
//                     resolve(result);
//                   }
//                 }
//               );
//             });
//           });

//           Promise.all(insertImagePromises)
//             .then(() => {
//               db.commit((err) => {
//                 if (err) {
//                   return db.rollback(() => {
//                     reject(err);
//                   });
//                 }
//                 resolve(shopId);
//               });
//             })
//             .catch((err) => {
//               db.rollback(() => {
//                 reject(err);
//               });
//             });
//         });
//       });
//     });
//   });
// };

const getAllShopModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        shop.*, 
        GROUP_CONCAT(img.img_path) AS img_paths 
      FROM 
        mk_shops AS shop 
      JOIN 
        mk_core_images AS img 
      ON 
        shop.id = img.img_parent_id 
      GROUP BY 
        shop.id;
    `;

    db.query(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      // Transform the result to split img_paths into an array
      const transformedResult = result.map((row) => {
        return {
          ...row,
          img_paths: row.img_paths.split(","),
        };
      });
      resolve(transformedResult);
    });
  });
};

// get shop by id model for edit
const getShopByIdModel = (id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM mk_shops WHERE id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

// delete api for shop
const deleteShopModel = (id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM mk_shops WHERE id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

module.exports = {
  createShopModel,
  getAllShopModel,
  getTagsModel,
  getShopByIdModel,
  deleteShopModel,
};
