const BreedsModel = require("../../models/Breeds/BreedsModel.js");
const fs = require("fs");
const {get} = require("http");
const path = require("path");
const slugify = require("slugify");

const showBreedCategory = (req, res) => {
  try {
    BreedsModel.showBreedsCategory((err, data) => {
      if (err) {
        return res.status(500).json({message: err.message});
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};
const showImages = (req, res) => {
  try {
    BreedsModel.getbreedimages((err, data) => {
      if (err) {
        return res.status(500).json({message: err.message});
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

const showBreed = (req, res) => {
  const {page} = req.params;
  try {
    const limit = parseInt(req.query.limit) || 20; 
    BreedsModel.showBreeds(page, limit, (err, data, total) => {
      if (err) {
        return res.status(500).json({message: err.message});
      } else {
        const totalPages = Math.ceil(total / limit);
        res.json({data, totalPages, currentPage: page});
      }
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

const searchBreedsByTitle = (req, res) => {
  //   const { page } = req.params;
  const {title, page} = req.params;

  const searchTitle = decodeURIComponent(title);

  // Convert letter to uppercase for consistency (optional)
  const title_ = searchTitle.toUpperCase();
  try {
    const limit = parseInt(req.query.limit) || 20; // default limit is 10
    BreedsModel.searchBreedsByTitle(title_, page, limit, (err, data, total) => {
      if (err) {
        return res.status(500).json({message: err.message});
      } else {
        const totalPages = Math.ceil(total / limit);
        res.json({data, totalPages, currentPage: page});
      }
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

const showBreedsByAlphabet = (req, res) => {
  //   const { page } = req.params;
  const {letter, page} = req.params;

  // Convert letter to uppercase for consistency (optional)
  const alphabet = letter.toUpperCase();
  try {
    const limit = parseInt(req.query.limit) || 20; // default limit is 10
    BreedsModel.showBreedsByAlphabet(
      alphabet,
      page,
      limit,
      (err, data, total) => {
        if (err) {
          return res.status(500).json({message: err.message});
        } else {
          const totalPages = Math.ceil(total / limit);
          res.json({data, totalPages, currentPage: page});
        }
      },
    );
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};
//add breed q a to it

const insertBreedWithImageController = async (req, res) => {
  let {
    title,
    description,
    categoryid,
    tags,
    lifespan,
    weight,
    height,
    shortDescription,
    qa
  } = req.body;

  // TAGS FIX (TEXT TAGS)
  if (typeof tags === "string") {
    tags = tags.split(",").map(t => t.trim());
  }
  if (!Array.isArray(tags)) tags = [];

  // QA FIX
  if (typeof qa === "string") {
    qa = JSON.parse(qa);
  }
  if (!Array.isArray(qa)) qa = [];

  const images = req.files || [];
  const imagePath = images.map(img => `/Breeds/${img.filename}`);

  const slug = slugify(title, { lower: true, strict: true });

  try {
    const result = await BreedsModel.insertBreedWithImage(
      title,
      slug,
      description,
      categoryid,
      imagePath,
      tags,
      lifespan,
      weight,
      height,
      shortDescription,
      qa
    );

    res.status(200).json({
      message: "Breed Created Successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update breed with image
const BreedsupdateController = async (req, res) => {
  let {
    title,
    description,
    categoryid,
    lifespan,
    weight,
    height,
    shortDescription,
    tags,
    qa,
  } = req.body;
  const id = req.params.id;
  const images = req.files;
  const imagePath = [];
  images.forEach(image => {
    imagePath.push(`/Breeds/${image.filename}`);
  });

//  let { tags, qa } = req.body;

if (typeof tags === "string") {
  tags = tags.split(",").map(t => t.trim());
}
if (!Array.isArray(tags)) tags = [];

if (typeof qa === "string") {
  qa = JSON.parse(qa);
}
if (!Array.isArray(qa)) qa = [];

  console.log("Images: ", imagePath);
  try {
    const result = await BreedsModel.updateBreedWithImage(
      title,
      description,
      categoryid,
      imagePath,
      lifespan,
      weight,
      height,
      shortDescription,
      id,
      tags,
      qa,
    );

    console.log("Result: ", result);
    if (result.affectedRows > 0) {
      res.status(200).json({
        message: "Breed with Multiple Images  Updated Successfully",
        result,
      });
    } else {
      res.status(404).json({success: false, message: "Error in Update"});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Internal Server Error"});
  }
};

// get breed by id
const getBreedByBreedId = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await BreedsModel.getBreedById(id);

    if (result.length > 0) {
      res.status(200).json({
        data: result[0],
      });
    } else {
      res.status(404).json({success: false, message: "Breed  not found"});
    }
  } catch (error) {
    console.error("Error fetching Breed by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};

const deleteBreedController = async (req, res) => {
  const id = req.params.id;
  const breed = await BreedsModel.getBreedByIdfordelete(id);
  if (breed.length > 0) {
    const newImagesPaths = breed[0].breed_images.split(",");

    newImagesPaths.forEach(image => {
      const imagePath = path.join(__dirname, `../../public${image}`);

      fs.unlink(imagePath, err => {
        if (err) {
          console.error(err);
        }
      });
    });
    await BreedsModel.deleteBreed(id);
    res
      .status(200)
      .json({success: true, message: "breed deleted successfully"});
  } else {
    console.log("breed not found");
  }
};

const deleteImageByid = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await BreedsModel.getbreedimagebyid(id);
    console.log("result", result);
    const newImagesPaths = result[0].image.slice(7, result[0].image.length);
    console.log("newImagesPaths", newImagesPaths);
    fs.unlink(
      path.join(__dirname, "../..", "public", "Breeds", newImagesPaths),
      err => {
        if (err) {
          console.error(
            `Failed to delete image at ${newImagesPaths}: ${err.message}`,
          );
        }
      },
    );

    const result1 = await BreedsModel.deletesinglebreedimagebyid(id);
    res.status(200).json({
      message: "Article deleted successfully.",
      success: true,
      result1,
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// get breed by category
const getBreedByCategory = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await BreedsModel.getBreedByCategory(id);

    if (result.length > 0) {
      res.status(200).json({
        data: result,
      });
    } else {
      res.status(404).json({success: false, message: "Breed  not found"});
    }
  } catch (error) {
    console.error("Error fetching Breed by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};
// get breed by category id

const getBreedByCategoryId = async (req, res) => {
  try {
    const {id, page} = req.params;
    const limit = parseInt(req.query.limit) || 20; // Default limit of 10
    const startIndex = (page - 1) * limit;
    const {breeds, totalPages} = await BreedsModel.getBreedByCategoryId(
      id,
      startIndex,
      limit,
    );
    if (breeds.length > 0) {
      res.status(200).json({
        data: breeds,
        currentPage: page,
        totalPages: totalPages,
      });
    } else {
      res.status(404).json({success: false, message: "Breed not found"});
    }
  } catch (error) {
    console.error("Error fetching Breed by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};

const get10BreedsbyCategory = async (req, res) => {
  try {
    const result = await BreedsModel.get10BreedsByCategory();
    if (result.length > 0) {
      res.status(200).json({
        data: result,
      });
    } else {
      res.status(404).json({success: false, message: "Breed  not found"});
    }
  } catch (error) {
    console.error("Error fetching Breed by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};


const getSingleBreedById = async (req, res) => {
  try {
    const slug = req.params.slug;

    const result = await BreedsModel.getSingleBreedById(slug);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Breed not found",
      });
    }

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error("Error fetching Breed by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// const addTagsForBreeds = async (req, res) => {
//   try {
//     let {tags} = req.body;

//     console.log("Controller Tags:", tags);

//     if (!tags) {
//       return res.status(400).json({message: "Tags required"});
//     }

//     const result = await BreedsModel.addBreedTags(tags);

//     res.status(200).json({
//       message: "Tags added successfully",
//       result,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({message: error.message});
//   }
// };

const addTagsForBreeds = async (req, res) => {
  try {
    let { tags } = req.body;

    if (!tags) {
      return res.status(400).json({
        success: false,
        message: "Tags required",
      });
    }

    const result = await BreedsModel.addBreedTags(tags);

    res.status(200).json({
      success: true,
      message: result.message,
      inserted: result.inserted,
      existing: result.existing,
      affectedRows: result.affectedRows || 0,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllTags = async function (req, res) {
  try {
    var result = await BreedsModel.getAllTags();
    res.status(200).json({message: "Tags fetched successfully", result});
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({message: "Failed to fetch tags"});
  }
};

module.exports = {
  showBreedCategory,
  showImages,
  showBreed,
  showBreedsByAlphabet,
  searchBreedsByTitle,
  insertBreedWithImageController,
  BreedsupdateController,
  getBreedByBreedId,
  deleteBreedController,
  deleteImageByid,
  getBreedByCategory,
  getBreedByCategoryId,
  get10BreedsbyCategory,
  getSingleBreedById,
  getAllTags,
  addTagsForBreeds,
};
