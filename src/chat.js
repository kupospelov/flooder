var ws = require('ws');
var db = require('./db.js');

var userIndex = 0;
var wss = ws.createServer({ port: 8080 });

wss.on("connection", function(ws) {
	var name = 'User' + ++userIndex;
	
	db.retrieveMessages(0, function(error, data) {
		for (var i = data.length - 1; i >= 0; --i) {
			ws.send(data[i]);
		}
		
		exports.handleNotification(name + ' connected');
	});
	
	ws.on('message', function(data) {
		if (data !== undefined && data !== '')
		{
			handleMessage(name, data);
		}
	});
	
	ws.on('close', function(data) {
		exports.handleNotification(name + ' disconnected');
	});
});

var broadcastMessage = function(message) {
	console.log('Resending to ' + wss.clients.length + ' clients');
	
	wss.clients.forEach(function(client) {
		client.send(message);
	});
};

exports.handleNotification = function(text) {
	var date = new Date();
	var message = JSON.stringify({
		notification: true,
		text: text,
		time: date.toUTCString()
	});
	
	broadcastMessage(message);
	db.storeMessage(0, message);
};

exports.handleMessage = function(name, text) {
	var date = new Date();
	var message = JSON.stringify({
		name: name,
		text: text,
		time: date.toUTCString()
	});
	
	broadcastMessage(message);
	db.storeMessage(0, message);
};
