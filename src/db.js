var redis = require('redis'),
	crypto = require('crypto'),
	config = require('./config'),
	client = redis.createClient();
	
client.on('error', function(error) {
	console.log('Redis error: ' + error);
});
	
// Helpers
var generateHash = function(text) {
	var sha1 = crypto.createHash('sha1');
	return sha1.update(text).digest('hex');
}
	
// Messages
exports.storeMessage = function(room, message) {
	client.lpush('room:' + room, message);
};

exports.retrieveMessages = function(room, handler) {
	client.lrange('room:' + room, 0, -1, handler);
};

// Authorization
exports.createUser = function(login, password, handler) {
	client.hset('users', login, generateHash(password), handler);
};

exports.createToken = function(login, handler) {
	crypto.randomBytes(32, function(error, token) {
		if (error) {
			handler(error);
		}
		
		if (token) {
			var tokenValue = token.toString('hex');
			
			client.set(tokenValue, login, function(error, reply) {
				if (error) {
					handler(error);
				}
		
				if (reply) {
					exports.prolongToken(tokenValue, handler);
				}
				else {
					handler(new Error('Token was not set'))
				}
			});
		}
		else {
			handler(new Error('Token was not generated'));
		}
	});
};

exports.prolongToken = function(token, handler) {
	client.expire(token, config.tokenTimeout, function(error, reply) {
		if (error) {
			handler(error);
		}
		
		if (reply) {
			handler(null, token);
		}
		else {
			handler(new Error('Expiration was not set'));
		}
	});
};

exports.expireToken = function(token, handler) {
	client.del(token, handler);	
};

exports.checkToken = function(token, handler) {
	client.get(token, function(error, login) {
		if (error) {
			handler(error);
		}
		
		handler(null, login);
	});
};

exports.checkCredentials = function(login, password, handler) {
	client.hget('users', login, function(error, hash) {
		if (error) {
			handler(error);
		}
		
		if (generateHash(password) == hash) {
			handler(null, true);
		}
		else {
			handler(null, false);	
		}
	});
};