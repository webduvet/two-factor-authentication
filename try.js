var socketio = require('socket.io');

var http = require('http');
var phone = '+353858101638';
var qs = require('querystring');
var token = "8888"

var 
	post_data = {
		number: phone,
		text: "Your pin is " + token + " is valid for nex 5 min.",
		callback: null
	};




var server = http.createServer(function(req, res){});
server.listen(3001, function(){
	console.log('listening on 3002');
});

/*
var authServer = require('./lib/auth_server.js');
authServer.listen(server);
*/

var io = socketio.listen(server);

io.sockets.on('connection', function(socket){
	console.log(socket.id, 'connected');
	socket.on('phoneEntered', function(msg){
		post_data.number = msg.phone;
		//post_data = qs.stringify(post_data);
		post_data = JSON.stringify(post_data);
		var 
			options={
        host:"localhost",
        path:"/api/sendsms",
        port: 8081,
        method:'POST',
        headers: {
					//'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Type': 'application/json',
					'Content-Length': post_data.length,
          'signature': require('./config/signature.js').signature
        }
      };
		var req = http.request(options,handleResponse),
				token = generatePin();

		req.write(post_data);
		req.end();

	});
	socket.on('disconnect', function(){
		console.log(socket.id,'disconnected');
	});
});

function handleResponse(res){
	res.on('data', function(chunk){
		console.log(chunk.toString('utf8'));
	});
	res.on('end', function(d){
		console.log('end', d);
	});
}

function generatePin() {
  var token = "0000" + Math.floor(Math.random()*(10000));
  return token.substr(token.length - 4);
}
