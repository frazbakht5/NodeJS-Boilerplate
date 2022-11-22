const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const HttpResponse = require('../utils/modules/Response/HttpResponse');
const BadRequest = require('../utils/modules/Errors/BadRequest');
const NotFound = require('../utils/modules/Errors/NotFound');
const InternalServerError = require('../utils/modules/Errors/InternalServer');
const { verifyToken } = require('../services/token.service');
const { getToken, debugLog1, debugLog2 } = require('../utils/commonFunctions');
const FaqService = require('../services/faq.service');
const GroupService = require('../services/group.service');

class FaqController {

		static async getFaqs(req, res) {
		debugLog1('In function FaqController.getFaqs');
		
		const allFaqs = await FaqService.getAllFaqs();

		debugLog2("allFaqs ===> ", allFaqs);

		if (allFaqs && allFaqs.length > 0) {
			const httpResponse = HttpResponse.get(allFaqs);
			res.json(httpResponse);
		}
		else {
			res.json(new NotFound('Faqs could not be found'))
		}
	}
	static async addFaq(req, res) {
		debugLog1('In function FaqController.addFaq');

		const bodyParams = req.body;
		// debugLog2("bodyParams ===> ", bodyParams);
		const tokenData = req.tokenData;
		// debugLog2("tokenData ===> ", tokenData);

		const data = {
			question: bodyParams.question,
			answer: bodyParams.answer
		}
		const newFaq = await FaqService.createFaq(data);

		if (newFaq) {
			const httpResponse = HttpResponse.created(newFaq);
			res.json(httpResponse);
		}
		else {
			res.json(new BadRequest('Faq with same details already exists'))
		}
	}

}
module.exports = FaqController;
