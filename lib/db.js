var redis = require('redis'),
	client = redis.createClient();
	
exports.storeMessage = function(room, message) {
	client.lpush('room:' + room, message);
}

exports.retrieveMessages = function(room, handler) {
	client.lrange('room:' + room, 0, -1, handler);
}