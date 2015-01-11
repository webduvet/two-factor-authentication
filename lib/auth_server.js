var clc = require('cli-color');
var socketio = require('socket.io'),
		io,
		guestNumber = 1,
		nickNames = {},
		namesUsed = [],
		currentRoom = {},
		allRooms = {},
		currentCandidates = {},
		currentNumbers = {};
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(require('../config/firebase.js').securityToken);

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);
	io.sockets.on('connection', function(socket){

		console.log("socket created");

		handleUser(socket);
		handleTokenGenerate(socket);

		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

		socket.emit('socket-opened', {user:"UID for user", text:"new socket opened"});

		handleClientDisconnection(socket, nickNames, namesUsed);
	});
};


function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = "Guest"+guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	namesUsed.push(name);
	return guestNumber + 1;
}


function joinRoom(socket, room) {
	socket.join(room, function(err){
		allRooms[room] = true
		if (!io.sockets.adapter.rooms[currentRoom[socket.id]]){
			delete allRooms[currentRoom[socket.id]];
		}
		currentRoom[socket.id] = room;
	});
	socket.emit('joinResult',{room:room});
	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + ' has joined ' + room +'.'
	});

	var usersInRoom = io.sockets.adapter.rooms[room];
	if(typeof usersInRoom != "undefined" && usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currenty in ' + room + ': ';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketId != socket.id) {
				if (index >0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message', {text: usersInRoomSummary});
	}
}


function handleNameChangeAttempts( socket, nickNames, namesUsed) {

	socket.on('nameAttempt', function(name) {
		if (name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest"'
			});
		} else {
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name
				});
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use.'
				});
			}
		}
	})
}


function handleUser(socket) {
	socket.on('phone', function(message) {
		socket.emit('phoneResult', message);
	});
	socket.on('pin', function(message) {
		socket.emit('pinResult', message);
	});
	socket.on('name', function(message){
		socket.emit('nameResult', message);
	});
}

function handleTokenGenerate(socket) {
	socket.on('jwt', function(message) {

		console.log("token generator", tokenGenerator);

		// TODO store iuser activity trace in memory so we can say that he intered a valid PIN thus
		// is already authenticated with us and we can generate authentication code with Firebase

		// TODO design how to manage users - firebase or external db? 
		// do we generate UID and push to firebase synchronously or async? do we need to wait until we 100% have to user in firebae?
		var jwt = tokenGenerator.createToken({uid:"TODO push to firebase", name:"get user name from memory"});
		socket.emit('jwtGenerated',jwt);

		//TODO we need to close the socket after user gets the jwt.
	});
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function(message){
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ': ' + message.text
		});
	});
}


function handleRoomJoining(socket) {
	socket.on('join', function(room){
		if (room.newRoom != currentRoom[socket.id]) {
			socket.leave(currentRoom[socket.id]);
			joinRoom(socket, room.newRoom);
		}
	});
}


function handleClientDisconnection(socket) {
	socket.on('disconnect', function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}


