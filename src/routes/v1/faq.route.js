const express = require('express');
const FaqController = require('../../controllers/faq.controller');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();


router.get('/', catchAsync(FaqController.getFaqs));
router.post('/', catchAsync(FaqController.addFaq));


module.exports = router;

