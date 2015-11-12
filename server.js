var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var ws = require('ws');
var db = require('./lib/db.js');

var userIndex = 0;

function sendNotFound(response) {
	response.writeHead(404, { 'Content-Type': 'text/plain' });
	response.write('not found');
	response.end();
}

function serveStaticContent(response, path)
{
	if (fs.exists) {
		fs.readFile(path, function (error, data) {
			if (error)
			{
				sendNotFound(response);
			}
			else
			{
				response.writeHead(200, { 'Content-Type': mime.lookup(path) });
				response.end(data);
			}
		});
	}
	else
	{
		sendNotFound(response);
	}
}

var server = http.createServer(function(request, response) {
	var path = 'public/index.html';
	
	if (request.url != '/')
	{
		path = './public' + request.url;
	}
	
	serveStaticContent(response, path);
});

var wss = ws.createServer({ port: 8080 });

var broadcastMessage = function(message) {
	console.log('Resending to ' + wss.clients.length + ' clients');
	
	wss.clients.forEach(function(client) {
		client.send(message);
	});
};

var handleNotification = function(text) {
	var message = JSON.stringify({ notification: true, text: text });
	
	broadcastMessage(message);
	db.storeMessage(0, message);
};

var handleMessage = function(name, text) {
	var message = JSON.stringify({ name: name, text: text });
	
	broadcastMessage(message);
	db.storeMessage(0, message);
};

wss.on("connection", function(ws) {
	var name = 'User' + ++userIndex;
	
	db.retrieveMessages(0, function(error, data) {
		for (var i = data.length - 1; i >= 0; --i) {
			ws.send(data[i]);
		}
		
		handleNotification(name + ' connected');
	});
	
	ws.on('message', function(data) {
		if (data !== undefined && data !== '')
		{
			handleMessage(name, data);
		}
	});
	
	ws.on('close', function(data) {
		handleNotification(name + ' disconnected');
	});
});

server.listen(80);
