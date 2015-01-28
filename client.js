var net = require('net');
var socket = new net.Socket();
var io = require('socket.io/node_modules/socket.io-client');
client = io.connect('http://localhost:3001');

client.on('connect',function(c) {
	console.log('client connected',c);

    setTimeout(function(){
			client.emit('phoneEntered', {phone: '+353858101638'});
		}, 3000);
}); 

/*
socket.connect(3002,'localhost', function(s){
	console.log('listening',s);
});

var client = net.connect({
	port: 3002
}, function(){
	console.log('connected');
});
*/
