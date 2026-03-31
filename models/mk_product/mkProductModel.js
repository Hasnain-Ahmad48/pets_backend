const db = require("../../config/DatabaseConnection");

const mkProductModel = (
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
  imagePaths, // Receive image paths
  featuredImage,
  newShopTags,
  brand_id,
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) {
        console.error("Transaction start error:", err);
        return reject(err);
      }

      const query = `INSERT INTO mk_products(
        shop_id, cat_id, sub_cat_id,  slug, name, description,
        original_price, search_tag, highlight_information, is_featured,featured_image,
        is_available, code, status, added_user_id, shipping_cost,
        minimum_order, product_unit, product_measurement,brand_id
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const values = [
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
        featuredImage,
        is_available,
        code,
        status,
        added_user_id,
        shipping_cost,
        minimum_order,
        product_unit,
        product_measurement,
        brand_id,
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Product insert error:", err);
          return db.rollback(() => {
            reject(err);
          });
        }

        const productId = result.insertId;

        // const colorQueries = colors.map(color => {
        //   return new Promise((resolve, reject) => {
        //     const colorQuery = `INSERT INTO mk_products_colors(product_id, color_value) VALUES (?, ?)`;
        //     db.query(colorQuery, [productId, color], (err, result) => {
        //       if (err) {
        //         console.error("Color insert error for color:", color, err);
        //         return reject(err);
        //       }
        //       resolve(result);
        //     });
        //   });
        // });

        const query = `INSERT INTO mk_product_tags (tag_id,product_id,added_user_id,status) VALUES (?,?,?,1)`;

        const insertTagPromises = newShopTags.map(tag => {
          return new Promise((resolve, reject) => {
            db.query(
              query,
              [Number(tag), productId, added_user_id],
              (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              },
            );
          });
        });

        const imageQueries = imagePaths.map(path => {
          return new Promise((resolve, reject) => {
            const imageQuery = `INSERT INTO mk_product_images(product_id, image) VALUES ( ?, ?)`;
            db.query(imageQuery, [productId, path], (err, result) => {
              if (err) {
                console.error("Image insert error for path:", path, err);
                return reject(err);
              }
              resolve(result);
            });
          });
        });

        Promise.all([...insertTagPromises, ...imageQueries])
          .then(results => {
            db.commit(err => {
              if (err) {
                console.error("Transaction commit error:", err);
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve({product: result, colors: results});
            });
          })
          .catch(err => {
            console.error("Insert errors:", err);
            db.rollback(() => {
              reject(err);
            });
          });
      });
    });
  });
};

const searchProducts = (query, limit = 20) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.id,p.name, 
             p.slug, 
             GROUP_CONCAT(DISTINCT img.image) AS images
      FROM mk_products AS p
      LEFT JOIN mk_product_images AS img ON p.id = img.product_id
      WHERE MATCH(p.name) AGAINST (? IN NATURAL LANGUAGE MODE)
      GROUP BY p.id
      ORDER BY p.id ASC
      LIMIT ?;
    `;

    db.query(sql, [`%${query}%`, limit], (err, result) => {
      if (err) {
        console.error("Search products error:", err);
        return reject(err);
      }

      const products = result.map(product => {
        const images = product.images ? product.images.split(",") : [];
        return {id: product.id, name: product.name, slug: product.slug, images};
      });

      resolve(products);
    });
  });
};

// const searchProducts = (query, limit = 20) => {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       SELECT p.*,
//              GROUP_CONCAT(DISTINCT c.color_value) AS colors,
//              GROUP_CONCAT(DISTINCT img.image) AS images,
//              cat.name AS categoryTitle,
//              sub.name AS subCategory,
//              s.name AS shopName,
//              COALESCE(d.percent, 0) AS discountPercentage
//       FROM mk_products AS p
//       LEFT JOIN mk_products_colors AS c ON p.id = c.product_id
//       LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id
//       LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id
//       LEFT JOIN mk_shops AS s ON p.shop_id = s.id
//       LEFT JOIN mk_product_images AS img ON p.id = img.product_id
//       LEFT JOIN (
//         SELECT product_id, discount_id, percent
//         FROM mk_products_discount AS pd
//         LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id
//         WHERE pd.added_date = (
//           SELECT MAX(added_date)
//           FROM mk_products_discount
//           WHERE product_id = pd.product_id
//         )
//       ) AS d ON p.id = d.product_id
//       WHERE MATCH(p.name) AGAINST (? IN NATURAL LANGUAGE MODE)
//       GROUP BY p.id
//       ORDER BY p.id ASC
//       LIMIT ?;
//     `;

//     db.query(sql, [`%${query}%`, limit], (err, result) => {
//       if (err) {
//         console.error("Search products error:", err);
//         return reject(err);
//       }

//       const products = result.map((product) => {
//         const colors = product.colors ? product.colors.split(",") : [];
//         const images = product.images ? product.images.split(",") : [];
//         return { ...product, colors, images };
//       });

//       resolve(products);
//     });
//   });
// };

// get all products with relation colors and category and sub category and shop

// var getAllProductsPagination = function (page, limit, callback) {
//   var query = `
//     SELECT
//       p.*,
//       GROUP_CONCAT(DISTINCT c.color_value) AS colors,
//       GROUP_CONCAT(DISTINCT img.image) AS images,
//       cat.name AS categoryTitle,
//       sub.name AS subCategory,
//       s.name AS shopName,
//       COALESCE(d.percent, 0) AS discountPercentage,
//       COUNT(*) OVER() AS total
//     FROM mk_products AS p
//     LEFT JOIN mk_products_colors AS c ON p.id = c.product_id
//     LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id
//     LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id
//     LEFT JOIN mk_shops AS s ON p.shop_id = s.id
//     LEFT JOIN mk_product_images AS img ON p.id = img.product_id
//     LEFT JOIN (
//         SELECT product_id, percent
//         FROM (
//             SELECT pd.product_id, d.percent,
//                   ROW_NUMBER() OVER (PARTITION BY pd.product_id ORDER BY pd.added_date DESC) as rn
//             FROM mk_products_discount pd
//             JOIN mk_discounts d ON pd.discount_id = d.id
//         ) ranked
//         WHERE rn = 1
//     ) d ON p.id = d.product_id
//     GROUP BY p.id
//     LIMIT ? OFFSET ?;
//   `;

//   const startIndex = (page - 1) * limit;

//   db.query(query, [limit, startIndex], function (err, result) {
//     if (err) return callback(err, null, null);

//     let total = 0;
//     if (result.length > 0) {
//       total = result[0].total; // pick total once
//     }

//     const processedResult = result.map(product => {
//       const { total, ...rest } = product; // remove total from each product
//       const colors = rest.colors ? rest.colors.split(",") : [];
//       const images = rest.images ? rest.images.split(",") : [];
//       return { ...rest, colors, images };
//     });

//     return callback(null, processedResult, total);
//   });
// };

var getAllProductsPagination = function (page, limit, filters, callback) {
  let query = `
  SELECT 
    p.*,
    GROUP_CONCAT(DISTINCT c.color_value) AS colors,
    GROUP_CONCAT(DISTINCT img.image) AS images,
    GROUP_CONCAT(DISTINCT t.name) AS tags,
    cat.name AS categoryTitle,
    sub.name AS subCategory,
    s.name AS shopName,
    b.name AS brandName,
    b.logo AS brandLogo,
    b.slug AS brandSlug,
    COALESCE(d.percent, 0) AS discountPercentage,
    COUNT(*) OVER() AS total
  FROM mk_products AS p
  LEFT JOIN mk_products_colors AS c ON p.id = c.product_id
  LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id
  LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id
  LEFT JOIN mk_shops AS s ON p.shop_id = s.id
  LEFT JOIN brands AS b ON p.brand_id = b.id
  LEFT JOIN mk_product_images AS img ON p.id = img.product_id
  LEFT JOIN mk_product_tags AS pt ON p.id = pt.product_id
  LEFT JOIN tags AS t ON pt.tag_id = t.id

  LEFT JOIN (
      SELECT product_id, percent
      FROM (
          SELECT 
            pd.product_id,
            d.percent,
            ROW_NUMBER() OVER (
              PARTITION BY pd.product_id 
              ORDER BY pd.added_date DESC
            ) AS rn
          FROM mk_products_discount pd
          JOIN mk_discounts d ON pd.discount_id = d.id
      ) ranked
      WHERE rn = 1
  ) d ON p.id = d.product_id
`;

  const conditions = [];
  const params = [];

  if (filters.cat_id) {
    conditions.push("p.cat_id = ?");
    params.push(filters.cat_id);
  }

  if (filters.sub_cat_id) {
    conditions.push("p.sub_cat_id = ?");
    params.push(filters.sub_cat_id);
  }

  if (filters.slug) {
    conditions.push("p.slug LIKE ?");
    params.push(`%${filters.slug}%`);
  }

  if (filters.name) {
    conditions.push("p.name LIKE ?");
    params.push(`%${filters.name}%`);
  }

  if (filters.original_price) {
    conditions.push("p.original_price = ?");
    params.push(filters.original_price);
  }

  // ✅ Brand filter (changed from 'brands' to use brand_id)
  if (filters.brands && filters.brands.length > 0) {
    conditions.push(
      `p.brand_id IN (${filters.brands.map(() => "?").join(",")})`,
    );
    params.push(...filters.brands);
  }

  if (filters.search_tag && filters.search_tag.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM mk_product_tags pt
        WHERE pt.product_id = p.id
        AND pt.tag_id IN (${filters.search_tag.map(() => "?").join(",")})
      )
    `);
    params.push(...filters.search_tag);
  }

  if (filters.min_price && filters.max_price) {
    conditions.push("p.original_price BETWEEN ? AND ?");
    params.push(filters.min_price, filters.max_price);
  } else if (filters.min_price) {
    conditions.push("p.original_price >= ?");
    params.push(filters.min_price);
  } else if (filters.max_price) {
    conditions.push("p.original_price <= ?");
    params.push(filters.max_price);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += `
    GROUP BY p.id
    LIMIT ? OFFSET ?;
  `;

  const startIndex = (page - 1) * limit;
  params.push(limit, startIndex);

  db.query(query, params, function (err, result) {
    if (err) return callback(err, null, null);

    let total = 0;
    if (result.length > 0) {
      total = result[0].total;
    }

    // const processedResult = result.map(product => {
    //   const {total, ...rest} = product;
    //   const colors = rest.colors ? rest.colors.split(",") : [];
    //   const images = rest.images ? rest.images.split(",") : [];
    //   return {
    //     ...rest,
    //     colors,
    //     images,
    //     brand: rest.brandName
    //       ? {
    //           name: rest.brandName,
    //           logo: rest.brandLogo,
    //           slug: rest.brandSlug,
    //         }
    //       : null,
    //   };
    // });

    const processedResult = result.map(row => {
      const {
        brandName,
        brandLogo,
        brandSlug,
        colors,
        images,
        tags,
        search_tag,
        ...product
      } = row;

      return {
        ...product,
        colors: colors ? colors.split(",") : [],
        images: images ? images.split(",") : [],
        tags: tags ? tags.split(",") : [],
        brand: brandName
          ? {
              name: brandName,
              logo: brandLogo,
              slug: brandSlug,
            }
          : null,
      };
    });

    return callback(null, processedResult, total);
  });
};

const getAllProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            GROUP BY p.id;
        `;

    db.query(query, (err, result) => {
      if (err) {
        console.error("Get all products error:", err);
        return reject(err);
      }

      const products = result.map(product => {
        const colors = product.colors ? product.colors.split(",") : [];
        const images = product.images ? product.images.split(",") : [];

        const brand = product.brandName
          ? {
              name: product.brandName,
              logo: product.brandLogo,
              slug: product.brandSlug,
            }
          : null;

        // ❌ remove duplicate fields
        delete product.brandName;
        delete product.brandLogo;
        delete product.brandSlug;

        return {
          ...product,
          colors,
          images,
          brand,
        };
      });

      resolve(products);
    });
  });
};

const getFilterProducts = slug => {
  return new Promise((resolve, reject) => {
    let query = null; // Use let instead of const for reassignment
    const value = [];
    let catId = 0; // Initialize catId properly

    // Check if slug is provided
    if (slug !== "products") {
      query = "SELECT id FROM mk_categories WHERE slug = ?";
      db.query(query, [slug], (err, result) => {
        if (err) {
          return reject(err); // Properly reject if error occurs
        }

        if (result.length > 0) {
          catId = result[0].id;
        }

        // After fetching the category ID, proceed with product query
        fetchProducts(catId, resolve, reject);
      });
    } else {
      // If no slug is provided, fetch all products
      fetchProducts(catId, resolve, reject);
    }
  });
};
const fetchProducts = (catId, resolve, reject) => {
  let query = null;
  const value = [];

  if (catId === 0) {
    query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            GROUP BY p.id;
        `;
  } else {
    query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            WHERE p.cat_id = ? 
            GROUP BY p.id
        `;
    value.push(catId);
  }

  db.query(query, value, (err, result) => {
    if (err) {
      console.error("Get all products error:", err);
      return reject(err);
    }

    const products = result.map(product => {
      const colors = product.colors ? product.colors.split(",") : [];
      const images = product.images ? product.images.split(",") : [];
      return {
        ...product,
        colors,
        images,
        brand: product.brandName
          ? {
              name: product.brandName,
              logo: product.brandLogo,
              slug: product.brandSlug,
            }
          : null,
      };
    });

    resolve(products);
  });
};

const getFilterPriceProducts = (fromPrice, toPrice, slug) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            WHERE p.original_price BETWEEN ? AND ?
            GROUP BY p.id
        `;

    const value = [fromPrice, toPrice];

    db.query(query, value, (err, result) => {
      if (err) {
        console.error("Get all products error:", err);
        return reject(err);
      }

      const products = result.map(product => {
        const colors = product.colors ? product.colors.split(",") : [];
        const images = product.images ? product.images.split(",") : [];
        return {
          ...product,
          colors,
          images,
          brand: product.brandName
            ? {
                name: product.brandName,
                logo: product.brandLogo,
                slug: product.brandSlug,
              }
            : null,
        };
      });

      resolve(products);
    });
  });
};

const getProductsSubCategory = subCategory => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN (
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = (
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id
                )
            ) AS d ON p.id = d.product_id 
            WHERE sub.name = ? 
            GROUP BY p.id
        `;

    const value = [subCategory];

    db.query(query, value, (err, result) => {
      console.log(result, "result");
      if (err) {
        console.error("Get all products error:", err);
        return reject(err);
      }

      const products = result.map(product => {
        const colors = product.colors ? product.colors.split(",") : [];
        const images = product.images ? product.images.split(",") : [];
        return {
          ...product,
          colors,
          images,
          brand: product.brandName
            ? {
                name: product.brandName,
                logo: product.brandLogo,
                slug: product.brandSlug,
              }
            : null,
        };
      });

      resolve(products);
    });
  });
};

const getAllProductsByShopId = shop_id => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        p.*,
        GROUP_CONCAT(DISTINCT c.color_value) AS colors,
        GROUP_CONCAT(DISTINCT img.image) AS images,
        cat.title AS categoryTitle,
        sub.name AS subCategory,
        s.name AS shopName
      FROM mk_products AS p
      LEFT JOIN mk_products_colors AS c ON p.id = c.product_id
      LEFT JOIN breedcategory AS cat ON p.cat_id = cat.id
      LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id
      LEFT JOIN mk_shops AS s ON p.shop_id = s.id
      LEFT JOIN mk_product_images AS img ON p.id = img.product_id
      WHERE p.shop_id = ?
      GROUP BY p.id
    `;

    db.query(query, [shop_id], (err, result) => {
      if (err) {
        console.error("Get all products by shop_id error:", err);
        return reject(err);
      }

      const products = result.map(product => {
        const colors = product.colors ? product.colors.split(",") : [];
        const images = product.images ? product.images.split(",") : [];
        return {...product, colors, images};
      });

      resolve(products);
    });
  });
};

const getProductById = productId => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.id AS brandId,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            b.description AS brandDescription,
            b.website AS brandWebsite,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            WHERE p.id = ? 
            GROUP BY p.id;
        `;

    db.query(query, [productId], (err, result) => {
      if (err) {
        console.error("Get product by ID error:", err);
        return reject(err);
      }

      if (result.length === 0) {
        return reject(new Error("Product not found"));
      }
      const product = result[0];
      const colors = product.colors ? product.colors.split(",") : [];
      const images = product.images ? product.images.split(",") : [];
      const formattedProduct = {
        ...product,
        colors,
        images,
        brand: product.brandName
          ? {
              id: product.brandId,
              name: product.brandName,
              logo: product.brandLogo,
              slug: product.brandSlug,
              description: product.brandDescription,
              website: product.brandWebsite,
            }
          : null,
      };

      resolve(formattedProduct);
    });
  });
};

const updateProductById = (
  productId,
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
  images,
  colors,
  featuredImage,
) => {
  return new Promise((resolve, reject) => {
    const updateProductQuery = `
      UPDATE mk_products
      SET
        shop_id = ?,
        cat_id = ?,
        sub_cat_id = ?,
        slug = ?,
        name = ?,
        description = ?,
        original_price = ?,
        search_tag = ?,
        highlight_information = ?,
        is_featured = ?,
        featured_image = ?,
        is_available = ?,
        code = ?,
        status = ?,
        added_user_id = ?,
        shipping_cost = ?,
        minimum_order = ?,
        product_unit = ?,
        product_measurement = ?
      WHERE id = ?`;

    const deleteColorsQuery = `
      DELETE FROM mk_product_images
      WHERE product_id = ?`;

    const insertColorsQuery = `
      INSERT INTO mk_product_images (product_id, image)
      VALUES ?`;

    const deleteImagesQuery = `
      DELETE FROM mk_products_colors
      WHERE product_id = ?`;

    const insertImagesQuery = `
      INSERT INTO mk_products_colors (product_id, color_value)
      VALUES ?`;

    db.beginTransaction(err => {
      if (err) return reject(err);

      db.query(
        updateProductQuery,
        [
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
          featuredImage,
          is_available,
          code,
          status,
          added_user_id,
          shipping_cost,
          minimum_order,
          product_unit,
          product_measurement,
          productId,
        ],
        (err, result) => {
          if (err) {
            return db.rollback(() => {
              reject(err);
            });
          }

          const updateColors = () => {
            if (colors.length > 0) {
              db.query(deleteColorsQuery, [productId], (err, result) => {
                if (err) {
                  return db.rollback(() => {
                    reject(err);
                  });
                }

                const colorValues = colors.map(color => [productId, color]);
                db.query(insertColorsQuery, [colorValues], (err, result) => {
                  if (err) {
                    return db.rollback(() => {
                      reject(err);
                    });
                  }

                  updateImages();
                });
              });
            } else {
              updateImages();
            }
          };

          const updateImages = () => {
            if (images.length > 0) {
              db.query(deleteImagesQuery, [productId], (err, result) => {
                if (err) {
                  return db.rollback(() => {
                    reject(err);
                  });
                }

                const imageValues = images.map(image => [productId, image]);
                db.query(insertImagesQuery, [imageValues], (err, result) => {
                  if (err) {
                    return db.rollback(() => {
                      reject(err);
                    });
                  }

                  db.commit(err => {
                    if (err) {
                      return db.rollback(() => {
                        reject(err);
                      });
                    }
                    resolve(result);
                  });
                });
              });
            } else {
              db.commit(err => {
                if (err) {
                  return db.rollback(() => {
                    reject(err);
                  });
                }
                resolve(result);
              });
            }
          };

          updateColors();
        },
      );
    });
  });
};

const deleteProductById = productId => {
  return new Promise((resolve, reject) => {
    const query = "DELETE FROM mk_products WHERE id = ?";
    db.query(query, [productId], (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

const getAllFeaturedProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            WHERE p.is_featured = 1 
            GROUP BY p.id;
        `;

    db.query(query, (err, result) => {
      if (err) {
        console.error("Get all products error:", err);
        return reject(err);
      }

      console.log("Get all products result: ", result);

      const products = result.map(product => {
        const colors = product.colors ? product.colors.split(",") : [];
        const images = product.images ? product.images.split(",") : [];
        return {
          ...product,
          colors,
          images,
          brand: product.brandName
            ? {
                name: product.brandName,
                logo: product.brandLogo,
                slug: product.brandSlug,
              }
            : null,
        };
      });

      resolve(products);
    });
  });
};

// get all images by product_id
const getProductImages = productId => {
  return new Promise((resolve, reject) => {
    const query = `SELECT image_id,image FROM mk_product_images WHERE product_id = ?`;
    db.query(query, [productId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// delete images from mk_product_images
const deleteProductImages = id => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM mk_product_images WHERE image_id =?`;
    db.query(query, [id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var checkSlugExists = function (slug) {
  return new Promise(function (resolve, reject) {
    var sql = "SELECT * FROM mk_products WHERE slug = ?";
    db.query(sql, [slug], function (err, result) {
      if (err) {
        console.error("Database query error:", err);
        reject(err);
      } else {
        resolve(result.length > 0);
      }
    });
  });
};

const getProductBySlug = slug => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT p.*, GROUP_CONCAT(DISTINCT c.color_value) AS colors, GROUP_CONCAT(DISTINCT img.image) AS images, cat.name AS categoryTitle, sub.name AS subCategory, s.name AS shopName, COALESCE(d.percent, 0) AS discountPercentage FROM mk_products AS p LEFT JOIN mk_products_colors AS c ON p.id = c.product_id LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id LEFT JOIN mk_shops AS s ON p.shop_id = s.id LEFT JOIN mk_product_images AS img ON p.id = img.product_id LEFT JOIN ( SELECT product_id, discount_id, percent FROM mk_products_discount AS pd LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id WHERE pd.added_date = ( SELECT MAX(added_date) FROM mk_products_discount WHERE product_id = pd.product_id ) ) AS d ON p.id = d.product_id 
      WHERE p.slug = ? 
      LIMIT 1;

    `;
    db.query(query, [slug], (err, result) => {
      if (err) {
        console.error("Get product by ID error:", err);
        return reject(err);
      }

      if (result.length === 0) {
        return reject(new Error("Product not found"));
      }

      const product = result[0];
      const colors = product.colors ? product.colors.split(",") : [];
      const images = product.images ? product.images.split(",") : [];
      const formattedProduct = {...product, colors, images};

      resolve(formattedProduct);
    });
  });
};

const createOrderModel2 = (
  user_id,
  shop_id,
  sub_total_amount,
  discount_amount,
  coupon_discount_amount,
  tax_amount,
  tax_percent,
  shipping_amount,
  shipping_tax_percent,
  shipping_method_amount,
  shipping_method_name,
  balance_amount,
  total_item_amount,
  total_item_count,
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
  product_id,
  originalPrice,
  pricePerUnit,
  quantity,
  product_unit,
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      const headerQuery = `INSERT INTO mk_transactions_header (
                user_id,
                shop_id,
                sub_total_amount,
                discount_amount,
                coupon_discount_amount,
                tax_amount,
                tax_percent,
                shipping_amount,
                shipping_tax_percent,
                shipping_method_amount,
                shipping_method_name,
                balance_amount,
                total_item_amount,
                total_item_count,
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
                shipping_phone
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const headerValues = [
        user_id,
        shop_id,
        sub_total_amount,
        discount_amount,
        coupon_discount_amount,
        tax_amount,
        tax_percent,
        shipping_amount,
        shipping_tax_percent,
        shipping_method_amount,
        shipping_method_name,
        balance_amount,
        total_item_amount,
        total_item_count,
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
      ];

      db.query(headerQuery, headerValues, (err, result) => {
        if (err) {
          return db.rollback(() => {
            reject(err);
          });
        }

        const header_id = result.insertId;

        const detailQuery = `INSERT INTO mk_transactions_detail (
                    shop_id,
                    transactions_header_id,
                    product_id,
                    original_price,
                    price,
                    qty,
                    added_user_id,
                    currency_symbol,
                    currency_short_form,
                    product_unit,
                    shipping_cost
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

        const detailValues = [
          shop_id,
          header_id,
          product_id,
          original_price,
          price,
          qty,
          added_user_id,
          currency_symbol,
          currency_short_form,
          product_unit,
          shipping_cost,
        ];

        db.query(detailQuery, detailValues, (err, result) => {
          if (err) {
            return db.rollback(() => {
              reject(err);
            });
          }

          // Update user_signup table
          const updateSignupQuery = `UPDATE user_signup SET 
                        billing_first_name = ?,
                        billing_last_name = ?,
                        billing_company = ?,
                        billing_address_1 = ?,
                        billing_address_2 = ?,
                        billing_country = ?,
                        billing_state = ?,
                        billing_city = ?,
                        billing_postal_code = ?,
                        billing_email = ?,
                        billing_phone = ?,
                        shipping_first_name = ?,
                        shipping_last_name = ?,
                        shipping_company = ?,
                        shipping_address_1 = ?,
                        shipping_address_2 = ?,
                        shipping_country = ?,
                        shipping_state = ?,
                        shipping_city = ?,
                        shipping_postal_code = ?,
                        shipping_email = ?,
                        shipping_phone = ?
                    WHERE id = ?`;

          const updateSignupValues = [
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
            user_id,
          ];

          db.query(updateSignupQuery, updateSignupValues, (err, result) => {
            if (err) {
              return db.rollback(() => {
                reject(err);
              });
            }

            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve({result, insertId: header_id});
            });
          });
        });
      });
    });
  });
};

const createOrderModel = (
  order_id,
  user_id,
  shop_id,
  sub_total_amount,
  discount_amount,
  coupon_discount_amount,
  tax_amount,
  tax_percent,
  shipping_amount,
  shipping_tax,
  shipping_method_amount,
  shipping_method,
  balance_amount,
  total_item_amount,
  total_item_count,
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
  Items,
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      const headerQuery = `INSERT INTO mk_transactions_header (
                order_no,
                user_id,
                shop_id,
                sub_total_amount,
                discount_amount,
                coupon_discount_amount,
                tax_amount,
                tax_percent,
                shipping_amount,
                shipping_tax_percent,
                shipping_method_amount,
                shipping_method_name,
                balance_amount,
                total_item_amount,
                total_item_count,
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
                shipping_phone
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const headerValues = [
        order_id,
        user_id,
        shop_id,
        sub_total_amount,
        discount_amount,
        coupon_discount_amount,
        tax_amount,
        tax_percent,
        shipping_amount,
        shipping_tax,
        shipping_method_amount,
        shipping_method,
        balance_amount,
        total_item_amount,
        total_item_count,
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
      ];

      db.query(headerQuery, headerValues, (err, result) => {
        if (err) {
          return db.rollback(() => {
            reject(err);
          });
        }

        const header_id = result.insertId;

        const detailQuery = `INSERT INTO mk_transactions_detail (
                    shop_id,
                    transactions_header_id,
                    product_id,
                    product_name,
                    original_price,
                    price,discount_amount,
                    qty,discount_value,discount_percent,
                    added_user_id,
                    currency_symbol,
                    currency_short_form,
                    product_unit,
                    shipping_cost
                ) VALUES ?`;

        const detailValues = Items.map(item => [
          shop_id,
          header_id,
          item.product_id,
          item.product_name,
          item.original_price,
          item.price,
          item.discount_amount,
          item.qty,
          item.discount_value,
          item.discount_percentage,
          added_user_id,
          currency_symbol,
          currency_short_form,
          item.product_unit,
          item.shipping_cost,
        ]);
        // const detailValues = [
        //     shop_id,
        //     header_id,
        //     product_id,
        //     original_price,
        //     price,
        //     qty,
        //     added_user_id,
        //     currency_symbol,
        //     currency_short_form,
        //     product_unit,
        //     shipping_cost
        // ];

        db.query(detailQuery, [detailValues], (err, result) => {
          if (err) {
            return db.rollback(() => {
              reject(err);
            });
          }

          // Update user_signup table
          const updateSignupQuery = `UPDATE user_signup SET 
                        billing_first_name = ?,
                        billing_last_name = ?,
                        billing_company = ?,
                        billing_address_1 = ?,
                        billing_address_2 = ?,
                        billing_country = ?,
                        billing_state = ?,
                        billing_city = ?,
                        billing_postal_code = ?,
                        billing_email = ?,
                        billing_phone = ?,
                        shipping_first_name = ?,
                        shipping_last_name = ?,
                        shipping_company = ?,
                        shipping_address_1 = ?,
                        shipping_address_2 = ?,
                        shipping_country = ?,
                        shipping_state = ?,
                        shipping_city = ?,
                        shipping_postal_code = ?,
                        shipping_email = ?,
                        shipping_phone = ?
                    WHERE id = ?`;

          const updateSignupValues = [
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
            user_id,
          ];

          db.query(updateSignupQuery, updateSignupValues, (err, result) => {
            if (err) {
              return db.rollback(() => {
                reject(err);
              });
            }

            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve({result, insertId: header_id});
            });
          });
        });
      });
    });
  });
};

// const createOrderModel = (
//     user_id,
//     shop_id,
//     sub_total_amount,
//     shipping_amount,
//     balance_amount,
//     total_item_amount,
//     total_item_count,
//     contact_name,
//     contact_phone,
//     payment_method,
//     added_user_id,
//     trans_status_id,
//     currency_symbol,
//     currency_short_form,
//     billing_first_name,
//     billing_last_name,
//     billing_company,
//     billing_address_1,
//     billing_address_2,
//     billing_country,
//     billing_state,
//     billing_city,
//     billing_postal_code,
//     billing_email,
//     billing_phone,
//     shipping_first_name,
//     shipping_last_name,
//     shipping_company,
//     shipping_address_1,
//     shipping_address_2,
//     shipping_country,
//     shipping_state,
//     shipping_city,
//     shipping_postal_code,
//     shipping_email,
//     shipping_phone,
//     product_id,
//     original_price,
//     price,
//     qty,
//     product_unit,
//     shipping_cost
// ) => {
//     return new Promise((resolve, reject) => {
//         db.beginTransaction((err) => {
//             if (err) return reject(err);

//             const headerQuery = `INSERT INTO mk_transactions_header (
//   user_id,
//   shop_id,
//   sub_total_amount,
//   shipping_amount,
//   balance_amount,
//   total_item_amount,
//   total_item_count,
//   contact_name,
//   contact_phone,
//   payment_method,
//   added_user_id,
//   trans_status_id,
//   currency_symbol,
//   currency_short_form,
//   billing_first_name,
//   billing_last_name,
//   billing_company,
//   billing_address_1,
//   billing_address_2,
//   billing_country,
//   billing_state,
//   billing_city,
//   billing_postal_code,
//   billing_email,
//   billing_phone,
//   shipping_first_name,
//   shipping_last_name,
//   shipping_company,
//   shipping_address_1,
//   shipping_address_2,
//   shipping_country,
//   shipping_state,
//   shipping_city,
//   shipping_postal_code,
//   shipping_email,
//   shipping_phone
// ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

//             const headerValues = [
//                 user_id,
//                 shop_id,
//                 sub_total_amount,
//                 shipping_amount,
//                 balance_amount,
//                 total_item_amount,
//                 total_item_count,
//                 contact_name,
//                 contact_phone,
//                 payment_method,
//                 added_user_id,
//                 trans_status_id,
//                 currency_symbol,
//                 currency_short_form,
//                 billing_first_name,
//                 billing_last_name,
//                 billing_company,
//                 billing_address_1,
//                 billing_address_2,
//                 billing_country,
//                 billing_state,
//                 billing_city,
//                 billing_postal_code,
//                 billing_email,
//                 billing_phone,
//                 shipping_first_name,
//                 shipping_last_name,
//                 shipping_company,
//                 shipping_address_1,
//                 shipping_address_2,
//                 shipping_country,
//                 shipping_state,
//                 shipping_city,
//                 shipping_postal_code,
//                 shipping_email,
//                 shipping_phone
//             ];

//             db.query(headerQuery, headerValues, (err, result) => {
//                 if (err) {
//                     return db.rollback(() => {
//                         reject(err);
//                     });
//                 }

//             const header_id = result.insertId

//                 const detailQuery = `INSERT INTO mk_transactions_detail (
//   shop_id,
//  transactions_header_id,
//   product_id,
//   original_price,
//   price,
//   qty,
//   added_user_id,
//   currency_symbol,
//   currency_short_form,
//   product_unit,
//   shipping_cost
// ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

//                 const detailValues = [
//                     shop_id,
//                    header_id,
//                     product_id,
//                     original_price,
//                     price,
//                     qty,
//                     added_user_id,
//                     currency_symbol,
//                     currency_short_form,
//                     product_unit,
//                     shipping_cost
//                 ];

//                 db.query(detailQuery, detailValues, (err, result) => {
//                     if (err) {
//                         return db.rollback(() => {
//                             reject(err);
//                         });
//                     }

//                     db.commit((err) => {
//                         if (err) {
//                             return db.rollback(() => {
//                                 reject(err);
//                             });
//                         }
//                         resolve(result);
//                     });
//                 });
//             });
//         });
//     });
// };

// with pagination
const getAllOrders = (user_id = null, limit = 20, offset = 0) => {
  return new Promise((resolve, reject) => {
    let baseQuery = `
      FROM mk_transactions_header AS h
      LEFT JOIN mk_transactions_status AS ts ON h.trans_status_id = ts.id
      LEFT JOIN mk_shops AS s ON h.shop_id = s.id
      LEFT JOIN user_signup AS u ON h.user_id = u.id
    `;

    const values = [];
    if (user_id) {
      baseQuery += ` WHERE h.user_id = ?`;
      values.push(user_id);
    }

    const dataQuery = `
      SELECT 
        h.id AS transaction_id,
        h.added_date,
        h.sub_total_amount,
        h.shipping_amount,
        h.total_item_count,
        h.total_item_amount,
        h.contact_name,
        h.contact_phone,
        h.order_no,
        s.id AS shopId,
        s.name AS shopName,
        s.description AS shopDescription,
        s.email AS shopEmail,
        u.email,
        u.firstName,
        u.lastName,
        ts.title AS statusTitle
      ${baseQuery}
      ORDER BY h.added_date DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(*) AS totalCount ${baseQuery}`;

    db.query(countQuery, values, (countErr, countRes) => {
      if (countErr) return reject(countErr);

      const totalCount = countRes[0]?.totalCount || 0;

      db.query(dataQuery, [...values, limit, offset], (dataErr, dataRes) => {
        if (dataErr) return reject(dataErr);
        resolve({
          totalCount,
          data: dataRes,
        });
      });
    });
  });
};

// Deprecated
const getAllOrdersModel = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT 
                h.id AS transaction_id,
                h.added_date,
                h.sub_total_amount,
                h.shipping_amount,
                h.total_item_count,
                 h.total_item_amount,
                h.contact_name,
                h.contact_phone,
                h.order_no,
                d.original_price,
                d.product_unit,
                d.qty AS quantity,
                p.name AS productName,
                s.id AS shopId,
                s.name AS shopName,
                s.description AS shopDescription,
                s.email AS shopEmail,
                u.email,
                u.firstName,
                u.lastName ,
                mk.image,
                ts.title AS statusTitle

            FROM mk_transactions_header AS h
            LEFT JOIN mk_transactions_status AS ts ON h.trans_status_id = ts.id
            LEFT JOIN mk_transactions_detail AS d ON h.id = d.id
            LEFT JOIN mk_shops AS s ON h.shop_id = s.id
            LEFT JOIN user_signup AS u ON h.user_id = u.id
            LEFT JOIN mk_products AS p ON d.product_id = p.id
            LEFT JOIN mk_product_images AS mk ON p.id = mk.product_id
            
            `;

    db.query(query, (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  });
};

// const getAllOrdersModelById = (id) => {
//     return new Promise((resolve, reject) => {
//         const query = `
//             SELECT
//                 h.id AS orderId,
//                 h.*,
//                 d.original_price,
//                 d.product_unit,
//                 d.qty,
//                 d.shipping_cost,
//                 p.id AS productId,
//                 p.name AS productName,
//                 s.id AS shopId,
//                 s.name AS shopName,
//                 s.description AS shopDescription,
//                 s.email AS shopEmail,
//                 u.email AS userEmail,
//                 u.firstName,
//                 u.lastName,
//                 mk.image,
//                 ts.title AS statusTitle
//             FROM mk_transactions_header AS h
//             LEFT JOIN mk_transactions_status AS ts ON h.trans_status_id = ts.id
//             LEFT JOIN mk_transactions_detail AS d ON h.id = d.id
//             LEFT JOIN mk_shops AS s ON h.shop_id = s.id
//             LEFT JOIN user_signup AS u ON h.user_id = u.id
//             LEFT JOIN mk_products AS p ON d.product_id = p.id
//             LEFT JOIN mk_product_images AS mk ON p.id = mk.product_id
//             WHERE h.id = ?
//         `;

//         db.query(query, [id], (error, results) => {
//             if (error) {
//                 return reject(error);
//             }

//             if (results.length === 0) {
//                 return resolve(null); // Handle no results
//             }

//             const order = {
//                 orderId: results[0].orderId,
//                 ...results[0],
//                 products: [],
//             };

//             results.forEach(row => {
//                 const product = {
//                     productId: row.productId,
//                     productName: row.productName,
//                     originalPrice: row.original_price,
//                     productUnit: row.product_unit,
//                     quantity: row.quantity,
//                     image: row.image,
//                 };

//                 order.products.push(product);
//             });

//             resolve(order);
//         });
//     });
// };

const getAllOrdersModelById = orderId => {
  return new Promise((resolve, reject) => {
    const baseQuery = `
      FROM mk_transactions_header AS h
      LEFT JOIN mk_transactions_status AS ts ON h.trans_status_id = ts.id
      LEFT JOIN mk_shops AS s ON h.shop_id = s.id
      LEFT JOIN user_signup AS u ON h.user_id = u.id
      LEFT JOIN mk_transactions_detail AS d ON h.id = d.transactions_header_id
       LEFT JOIN mk_product_images AS mk ON d.product_id = mk.product_id
      LEFT JOIN mk_transaction_reviews AS r ON h.id = r.order_id

       WHERE h.id = ?
    `;

    const dataQuery = `
      SELECT 
        h.id AS orderId,
        h.order_no,
        h.user_id,
        h.razor_id,
        h.shop_id,
        h.sub_total_amount,
        h.discount_amount,
        h.coupon_discount_amount,
        h.tax_amount,
        h.tax_percent,
        h.shipping_amount,
        h.shipping_tax_percent,
        h.shipping_method_amount,
        h.shipping_method_name,
        h.balance_amount,
        h.total_item_amount,
        h.total_item_count,
        h.contact_name,
        h.contact_phone,
        h.payment_method,
        h.added_date,
        h.added_user_id,
        h.updated_date,
        h.updated_user_id,
        h.updated_flag,
        h.trans_status_id,
        h.currency_symbol,
        h.currency_short_form,
        h.trans_code,
        h.billing_first_name,
        h.billing_last_name,
        h.billing_company,
        h.billing_address_1,
        h.billing_address_2,
        h.billing_country,
        h.billing_state,
        h.billing_city,
        h.billing_postal_code,
        h.billing_email,
        h.billing_phone,
        h.shipping_first_name,
        h.shipping_last_name,
        h.shipping_company,
        h.shipping_address_1,
        h.shipping_address_2,
        h.shipping_country,
        h.shipping_state,
        h.shipping_city,
        h.shipping_postal_code,
        h.shipping_email,
        h.shipping_phone,
        h.memo,
        h.is_zone_shipping,

        s.id AS shopId,
        s.name AS shopName,
        s.description AS shopDescription,
        s.email AS shopEmail,

        u.email AS userEmail,
        u.firstName,
        u.lastName,
        ts.title AS statusTitle,

        -- Detail Table Columns
        d.product_id AS productId,
        d.product_name AS productName,
        d.product_attribute_id AS productAttributeId,
        d.product_attribute_name AS productAttributeName,
        d.product_attribute_price AS productAttributePrice,
        d.product_color_id AS productColorId,
        d.product_color_code AS productColorCode,
        d.original_price AS originalPrice,
        d.price AS price,
        d.discount_amount AS discountAmount,
        d.discount_value AS discountValue,
        d.discount_percent AS discountPercent,
        d.qty AS quantity,
        d.currency_symbol AS currencySymbol,
        d.currency_short_form AS currencyShortForm,
        d.product_measurement AS productMeasurement,
        d.product_unit AS productUnit,
        d.shipping_cost AS shippingCost,
        
        -- Product Images
        mk.image AS image,
        -- Review
        r.rating AS reviewRating,
        r.review AS reviewComment,
        r.created_at AS reviewDate
      ${baseQuery}
      ORDER BY d.id ASC
    `;

    db.query(dataQuery, [orderId], (err, result) => {
      if (err) return reject(err);

      if (!result || result.length === 0) {
        return resolve(null);
      }

      const order = {
        orderId: result[0].orderId,
        order_no: result[0].order_no,
        user_id: result[0].user_id,
        // razor_id: result[0].razor_id,
        // shop_id: result[0].shop_id,
        sub_total_amount: result[0].sub_total_amount,
        discount_amount: result[0].discount_amount,
        coupon_discount_amount: result[0].coupon_discount_amount,
        tax_amount: result[0].tax_amount,
        tax_percent: result[0].tax_percent,
        shipping_amount: result[0].shipping_amount,
        shipping_tax_percent: result[0].shipping_tax_percent,
        shipping_method_amount: result[0].shipping_method_amount,
        shipping_method_name: result[0].shipping_method_name,
        balance_amount: result[0].balance_amount,
        total_item_amount: result[0].total_item_amount,
        total_item_count: result[0].total_item_count,
        contact_name: result[0].contact_name,
        contact_phone: result[0].contact_phone,
        payment_method: result[0].payment_method,
        added_date: result[0].added_date,
        // added_user_id: result[0].added_user_id,
        updated_date: result[0].updated_date,
        // updated_user_id: result[0].updated_user_id,
        updated_flag: result[0].updated_flag,
        trans_status_id: result[0].trans_status_id,
        currency_symbol: result[0].currency_symbol,
        currency_short_form: result[0].currency_short_form,
        trans_code: result[0].trans_code,
        billing_first_name: result[0].billing_first_name,
        billing_last_name: result[0].billing_last_name,
        billing_company: result[0].billing_company,
        billing_address_1: result[0].billing_address_1,
        billing_address_2: result[0].billing_address_2,
        billing_country: result[0].billing_country,
        billing_state: result[0].billing_state,
        billing_city: result[0].billing_city,
        billing_postal_code: result[0].billing_postal_code,
        billing_email: result[0].billing_email,
        billing_phone: result[0].billing_phone,
        shipping_first_name: result[0].shipping_first_name,
        shipping_last_name: result[0].shipping_last_name,
        shipping_company: result[0].shipping_company,
        shipping_address_1: result[0].shipping_address_1,
        shipping_address_2: result[0].shipping_address_2,
        shipping_country: result[0].shipping_country,
        shipping_state: result[0].shipping_state,
        shipping_city: result[0].shipping_city,
        shipping_postal_code: result[0].shipping_postal_code,
        shipping_email: result[0].shipping_email,
        shipping_phone: result[0].shipping_phone,
        memo: result[0].memo,
        is_zone_shipping: result[0].is_zone_shipping,

        shop: {
          id: result[0].shopId,
          name: result[0].shopName,
          description: result[0].shopDescription,
          email: result[0].shopEmail,
        },

        user: {
          email: result[0].userEmail,
          firstName: result[0].firstName,
          lastName: result[0].lastName,
        },

        statusTitle: result[0].statusTitle,

        review: result[0].reviewRating
          ? {
              rating: result[0].reviewRating,
              comment: result[0].reviewComment,
              date: result[0].reviewDate,
            }
          : null,

        products: Object.values(
          result.reduce((acc, row) => {
            if (!row.productId) return acc;

            if (!acc[row.productId]) {
              acc[row.productId] = {
                productId: row.productId,
                productName: row.productName,
                productAttributeId: row.productAttributeId,
                productAttributeName: row.productAttributeName,
                productAttributePrice: row.productAttributePrice,
                productColorId: row.productColorId,
                productColorCode: row.productColorCode,
                originalPrice: row.originalPrice,
                price: row.price,
                discountAmount: row.discountAmount,
                discountValue: row.discountValue,
                discountPercent: row.discountPercent,
                quantity: row.quantity,
                currencySymbol: row.currencySymbol,
                currencyShortForm: row.currencyShortForm,
                productMeasurement: row.productMeasurement,
                productUnit: row.productUnit,
                shippingCost: row.shippingCost,
                images: [],
              };
            }

            if (row.imageId || row.image) {
              acc[row.productId].images.push({
                image: row.image,
              });
            }

            return acc;
          }, {}),
        ),
      };

      resolve(order);
    });
  });
};

// delete orders
const deleteOrders = id => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM mk_transactions_header WHERE id =?`;
    db.query(query, [id], (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

const getOrderStatus = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM mk_transactions_status`;
    db.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

const updateOrderStatus = (id, status) => {
  return new Promise((resolve, reject) => {
    const query = `UPDATE mk_transactions_header SET trans_status_id = ? WHERE id = ?`;
    db.query(query, [status, id], (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

const getTransactionRecord = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM transaction_record WHERE order_id IS NOT NULL`;
    db.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

//create discount model

// const createDiscount = (shop_id, name, discount, isPublish, image, productId) => {
//     return new Promise((resolve, reject) => {
//         db.beginTransaction((err) => {
//             if (err) {
//                 return reject(err);
//             }

//             // Insert into mk_discounts
//             const discountQuery = `INSERT INTO mk_discounts (shop_id, name, percent, status) VALUES (?, ?, ?, ?)`;
//             const discountValues = [shop_id, name, discount, isPublish];

//             db.query(discountQuery, discountValues, (error, result) => {
//                 if (error) {
//                     return db.rollback(() => reject(error));
//                 }

//                 const discountId = result.insertId; // Get the inserted discount ID

//                 // Insert into mk_discount_image
//                 const imageQuery = `INSERT INTO mk_discount_image (discount_id, image) VALUES (?, ?)`;
//                 const imageValues = [discountId, image];

//                 db.query(imageQuery, imageValues, (imageErr, imageResult) => {
//                     if (imageErr) {
//                         return db.rollback(() => reject(imageErr));
//                     }

//                     // Insert into mk_products_discount
//                     const productDiscountQuery = `INSERT INTO mk_products_discount (discount_id, product_id) VALUES (?, ?)`;
//                     const productDiscountValues = [discountId, productId];

//                     db.query(productDiscountQuery, productDiscountValues, (productErr, productResult) => {
//                         if (productErr) {
//                             return db.rollback(() => reject(productErr));
//                         }

//                         db.commit((commitErr) => {
//                             if (commitErr) {
//                                 return db.rollback(() => reject(commitErr));
//                             }
//                             resolve({ discountId, message: 'Discount created successfully!' });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// };
const createDiscount = (
  shop_id,
  name,
  discount,
  isPublish,
  image,
  productIds,
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) {
        return reject(err);
      }

      // Insert into mk_discounts
      const discountQuery = `INSERT INTO mk_discounts (shop_id, name, percent, status) VALUES (?, ?, ?, ?)`;
      const discountValues = [shop_id, name, discount, isPublish];

      db.query(discountQuery, discountValues, (error, result) => {
        if (error) {
          return db.rollback(() => reject(error));
        }

        const discountId = result.insertId; // Get the inserted discount ID

        // Insert into mk_discount_image
        const imageQuery = `INSERT INTO mk_discount_image (discount_id, image) VALUES (?, ?)`;
        const imageValues = [discountId, image];

        db.query(imageQuery, imageValues, (imageErr, imageResult) => {
          if (imageErr) {
            return db.rollback(() => reject(imageErr));
          }

          // Loop through product IDs and insert into mk_products_discount
          const productDiscountQuery = `INSERT INTO mk_products_discount (discount_id, product_id) VALUES (?, ?)`;
          const productPromises = productIds.map(productId => {
            return new Promise((resolveProduct, rejectProduct) => {
              db.query(
                productDiscountQuery,
                [discountId, productId],
                (productErr, productResult) => {
                  if (productErr) {
                    return rejectProduct(productErr);
                  }
                  resolveProduct(productResult);
                },
              );
            });
          });

          // Wait for all product insertions to complete
          Promise.all(productPromises)
            .then(() => {
              db.commit(commitErr => {
                if (commitErr) {
                  return db.rollback(() => reject(commitErr));
                }
                resolve({
                  discountId,
                  message: "Discount created successfully!",
                });
              });
            })
            .catch(productErr => {
              return db.rollback(() => reject(productErr));
            });
        });
      });
    });
  });
};

const getDiscountsProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
          SELECT 
    d.id, 
    d.name, 
    d.percent, 
    d.status, 
    i.image, 
    GROUP_CONCAT(p.product_id) AS product_ids
FROM 
    mk_discounts AS d
LEFT JOIN 
    mk_discount_image AS i ON d.id = i.discount_id
LEFT JOIN 
    mk_products_discount AS p ON d.id = p.discount_id
LEFT JOIN 
    mk_products AS prod ON p.product_id = prod.id
GROUP BY 
    d.id, d.name, d.percent, d.status, i.image;

           
        `;

    db.query(query, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

const getDiscountById = id => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT d.id, d.name, d.percent, d.status, i.image, 
      GROUP_CONCAT(p.product_id) AS product_ids
      FROM mk_discounts AS d
      JOIN mk_discount_image AS i ON d.id = i.discount_id
      JOIN mk_products_discount AS p ON d.id = p.discount_id
      JOIN mk_products AS prod ON p.product_id = prod.id
      WHERE d.id = ?
      GROUP BY d.id, d.name, d.percent, d.status, i.image;
    `;

    db.query(query, [id], (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

const updateDiscount = (
  discountId,
  name,
  discount,
  isPublish,
  image,
  productIds,
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) {
        return reject(err);
      }

      // Update mk_discounts table
      const updateDiscountQuery = `UPDATE mk_discounts SET  name = ?, percent = ?, status = ? WHERE id = ?`;
      const discountValues = [name, discount, isPublish, discountId];

      db.query(updateDiscountQuery, discountValues, (error, result) => {
        if (error) {
          return db.rollback(() => reject(error));
        }

        // Check if an image is provided, and update if necessary
        if (image) {
          const imageQuery = `UPDATE mk_discount_image SET image = ? WHERE discount_id = ?`;
          db.query(imageQuery, [image, discountId], (imageErr, imageResult) => {
            if (imageErr) {
              return db.rollback(() => reject(imageErr));
            }
          });
        }

        // Insert new products if productIds are provided
        if (productIds && productIds.length > 0) {
          // First, delete existing product associations
          const deleteQuery = `DELETE FROM mk_products_discount WHERE discount_id = ?`;
          db.query(deleteQuery, [discountId], deleteErr => {
            if (deleteErr) {
              return db.rollback(() => reject(deleteErr));
            }

            // Then insert new product associations
            const insertQuery = `INSERT INTO mk_products_discount (discount_id, product_id) VALUES ?`;
            const values = productIds.map(productId => [discountId, productId]);

            db.query(insertQuery, [values], insertErr => {
              if (insertErr) {
                return db.rollback(() => reject(insertErr));
              }

              db.commit(commitErr => {
                if (commitErr) {
                  return db.rollback(() => reject(commitErr));
                }
                resolve({
                  discountId,
                  message: "Discount updated successfully with new products!",
                });
              });
            });
          });
        } else {
          // If no products, just commit the transaction
          db.commit(commitErr => {
            if (commitErr) {
              return db.rollback(() => reject(commitErr));
            }
            resolve({
              discountId,
              message: "Discount updated successfully without product changes.",
            });
          });
        }
      });
    });
  });
};

const deleteDiscount = id => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM mk_discounts WHERE id =?`;
    db.query(query, [id], (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  });
};

const getAllDiscountProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                p.id, 
                p.name AS product_name, 
                p.unit_price, 
                p.original_price, 
                p.featured_image, 
                d.name AS discount_name, 
                d.percent 
            FROM mk_products p
            INNER JOIN mk_products_discount pd ON p.id = pd.product_id
            INNER JOIN mk_discounts d ON pd.discount_id = d.id
            WHERE d.status = 1
        `;
    db.query(query, (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  });
};

const getAllDiscounts = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT d.*, i.image 
            FROM mk_discounts d
            LEFT JOIN mk_discount_image i 
            ON d.id = i.discount_id
            WHERE d.status = 1
            ORDER BY d.id DESC
            LIMIT 2
        `;
    db.query(query, (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  });
};

const getMinMaxPrice = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT MIN(original_price) AS minPrice, MAX(original_price) AS maxPrice FROM mk_products`;

    // Fix the typo in 'query'
    db.query(query, (err, result) => {
      if (err) {
        console.log(err, "model,err");
        return reject(err); // Properly handle rejection on error
      }
      console.log(result, "model price");
      resolve(result); // Resolve with the result
    });
  });
};

//hel[per function to get products by brand id]
const getProductsByBrandId = brandId => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT p.*, 
            GROUP_CONCAT(DISTINCT c.color_value) AS colors, 
            GROUP_CONCAT(DISTINCT img.image) AS images, 
            cat.name AS categoryTitle, 
            sub.name AS subCategory, 
            s.name AS shopName,
            b.name AS brandName,
            b.logo AS brandLogo,
            b.slug AS brandSlug,
            COALESCE(d.percent, 0) AS discountPercentage 
            FROM mk_products AS p 
            LEFT JOIN mk_products_colors AS c ON p.id = c.product_id 
            LEFT JOIN mk_categories AS cat ON p.cat_id = cat.id 
            LEFT JOIN mk_subcategories AS sub ON p.sub_cat_id = sub.id 
            LEFT JOIN mk_shops AS s ON p.shop_id = s.id 
            LEFT JOIN brands AS b ON p.brand_id = b.id
            LEFT JOIN mk_product_images AS img ON p.id = img.product_id 
            LEFT JOIN ( 
                SELECT product_id, discount_id, percent 
                FROM mk_products_discount AS pd 
                LEFT JOIN mk_discounts AS d ON pd.discount_id = d.id 
                WHERE pd.added_date = ( 
                    SELECT MAX(added_date) 
                    FROM mk_products_discount 
                    WHERE product_id = pd.product_id 
                ) 
            ) AS d ON p.id = d.product_id 
            WHERE p.brand_id = ?
            GROUP BY p.id;
        `;

    db.query(query, [brandId], (err, result) => {
      if (err) {
        console.error("Get products by brand error:", err);
        return reject(err);
      }

      const products = result.map(product => {
        const colors = product.colors ? product.colors.split(",") : [];
        const images = product.images ? product.images.split(",") : [];
        return {
          ...product,
          colors,
          images,
          brand: product.brandName
            ? {
                name: product.brandName,
                logo: product.brandLogo,
                slug: product.brandSlug,
              }
            : null,
        };
      });

      resolve(products);
    });
  });
};

// Export it

module.exports = {
  mkProductModel,
  getAllProducts,
  getAllProductsByShopId,
  getProductById,
  updateProductById,
  deleteProductById,
  getAllFeaturedProducts,
  getProductImages,
  deleteProductImages,
  checkSlugExists,
  getProductBySlug,
  createOrderModel,
  createOrderModel2,
  getAllOrdersModel,
  getAllOrdersModelById,
  deleteOrders,
  getOrderStatus,
  updateOrderStatus,

  getTransactionRecord,

  createDiscount,
  getDiscountsProducts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  getAllDiscountProducts,
  getAllDiscounts,
  getFilterProducts,
  getFilterPriceProducts,
  getMinMaxPrice,
  getProductsSubCategory,
  getAllProductsPagination,
  searchProducts,
  getAllOrders,

  getProductsByBrandId,
};
