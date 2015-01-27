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
		if(res.existing) {
			authApp.ref.child('users/'+res.uid)
				.once('value', function(ss){
					// it must be here but 
					// just to be sure
					var usr = ss.val();
					if(usr){
						console.log(usr.object.name);
						var nameField = document.getElementById('name-text');
						nameField.value = usr.object.name;
					} else {
						tabula.writeError("some error occured");
					}
				});
		}
	});
	socket.on('nameRequest', function(res){
		var field = document.getElementById('name-text'),
				but = document.getElementById('name-button');
		field.removeAttribute('disabled');
		but.removeAttribute('disabled');
	});
	socket.on('disconnect', function(res){
		tabula.write(res + " ... closing connection");
		authApp.socket.disconnect();
		delete authApp.socket;
	});

	socket.on('error', function(msg){
		tabula.write(msg);
	});

	socket.on('err', function(msg){
		tabula.write(msg);
	});

	return socket;
}
