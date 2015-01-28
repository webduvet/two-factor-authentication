var http = require('http');


module.exports = {
	request: 
		function(phone)
		{
			var 
				token = generatePin(),
				post_data = {
					number: phone,
					callback: null,
					text: "Your pin is " + token + " is valid for nex 5 min."
				};
			post_data = JSON.stringify(post_data);
			var 
				options = {
					host:"localhost",
					path:"/api/sendsms",
					port: 8081,
					method:'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': post_data.length,
						'signature': require('../../config/signature.js').signature
					}
				};
			
			var	req = http.request(options, handleRes);

			console.log(post_data);

			req.write(post_data);
			req.end();
			return token;
		}
}

function generatePin() {
	var token = "0000" + Math.floor(Math.random()*(10000));
	return token.substr(token.length - 4);
}

function handleRes(res){
}
