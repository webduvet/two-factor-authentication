var http = require('http');
var Firebase = require('firebase'),
		ref = new Firebase(require('../config/firebase.js').url);;

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
		},
	pinVerify:
		function(pin, phone)
		{
		}
}

function generatePin() {
	var token = "0000" + Math.floor(Math.random()*(10000));
	return token.substr(token.length - 4);
}

function savePin() {
	//write the pin into firebase with timestime of this server
	ref.child('pin/'+phone+"/"+token)
		.set({
			time: Date.now(),
			attempts: 0
		});
}

function pinVerify(pin, phone, cb) {
	ref.child('pin/'+phone+"/"+pin)
		.once('value', function(ss){
			var v = ss.val();
			if(v){
				cb(checkTime(v.time) && checkPin(v.pin, pin) && checkAttempts(v.attempts));
			} else {
				cb(false);
			}
		});
	function checkTime(time){
		return (Date.now() - time) > 5 * 60 * 1000;
	}
	function checkPin(pin1, pin2){
		return pin1 === pin2;
	}
	function checkAttempts(no){
		return no < 4;
	}
}
