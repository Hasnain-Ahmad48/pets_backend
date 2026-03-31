const express = require('express');
const router = express.Router();
const controller = require('../../controller/StripePaymentGateway/stripeApi');

router.post('/create-payment-intent', controller.createPaymentIntent);

module.exports = router;