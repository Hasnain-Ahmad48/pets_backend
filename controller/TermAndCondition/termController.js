const termModel = require("../../models/TermsAndCondition/termModel");

// create Privacy controller
exports.createTerms = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await termModel.createTerms(title, description);
    res.status(201).json({ message: "Privacy created successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// get all privacy
exports.getTerms = async (req, res) => {
  try {
    const result = await termModel.getTerms();
    res.status(200).json({ message: "Privacy fetched successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTermbyid = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await termModel.getTermsbyid(id);
    res.status(201).json({ message: "Privacy fetched  successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTerms = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  try {
    const result = await termModel.updateterms(title, description, id);
    res.status(201).json({ message: "Privacy Updated successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteTerms = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await termModel.deleteTerms(id);
    res.status(201).json({ message: "Privacy Deleted successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
