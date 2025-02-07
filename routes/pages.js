const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');

router.get('/who-we-are', pagesController.getWhoWeAre);
router.get('/privacy-policy', pagesController.getPrivacyPolicy);
router.get('/cookie-policy', pagesController.getCookiePolicy);
router.get('/legal-notes', pagesController.getLegalNotes);
router.get('/contact-us', pagesController.getContactUs);
router.post('/contact-us', pagesController.sendContactEmail);
router.get('/moreservice', pagesController.getMoreservice);
router.get('/service-guarantee', pagesController.getserviceguarantee);
router.get('/affiliate-contact', pagesController.getaffiliateContact);
router.get('/Cancel-Refund-Policy', pagesController.getCancelRefundPolicy);
router.get('/customer-service', pagesController.getcustomerservice);
router.get('/serviceinfo', pagesController.getserviceinfo);
router.get('/careers', pagesController.getcareers);
router.get('/personal', pagesController.getpersonal);
module.exports = router;
