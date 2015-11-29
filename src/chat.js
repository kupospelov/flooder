var ws = require('ws');
var db = require('./db.js');
var config = require('./config.js');

var userIndex = 0;
var wss = ws.createServer({ port: config.socketPort });

wss.on("connection", function(ws) {
	var name = 'User' + ++userIndex;
	
	db.retrieveMessages(0, function(error, data) {
		for (var i = data.length - 1; i >= 0; --i) {
			if (!data[i].notification) {
				ws.send(data[i]);
			}
		}
		
		exports.handleNotification(name + ' connected');
	});
	
	ws.on('message', function(data) {
		if (data !== undefined && data !== '') {
			var message = JSON.parse(data);
			exports.handleMessage(message.token, message.text);
		}
	});
	
	ws.on('close', function(data) {
		exports.handleNotification(name + ' disconnected');
	});
});

var broadcastMessage = function(message) {
	console.log('Resending to ' + wss.clients.length + ' clients');
	
	wss.clients.forEach(function(client) {
		if (client.readyState === 1) {
			client.send(message);
		}
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
