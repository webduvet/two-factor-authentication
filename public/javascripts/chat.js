var Auth = function(){
};

Auth.prototype.sendMessage = function(room, text){
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
};

Auth.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom: room
	});
}

Auth.prototype.openSocket = function(socket, handlers){
	this.socket = socket;
}

Auth.prototype.submitPhone = function(phone){
	console.log("submitting phone number", phone);
	this.socket.emit('phone', {phone: phone});
}
Auth.prototype.submitPin = function(pin){
	this.socket.emit('pin', {pin:pin});
}
Auth.prototype.submitName = function(name){
	this.socket.emit('name', {name:name});
}

Auth.prototype.processCommand = function(cmd){
	var words = cmd.split(' ');
	var command = words[0]
		.substring(1, words[0].length)
		.toLowerCase();
	var message = false;

	switch(command) {
		case 'join':
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;
		case 'nick':
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name);
			break;
		default:
			message = 'Unrecognized command.';
			break;
		}
	return message;
};
