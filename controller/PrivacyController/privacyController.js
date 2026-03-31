const privacyModel = require("../../models/PrivacyModel/privacyModel");

// create Privacy controller
exports.createPrivacy = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await privacyModel.createPrivacy(title, description);
    res.status(201).json({ message: "Privacy created successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// get all privacy
exports.getAllPrivacy = async (req, res) => {
  try {
    const result = await privacyModel.getPrivacy();
    res.status(200).json({ message: "Privacy fetched successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPrivacybyId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await privacyModel.getPrivacybyid(id);
    res.status(201).json({ message: "Privacy fetched  successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updatePrivacy = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  try {
    const result = await privacyModel.updatePrivacy(title, description, id);
    res.status(200).json({ message: "Privacy Updated successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deletePrivacy = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await privacyModel.deletePrivacy(id);
    res.status(201).json({ message: "Privacy Deleted successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
