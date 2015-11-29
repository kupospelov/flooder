var fs = require('fs');
var path = require('path');
var mime = require('mime');

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var db = require('./db.js');
var chat = require('./chat.js');
var config = require('./config.js');

function sendResponse(response, code, message) {
	response.status(code).json(message);
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

function sendPage(response, name) {
		response.sendFile('index.html', { root: __dirname + '/../public/' }, function(error) {
		if (error) {
			sendNotFound(response);
		}
	});
}

var app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.get(['/', '/create', '/chat'], function(request, response) {
	sendPage(response, 'index.html');
});

app.get('/signin', function(request, response) {
	sendPage(response, 'index.html');
});

app.post('/api/signout', function(request, response) {
	// some sign out logic
});

app.post('/api/signin', function(request, response) {
	var user = request.body;
	
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
						response.cookie('Token', token, { expires: new Date(Date.now() + config.tokenTimeout) });
						response.sendStatus(200);
					}
				});
			}
			else {
				sendNotAuthorized(response);
			}
		}
	});
});

app.use(express.static('public'));
app.listen(config.serverPort);
