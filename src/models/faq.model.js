const mongoose = require('mongoose');

const faqSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
	answer:{
		type: String,
		required: true,
	},
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
	versionKey: false,
  }
);


const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
