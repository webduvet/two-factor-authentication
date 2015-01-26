var http = require('http');
var Firebase = require('firebase'),
		ref = new Firebase(require('../config/firebase.js').url);;

module.exports = {
	request: 
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
				text: "Your pin is " + token + " is valid for nex 5 min.",
				callback: null	
			}));
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
			}
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
	var v;
	ref.child('pin/'+phone+"/"+pin)
		.once('value', function(ss){
			var v = ss.val();
			if(v){
				checkTime(v.time) || (cancel(),return);
				checkPin(v.pin,pin) ||( wrongPin(v.attempts), return);
				cb(null, true); // call as verified;
			} else {
				cb({
					message: 'no PIN generated for this number'
				});
			}
		});
	function checkTime(time){
		return (Date.now() - time) > 5 * 60 * 1000;
	}
	function checkPin(pin1, pin2){
		return pin1 === pin2;
	}
	function checkAttempts(no){
		return  4 > no;
	}
	function cancel(){
		ref.child('pin/'+phone).remove(function(err){
			if(!err){
				cb("pin canceled");
			}
		});
	}
	function wrongPin(no){
		if(!heckAttempts(no)){
			cancel();
		}
	}
}
