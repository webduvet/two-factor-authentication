var http = require('http'),
		qs = require('querystring');


module.exports = {
	request: 
		function(phone)
		{
			var 
				token = generatePin(),
				post_data = qs.stringify({
					number: phone,
					callback: null,
					text: "Your pin is " + token + " is valid for nex 5 min."
				});
			var 
				options={
					host:"localhost",
					path:"api/sendsms",
					port: 8081,
					method:'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': post_data.length,
						'signature': require('../../config/signature.js').signature
					}
				};
			
			var	req = http.request(options, handleRes);

			console.log(token);
			console.log(post_data);
			req.write(post_data);
			req.end();
			return token;
		},
	verify:
		function(pin, phone, cb)
		{
			pinVerify(pin, phone,function(result){
				if(result) {
					// TODO if ok 
					// to the rest and clear the pin/phone
				} else {
					// take care of failure
				}
			});
		}
}

function generatePin() {
	var token = "0000" + Math.floor(Math.random()*(10000));
	return token.substr(token.length - 4);
}

function handleRes(res){
	console.log(res);
}
