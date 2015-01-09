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

$(document).ready(function(){
	var authApp = new Auth();

	$('#open-socket').click(function(){
		var socket = createSocket();
		authApp.openSocket(socket);
		console.log("content of socket", socket);
	});

	$('#phone-form').submit(function(){
		authApp.submitPhone();
	});

	$('#pin-form').submit(function(){
		authApp.submitPin();
	});

	$('#name-form').submit(function(){
		authApp.submitName();
	});
});

function createSocket(){

	var socket = io.connect();

	socket.on('numberResult',function(res){
		var newElement = $('<div></div>').text(res.text);
		$('#status').append(newElement);
		$('#status').scrollTop($('#status').prop('scrollHeight'));
	});
	socket.on('pinResult', function(res){
		var newElement = $('<div></div>').text(res.text);
		$('#status').append(newElement);
		$('#status').scrollTop($('#status').prop('scrollHeight'));
	});
	socket.on('nameResult', function(res){
		var newElement = $('<div></div>').text(res.text);
		$('#status').append(newElement);
		$('#status').scrollTop($('#status').prop('scrollHeight'));
	});
	socket.on('socket-opened', function(res){
		var newElement = $('<div></div>').text(res.text);
		$('#status').append(newElement);
		$('#status').scrollTop($('#status').prop('scrollHeight'));
	});

	return socket;
}
