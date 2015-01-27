var net = require('net');
var socket = new net.Socket();
var io = require('socket.io/node_modules/socket.io-client');
client = io.connect('http://localhost:3002');

client.on('connect',function() {
    setTimeout(function(){
			client.emit('idea', {hey: 1233});
		}, 5000);
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
