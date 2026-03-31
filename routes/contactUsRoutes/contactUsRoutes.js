const express = require("express");
const router = express.Router();
const middleware = require("../../middleware/middleware");
const contactUsController = require("../../controller/contactUsController/contactUsContrller");

router.post("/contactUs", contactUsController.createContactUs);
router.get(
  "/getContactUs",
//   middleware.hasPermission,
  contactUsController.getContactUs
);
router.delete("/deleteContactUs/:id", contactUsController.deleteContactUs);
// --------------------------------------------------------------
router.get(
  "/getContactUsCategory",
//   middleware.hasPermission,
  contactUsController.getContactUsCategory
);
router.post(
  "/createContactUsCategory",
  contactUsController.createContactUsCategory
);

// ---------------------------------------------------------------
router.get(
  "/getContactUsReason",
//   middleware.hasPermission,
  contactUsController.getContactUsReason
);
router.post(
  "/createContactUsReason",
  contactUsController.createContactUsReason
);

module.exports = router;
