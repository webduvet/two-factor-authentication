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
			var req = http.request(options);
			req.write(JSON.stringify({
				mobile: phone,
				token: generatePin()
			}));
			req.end();
		}
}

function generatePin() {
	var token = "0000" + Math.floor(Math.random()*(10000));
	return token.substr(token.length - 4);
}
