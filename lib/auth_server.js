var clc = require('cli-color');
var socketio = require('socket.io'),
		io,
		guestNumber = 1,
		nickNames = {},
		namesUsed = [],
		currentRoom = {},
		allRooms = {},
		currentCandidates = {},
		currentNumbers = {},
		connections = {};

/**
 * Firebase
 */
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(require('../config/firebase.js').securityToken);
var Firebase = require('firebase'),
		ref = new Firebase(require('../config/firebase.js').url);

/**
 * services
 */
var pin = require('./services/pin_service.js');
var mobile = require('./services/mobile_service.js');


/*
 * start socket on existing http server
 */
exports.listen = function(server) {
	io = socketio.listen(server);
	//io.set('log level', 1);
	io.sockets.on('connection', function(socket){

		connections[socket.id] = {
			id: socket.id
		};

		console.log("new connection: ",socket.id);
		console.log("all connections: ",Object.keys(connections).length);

		handleNumber(socket);
		handleName(socket);
		handleErrors(socket);
		handleClientDisconnection(socket);
	});
};


/**
 * ********************* HANDLERS **********************
 */

function handleNumber(socket) {
	var con = connections[socket.id];

	socket.on('phoneEntered', function(message) {

		//console.log('phoneEntered',message);

		// check for active timeout;
		if ( !con.timeout) {
			con.timeout = Date.now() + 5*60*1000;
			con.phone = message.phone;
			con.pin = pin.request(con.phone);

			//console.log("con pin:", con.pin);

			// TODO send pin
			socket.emit('phoneResult', {
				msg: "success"
			});
		}	else if ( con.timeout > Date.now() ){
			socket.emit('err', {
				code: 05,
				msg: 'expecting PIN',
				timeleft: con.timeout - Date.now()
			});
		} else if (con.timeout < Date.now()) {
			delete con.timeout;
			socket.emit('err', {
				code: 04,
				msg: 'timeout'
			});
		}
	});

	socket.on('pinEntered', function(message) {
		var con = connections[socket.id];
		if ( !con.timeout ) {
			socket.emit('err', {
				code: 05,
				msg: "pin not expected"
			});
		} else if (con.timeout < Date.now()) {
			delete con.timeout;
			socket.emit('err', {
				code: 04,
				msg: 'timeout'
			});
			socket.disconnect();
		} else {
			if (message.pin != con.pin){
				socket.emit('err', {
					code: 02,
					msg: 'pin verification error'
				});
			} else {
				ref
				.child('users/' + indexify(con.phone))
				.once('value', function(ss){
					if(ss.val()){
						var userObject = ss.val().object;
						generateJwt(socket, userObject.uid, true);
						socket.disconnect();
						delete connections[socket.id];
					} else {
						con.verified = true;
						socket.emit('nameRequest');
					}
				});
			}
		}
	});
}

/**
 * we know at this stage that this should be a new user
 */
function handleName(socket) {
	socket.on('nameEntered', function(message){
		var con = connections[socket.id];
		console.log('condition',con.verified && con.timeout > Date.now());
		if (con.verified && con.timeout > Date.now()){
			handleNameEntered();
		} else {
			console.log('name timeout error');
			socket.emit('err', {
				code: 04,
				msg: 'timout'
			});
		}
		function handleNameEntered(){
			var phoneId = indexify(con.phone);
			var newID = ref.child('users/'+phoneId);
			con.name = message.name;
			con.created = Firebase.ServerValue.TIMESTAMP;
			// deleting socket info from the object
			delete con.pin;
			delete con.id;
			delete con.verified;
			delete con.time;
			delete con.timeout;
			con.uid = newID.child('uid').push().key();
			//console.log("con as before saving", con);
			newID.set({
				object: con
			}, function(err){
				if(!err){
					generateJwt(socket, newID.key());
					// update mobile index
					ref
						.child('mobile_index/'+indexify(con.phone))
						.set(con.uid);
					socket.disconnect();
					delete connections[socket.id];
				} else {
					socket.emit('err', {
						code: 05,
						msg: "firebase error",
						error: err
					});
					socket.disconnect();
					delete connections[socket.id];
				}
			});
		}

	});
}

/**
 * prepare for firebase index
 * by stripping off all non word characters
 */
function indexify(str){
	return str.replace(/[\+ ;\.]/g,'');
}

/**
 * takes care of creation of JWT for firebase
 */
function generateJwt(socket, uid, existing){
	connections[socket.id].uid = uid;
	var jwt = tokenGenerator.createToken({
		uid:uid,
		phone_index: indexify(connections[socket.id].phone),	
		phone:connections[socket.id].phone
	});
	connections[socket.id].jwt = jwt;
	socket.emit('jwtGenerated',{
		jwt: jwt,
		phone_index: indexify(connections[socket.id].phone), // only for testing, in real life we authenticate already
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
		console.log(socket.id, 'disconnected');
		delete connections[socket.id];
	});
}

function handleErrors(socket){
	socket.on('err', function(err){
		console.log('error occured', err);
	});
	socket.on('err', function(err){
		console.log('error occured', err);
	});
}
