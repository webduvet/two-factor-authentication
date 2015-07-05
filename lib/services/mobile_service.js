var Firebase = require('firebase'),
		ref = new Firebase(require('../../config/firebase.js').url),
		regex = require('../../config/regex.js');

module.exports = {
	/**
	 * check if the phone number is valid format and
	 * if it is from the supported country etc.
	 */
	validate: 
		function(phone)
		{
			var re = new RegExp(regex.validCc);
			// TODO validate if this is a mobile number
			return re.test(phone);
		},
	/*
	 * convert to format beginning with +
	 * take out all 0 between number and country code
	 */
	withPlus:
		function(phone)
		{
			phone = phone.replace(/^00/,'+');
			return phone;
		},
	indexify:
		function(phone)
		{
			phone = phone.replace(/[\+ ;\.]/g,'');
			phone = phone.replace(/^00/,'');
			return phone;
		},
	/**
	 * get a country from the phone number
	 */
	getCountry:
		function(phone)
		{
			// TODO extract country code from phone
		}
}

