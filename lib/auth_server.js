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

var connections = {};
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(require('../config/firebase.js').securityToken);
var Firebase = require('firebase'),
		ref = new Firebase(require('../config/firebase.js').url);

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);
	io.sockets.on('connection', function(socket){

		connections[socket.id] = {
			id: socket.id
		};

		handleNumber(socket);
		handleName(socket);

		//guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

		socket.emit('socket-opened', {user:"UID for user", text:"new socket opened"});

		handleClientDisconnection(socket, nickNames, namesUsed);
	});
};

/*

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
*/

function handleNumber(socket) {
	socket.on('phoneEntered', function(message) {
		connections[socket.id].phone = message.phone;
		socket.emit('phoneResult', message);
	});
	socket.on('pinEntered', function(message) {
		//TODO verify the pin
		ref
		.child('mobile_index/' + connections[socket.id].phone)
		.once('value', function(ss){
			if(ss.val()){
				generateJwt(socket, ss.val(), true);
			} else {
				socket.emit('nameRequest');
			}
		});
	});
}


/**
 * we know at this stage that this should be a new user
 */
function handleName(socket) {
	socket.on('nameEntered', function(message){
		var newID = ref.child('users/').push();
		connections[socket.id].name = message.name;
		newID.set({
			object: connections[socket.id]
		}, function(err){
			if(!err){
				generateJwt(socket, newID.key());
				// update mobile index
				ref
					.child('mobile_index/'+connections[socket.id].phone)
					.set(newID.key());
			} else {
				socket.emit('error', err);
			}
		});
	});
}

function handleTokenGenerate(socket) {
	socket.on('jwt', function(message) {

		// TODO store iuser activity trace in memory so we can say that he intered a valid PIN thus
		// is already authenticated with us and we can generate authentication code with Firebase

		// TODO design how to manage users - firebase or external db? 
		// do we generate UID and push to firebase synchronously or async? do we need to wait until we 100% have to user in firebae?
		var jwt = tokenGenerator.createToken({uid:"TODO push to firebase", name:"get user name from memory"});
		socket.emit('jwtGenerated',jwt);
	});
}

/**
 * takes care of creation of JWT for firebase
 */
function generateJwt(socket, uid, existing){
	connections[socket.id].uid = uid;
	var jwt = tokenGenerator.createToken({
		uid:uid, 
		phone:connections[socket.id].phone
	});
	connections[socket.id].jwt = jwt;
	socket.emit('jwtGenerated',{
		jwt: jwt,
		uid: uid,
		existing: !!existing
	});
	// with this user can authenticate with his original account
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
		delete connections[socket.id];
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}


