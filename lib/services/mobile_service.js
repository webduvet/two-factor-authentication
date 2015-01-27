var Firebase = require('firebase'),
		ref = new Firebase(require('../../config/firebase.js').url);;

module.exports = {
	/**
	 * check if the phone number is valid format and
	 * if it is from the supported country etc.
	 */
	validate: 
		function(phone)
		{
			return true;
		},
	/**
	 * get a country from the phone number
	 */
	getCountry:
		function(phone)
		{
		}
}

