const express = require("express");
const privacyController = require("../../controller/PrivacyController/privacyController");
const termController = require("../../controller/TermAndCondition/termController");
const middleware = require("../../middleware/middleware");

const router = express.Router();

// privacy and Policy
router.post("/createprivacy", privacyController.createPrivacy);
router.get(
  "/getprivacy",
//   middleware.hasPermission,
  privacyController.getAllPrivacy
);
router.get(
  "/getprivacybyid/:id",
//   middleware.hasPermission,
  privacyController.getPrivacybyId
);
router.put("/updateprivacy/:id", privacyController.updatePrivacy);
router.delete("/deleteprivacy/:id", privacyController.deletePrivacy);

// term and Condition
router.post("/createTerm", termController.createTerms);
router.get("/getTerm", 
// middleware.hasPermission,
termController.getTerms);
router.get(
  "/getTermbyid/:id",
//   middleware.hasPermission,
  termController.getTermbyid
);
router.put("/updateTerm/:id", termController.updateTerms);
router.delete("/deleteTerm/:id", termController.deleteTerms);

module.exports = router;
