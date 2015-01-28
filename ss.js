var 
		http = require('http');


var server = http.createServer(function(req, res){
});

server.listen(3001, function(){
	console.log("server listening on port 3001");
});

var authServer = require('./lib/auth_server.js');
authServer.listen(server);

