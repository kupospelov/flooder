var fs = require('fs');
var path = require('path');

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

function sendNotFound(response, message) {
	sendResponse(response, 404, message || 'Nothing found');
}

function sendNotAuthorized(response, message) {
	sendResponse(response, 401, message || 'Authorization required');
}

function sendForbidden(response, message) {
    sendResponse(response, 403, message || 'Wrong parameters')
}

function sendServerError(response, message) {
	sendResponse(response, 500, message || 'Server error');
}

function sendIndex(response) {
    response.sendFile('index.html', { root: __dirname + '/../public/' }, function(error) {
		if (error) {
			sendNotFound(response);
		}
	});
}

function isAuthenticated(request, response, next) {
    db.checkToken(request.cookies.Token, function(error, name) {
		if (error === null && name !== null) {
			next();
		}
		else {
			response.redirect('/signin');
		}
	});
}

function checkAuthorized(request, response, next) {
    db.checkToken(request.cookies.Token, function(error, name) {
		if (error === null && name !== null) {
			next();
		}
		else {
			sendNotAuthorized(response);
		}
	});
}

var app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.get('/', isAuthenticated, function(request, response) {
    sendIndex(response);
});

app.get('/chat/:chatid', isAuthenticated, function(request, response) {
    db.checkRoom(request.params.chatid, function(error, name) {
        if (name) {
            sendIndex(response);
        }
        else {
            response.redirect('/error');
        }
    });
});

app.get(['/signin', '/signup', '/error'], function(request, response) {
    sendIndex(response);
});

app.post('/api/signout', checkAuthorized, function(request, response) {
	db.expireToken(request.cookies.Token, function() {
		response.sendStatus(200);
	});
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
						sendData(response, {
                            name: user.login,
							token: token
						});
					}
				});
			}
			else {
				sendForbidden(response, 'Wrong login or password');
			}
		}
	});
});

app.post('/api/chat', checkAuthorized, function(request, response) {
    db.createRoom('', function(error, room) {
        if (error) {
            sendServerError(response, 'Error while creating room');
        }
        else {
            sendData(response, {
                room: room
            });
        }
    });
});

app.post('/api/users', function(request, response) {
    var user = request.body;
    
    if (!user.login) {
        sendForbidden(response, 'Login cannot be empty');
    }
    else if (!user.password) {
        sendForbidden(response, 'Password cannot be empty');
    }
    else {
        db.checkUser(user.login, function(error, registered) {
            if (registered) {
                sendForbidden(response, 'User with the same name already exists');
            }
            else {
                db.createUser(user.login, user.password, function(error, status) {
                    response.sendStatus(200);
                });
            }
        });
    }
});

app.use(express.static('public'));
app.listen(config.serverPort);
