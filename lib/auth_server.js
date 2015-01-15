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

		console.log("new connection: ",socket.id);

		connections[socket.id] = {
			id: socket.id
		};

		handleNumber(socket);
		handleName(socket);

		socket.emit('socket-opened', {user:"UID for user", text:"new socket opened"});

		handleClientDisconnection(socket);
	});
};


function handleNumber(socket) {
	socket.on('phoneEntered', function(message) {
		connections[socket.id].phone = message.phone;
		socket.emit('phoneResult', {
			error: false,
			msg: "success"
		});
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
	});
}


