var http = require('http');

module.exports = {
	pinRequest: 
		function(phone)
		{
			var options={
				host:"sms.jibbrapp.com",
				path:"send",
				headers: {
					signature: require('../config/signature.js').signature
				}
			};
			var req = http.request(options),
					token = generatePin();
			req.write(JSON.stringify({
				mobile: phone,
				token: token,
				text: "Your pin is " + token + " is valid for nex 5 min.",
				callback: null	
			}));
			req.end();
		}
}

function generatePin() {
	var token = "0000" + Math.floor(Math.random()*(10000));
	return token.substr(token.length - 4);
}
