var redis = require('redis'),
	crypto = require('crypto'),
	config = require('./config'),
	client = redis.createClient();
	
client.on('error', function(error) {
	console.log('Redis error: ' + error);
});
	
// Helpers
var generateHash = function(text) {
	return crypto.createHash('sha1').update(text).digest('hex');
}

// Messages
exports.storeMessage = function(room, message, handler) {
	client.lpush('room:' + room, message, handler);
};

exports.retrieveMessages = function(room, handler) {
	client.lrange('room:' + room, 0, -1, handler);
};

// Rooms
exports.createRoom = function(message, handler) {
    crypto.randomBytes(10, function(error, room) {
        if (error) {
            handler(new Error('Error while generating random value'));
        }
        else {        
            var roomid = room.toString('hex');
            client.lpush('room:' + roomid, message, function() {
                handler(null, roomid);
            });
        }
    });
};

exports.checkRoom = function(room, handler) {
    client.exists('room:' + room, handler);  
};

// Authorization
exports.createUser = function(login, password, handler) {
	client.hset('users', login, generateHash(password), handler);
};

exports.checkUser = function(login, handler) {
    client.hget('users', login, function(error, token) {
        handler(error, !!token);
    });
};

exports.createToken = function(login, handler) {
	crypto.randomBytes(32, function(error, token) {
		if (error || !token) {
			handler(new Error('Token was not generated'));
		}
		else {
            var tokenValue = token.toString('hex');
            client.set('token:' + tokenValue, login, function(error, reply) {
                if (error || !reply) {
                    handler(new Error('Token was not set'));
                }
                else {
                    exports.prolongToken(tokenValue, handler);
                }
            });
        }
	});
};

exports.prolongToken = function(token, handler) {
	client.expire('token:' + token, config.tokenTimeout, function(error, reply) {
		if (error || !reply) {
			handler(new Error('Expiration was not set'));
		}
		else {
			handler(null, token);
		}
	});
};

exports.expireToken = function(token, handler) {
	client.del('token:' + token, handler);	
};

exports.checkToken = function(token, handler) {
	client.get('token:' + token, function(error, login) {
		if (error) {
			handler(new Error('Error while retrieving token'));
		}
		else {
		  handler(null, login);
        }
	});
};

exports.checkCredentials = function(login, password, handler) {
	client.hget('users', login, function(error, hash) {
		if (error) {
			handler(new Error('Error while retrieving storage object'));
		}
		else {
            if (generateHash(password) == hash) {
                handler(null, true);
            }
            else {
                handler(null, false);	
            }
        }
	});
};