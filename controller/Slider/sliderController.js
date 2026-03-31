const path = require("path");
const fs = require("fs");

const SliderModel = require("../../models/Slider/SliderModel");

exports.createSlider = async (req, res) => {
  const { title, description, status, url, defaultSlider, expiryDate } =
    req.body;
  const images = req.files;
  const imagePath = [];
  images.forEach((image) => {
    imagePath.push(`/Slider/${image.filename}`);
  });
  if (new Date(expiryDate) < Date.now()) {
    return res
      .status(400)
      .json({ message: "Expiry date must be in the future" });
  }

  try {
    const result = await SliderModel.createSlider(
      title,
      description,
      status,
      imagePath,
      url,
      defaultSlider,
      expiryDate
    );
    console.log(result);
    res.status(200).json({ message: "Slider created successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllImages = async function (req, res) {
  try {
    const data = await SliderModel.getallimages();
    //console.log(data);

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteSlider = async (req, res) => {
  const id = req.params.id;
  try {
    const result1 = await SliderModel.getSliderById(id);
    console.log(result1);
    fs.unlink(
      path.join(__dirname, "../../", "public", result1[0].images),
      (err) => {
        if (err) {
          console.error(
            `Failed to delete image at ${result1[0].images}: ${err.message}`
          );
        }
      }
    );
    const result = await SliderModel.deleteSlider(id);
    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// update slider by id
exports.updateSlider = async (req, res) => {
  const id = req.params.id;
  const { title, description, status, url, defaultSlider, expiryDate } =
    req.body;
  const imagePath = [];
  const images = req.files;
  images.forEach((image) => {
    imagePath.push(`/Slider/${image.filename}`);
  });
  // if (new Date(expiryDate) < Date.now()) {
  //   return res
  //     .status(400)
  //     .json({ message: "Expiry date must be in the future" });
  // }

  try {
    const result = await SliderModel.updateSlider(
      id,
      title,
      description,
      status,
      imagePath,
      url,
      defaultSlider,
      expiryDate
    );
    res.status(200).json({ message: "Slider updated successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
