function divEscapeContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;

	if(message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		if (systemMessage) {
			$('#messages').append(divEscapeContentElement(message));
		} 
	} else {
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapeContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	} 

	$('#send-message').val('');
}

/*
var socket = io.connect();
$(document).ready(function(){
	var chatApp = new Auth(socket);

	socket.on('nameResult', function(result) {
		var message;

		if (result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});

	socket.on('joinResult', function(result){
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room Changed'));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	});

	socket.on('message', function(message){
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	});

	socket.on('rooms', function(rooms){
		$('#room-list').empty();

		for(var room in rooms) {
			room = room.substring(0, room.length);
			if (room != '') {
				$('#room-list').append(divEscapeContentElement(room));
			}
		}

		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});

	setInterval(function(){
		socket.emit('rooms');
	}, 1000);

	$('#send-message').focus();

	$('#send-form').submit(function(){
		processUserInput(chatApp, socket);
		return false;
	});
});
*/

var tabula = new Tabula(document.getElementById('tabula'));

$(document).ready(function(){
	var authApp = new Auth(new Firebase("http://sagavera.firebaseio.com"));

	$('#open-socket').click(function(){
		if(!authApp.socket){
			var socket = createSocket(authApp);
			authApp.openSocket(socket);
		} else {
			tabula.writeError("socket already created");
		}
	});
	
	$('#generate-jwt').click(function(){
		authApp.generateJwt();
		return false;
	});

	$('#fb-authenticate').click(function(){
		authApp.fbAuthenticate();
		return false;
	});

	$('#phone-form').submit(function(){
		var val = $('#phone-number').val();
		authApp.submitPhone(val);
		return false;
	});

	$('#pin-form').submit(function(){
		var val = $('#pin-number').val();
		authApp.submitPin(val);
		return false;
	});

	$('#name-form').submit(function(){
		var val = $('#name-text').val();
		authApp.submitName(val);
		return false;
	});

});

function createSocket(authApp){

	var socket = io.connect();

	socket.on('phoneResult',function(res){
		tabula.write("this phone: " + res.phone);
	});
	socket.on('pinResult', function(res){
		tabula.write("server got this pin: "+res.pin);
	});
	socket.on('nameResult', function(res){
		tabula.write("server got this name: "+ res.name);
	});
	socket.on('socket-opened', function(res){
		tabula.write(res.text);
	});
	socket.on('jwtGenerated', function(res){
		authApp.jwt = res;
		tabula.write("jwt generated: "+res);
	});

	return socket;
}
