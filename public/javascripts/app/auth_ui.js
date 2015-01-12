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
	socket.on('socket-opened', function(res){
		tabula.write(res.text);
	});
	socket.on('jwtGenerated', function(res){
		authApp.jwt = res.jwt;
		tabula.write("jwt generated: "+res);
		var but = document.getElementById('fb-authenticate');
		but.removeAttribute('disabled');
	});
	socket.on('disconnect', function(res){
		tabula.write(res + " ... closing connection");
		socket.disconnect();
	});

	return socket;
}
