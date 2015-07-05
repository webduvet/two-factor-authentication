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
	var authApp = new Auth(new Firebase("https://jibbr2dev.firebaseio.com"));

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
		tabula.write("phone sent to get SMS");
	});
	socket.on('connect', function(res){
		tabula.write('connected');
	});
	socket.on('jwtGenerated', function(res){
		authApp.jwt = res.jwt;
		tabula.write("jwt generated: "+res);
		var but = document.getElementById('fb-authenticate');
		but.removeAttribute('disabled');
		//console.log("this res", res);
		if(res.existing) {
			authApp.ref.child('users/'+res.phone_index)
				.once('value', function(ss){
					// it must be here but 
					// just to be sure
					var usr = ss.val();
					//console.log("got this",usr);
					if(usr){
						//console.log(usr.object.name);
						var nameField = document.getElementById('name-text');
						nameField.value = usr.object.name;
					} else {
						tabula.writeError("error retrieving user object");
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
		tabula.write(msg.msg);
	});

	socket.on('err', function(msg){
		tabula.write(msg.msg);
	});

	return socket;
}
