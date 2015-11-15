var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var db = require('./db.js');
var chat = require('./chat.js');

function sendResponse(response, code, message) {
	response.writeHead(code, { 'Content-Type': 'application/json' });
	response.write(JSON.stringify(message));
	response.end();
}

function sendData(response, data) {
	sendResponse(response, 200, data);
}

function sendNotFound(response) {
	sendResponse(response, 404, 'Nothing found');
}

function sendNotAuthorized(response) {
	sendResponse(response, 401, 'Not authorized');
}

function sendServerError(response, message) {
	sendResponse(response, 500, message || 'Server error');
}

function serveStaticContent(response, path)
{
	if (fs.exists) {
		fs.readFile(path, function (error, data) {
			if (error) {
				sendNotFound(response);
			}
			else {
				response.writeHead(200, { 'Content-Type': mime.lookup(path) });
				response.end(data);
			}
		});
	}
	else {
		sendNotFound(response);
	}
}

function receiveData(request, handler) {
	var body = '';
	
	request.on('data', function(data) {
		body += data;
	});
	
	request.on('end', function() {
		handler(body);
	});
}

var server = http.createServer(function(request, response) {	
	switch (request.url) {
		case '/api/knock':
			if (request.method === 'POST') {
				receiveData(request, function(data) {
					var user = JSON.parse(data);
					db.checkToken(user.token, function(error, name) {
						sendData(response, { name: name });
						
						if (name) {
							db.prolongToken(user.token, function(error) {
								if (error) {
									console.log('Error while prolonging token');
								}
							});
						}
					});
				});
				break;
			}
		
		case '/api/signin':
			if (request.method === 'POST') {
				receiveData(request, function(data) {
					var user = JSON.parse(data);
					db.checkCredentials(user.login, user.password, function(error, reply) {
						if (error) {
							sendServerError(response, 'Error while checking credentials');
						}
						else {
							if (reply) {
								db.createToken(user.login, function(error, token) {
									if (error) {
										sendServerError(response, 'Error while creating token');	
									}
									else {
										sendData(response, { name: user.login, token: token });
									}
								});
							}
							else {
								sendNotAuthorized(response);
							}
						}
					});
				});
				break;
			}
			
		case '/api/signout':
			if (request.method === 'POST') {
				receiveData(request, function(data) {
					var user = JSON.parse(data);
					db.expireToken(user.token, function(error) {
						if (error) {
							console.log('Error while expiring token');
						}
						
						sendData(response, 'OK');
					});
				});
				break;
			}
			
		default:
			var path = request.url === '/' ? './public/index.html' : './public' + request.url;
			serveStaticContent(response, path);
			break;
	}
});

server.listen(80);
