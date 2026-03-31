const contactUsModel = require("../../models/contactUsModel/contactUsModel");

exports.createContactUs = async (req, res) => {
  const {
    contact_category_id,
    contact_reason_id,
    message,
    FirstName,
    LastName,
    Address1,
    Address2,
    city,
    state,
    zipCode,
    email,
    emailRequestFeedback,
    callRequestFeedback,
    receiveEmailMarketing,
    status,
  } = req.body;

  const ticketNo = Math.floor(100000 + Math.random() * 900000);

  try {
    const result = await contactUsModel.createContactUs(
      contact_category_id,
      contact_reason_id,
      message,
      FirstName,
      LastName,
      Address1,
      Address2,
      city,
      state,
      zipCode,
      email,
      emailRequestFeedback,
      callRequestFeedback,
      receiveEmailMarketing,
      ticketNo,
      status
    );
    res
      .status(200)
      .json({ messgae: "Contact Us Created Successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.getContactUs = async (req, res) => {
  try {
    const result = await contactUsModel.getContactus();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// delete contact us
exports.deleteContactUs = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await contactUsModel.deleteContactus(id);
    res
      .status(200)
      .json({ message: "Contact Us Deleted Successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --------------------Contact Us Category ---------------------
// Create contactUs category
exports.createContactUsCategory = async (req, res) => {
  const { title } = req.body;
  try {
    const result = await contactUsModel.createContactUsCategory(title);
    res.status(200).json({ message: "Category Created Successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// get contactUs category
exports.getContactUsCategory = async (req, res) => {
  try {
    const result = await contactUsModel.getContactUsCategory();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --------------------------- Contact Us Reason ---------------------
// create Contact us reason
exports.createContactUsReason = async (req, res) => {
  const { title } = req.body;
  try {
    const result = await contactUsModel.createContactUsReason(title);
    res.status(200).json({ message: "Reason Created Successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// get constactUs reason
exports.getContactUsReason = async (req, res) => {
  try {
    const result = await contactUsModel.getContactUsReason();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
