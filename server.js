var 
		fs = require('fs'),
		path = require('path'),
		mime = require('mime'),
		cache = {},
		clc = require('cli-color'),
		http = require('http');

function send404(res){
	res.writeHead(404, {'Content-Type':'text/plain'});
	res.write('Error 404: resource not found.');
	res.end();
}

function sendFile(res, filePath, fileContents){
	res.writeHead(200, {"Content-Type":mime.lookup(path.basename(filePath))});
	res.end(fileContents);
}

function serveStatic(res, cache, absPath) {
	if (cache[absPath]) {
		sendFile(res, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, function(err, data){
					if(err) {
						send404(res);
					} else {
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				});
			} else {
				send404(res);
			}
		});
	}
}

var server = http.createServer(function(req, res){
	var filePath = false;

	if(req.url=='/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}
	var absPath = './' + filePath;
	serveStatic(res, cache, absPath);
});

server.listen(3001, function(){
	console.log(clc.green("server listening on port 3001"));
});

var authServer = require('./lib/auth_server.js');
authServer.listen(server);
//console.log(server);

