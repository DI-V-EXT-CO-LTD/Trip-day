// purchaseRoutes.js

const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

// 로그 추가: 라우터가 호출될 때마다 로그 출력
console.log('Purchase routes loaded');

// Create a payment intent
router.post('/create-payment-intent', (req, res, next) => {
  console.log('purchaseRoutes POST /create-payment-intent called');
  next();
}, purchaseController.createPaymentIntent);

router.get('/paypal-payment', async (req, res) => {
  console.log('GET /paypal-payment called');
}, purchaseController.paypalpayment);

router.get('/check-paypal-payment-status', async (req, res) => {
  console.log('GET /paypal-payment status called');
}, purchaseController.checkpaypalpaymentstatus);


// Create a new purchase for card payments
router.post('/create-card-purchase', (req, res, next) => {
  console.log('POST /create-card-purchase called');
  next();
}, purchaseController.createCardPurchase);

// Create a new purchase for other payment methods
router.post('/create', (req, res, next) => {
  console.log('POST /create called');
  next();
}, purchaseController.createPurchase);

// Webhooks
router.post('/webhook/stripe', (req, res, next) => {
  console.log('POST /webhook/stripe called');
  next();
}, purchaseController.handleWebhook);

router.post('/webhook/paypal', (req, res, next) => {
  console.log('POST /webhook/paypal called');
  next();
}, purchaseController.handleWebhook);

router.post('/webhook/omise', (req, res, next) => {
  console.log('POST /webhook/omise called');
  next();
}, purchaseController.handleWebhook);


module.exports = router;
