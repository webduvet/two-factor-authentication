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

var pin = require('./services/pin_service.js');
var mobile = require('./services/mobile_service.js');

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
	var con = connections[socket.id];

	socket.on('phoneEntered', function(message) {

		// check for active timeout;
		if ( !con.timeout) {
			con.timeout = Date.now() + 5*60*1000;
			con.phone = message.phone
			con.pin = pin.request(con.phone);

			// TODO send pin
			socket.emit('phoneResult', {
				msg: "success"
			});
		}	else if ( con.timeout < Date.now() ){
			socket.emit('error', {
				msg: 'expecting PIN',
				timeleft: con.timeout - Date.now()
			});
		} else if (con.timeout > Date.now()) {
			delete con.timeout;
			socket.emit('error', {
				msg: 'timeout'
			});
		}
	});

	socket.on('pinEntered', function(message) {
		var con = connections[socket.id];
		if ( !con.timeout ) {
			socket.emit('error', {
				msg: "pin not expected"
			});
		} else if (con.timeout > Date.now()) {
			delete con.timeout;
			socket.emit('error', {
				msg: 'timeout'
			});
			socket.disconnect();
		} else {
			pin.verify(message.pin, con.pin, function(err){
				if (err) {
					socket.emit('error', {
						msg: 'pin verification error',
						err: err
					});
				} else {
					ref
					.child('mobile_index/' + con.phone)
					.once('value', function(ss){
						if(ss.val()){
							generateJwt(socket, ss.val(), true);
							socket.disconnect();
							delete connections[socket.id];
						} else {
							con.verified = true;
							socket.emit('nameRequest');
						}
					});
				}
			});
		}
	});
}


/**
 * we know at this stage that this should be a new user
 */
function handleName(socket) {
	socket.on('nameEntered', function(message){
		var con = connections[socket.id];
		if (con.verified && con.timeout < Date.now()){

		} else {
			socket.emit('error', {
				msg: 'timout'
			});
		}
		var newID = ref.child('users/').push();
		con.name = message.name;
		con.created = Firebase.ServerValue.TIMESTAMP;
		delete con.pin;
		delete con.verified;
		delete con.time;
		newID.set({
			object: con
		}, function(err){
			if(!err){
				generateJwt(socket, newID.key());
				// update mobile index
				ref
					.child('mobile_index/'+con.phone)
					.set(newID.key());
				socket.disconnect();
				delete connections[socket.id];
			} else {
				socket.emit('error', err);
				socket.disconnect();
				delete connections[socket.id];
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


