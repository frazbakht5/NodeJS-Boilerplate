const httpStatus = require('http-status');
const { FaqModel } = require('../models');
const ApiError = require('../utils/ApiError');
const { debugLog1 } = require('../utils/commonFunctions');

const getAllFaqs = async (userId) => {
	debugLog1('In function FaqService.getAllFaqs');

	return await FaqModel.find({ is_active: true });
}
const createFaq = async (data) => {
	debugLog1('In function FaqService.createFaq');
	return await FaqModel.create(data);
}

module.exports = {
	getAllFaqs,
	createFaq
}