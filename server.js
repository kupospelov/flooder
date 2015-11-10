var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var ws = require('ws');

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

var broadcastMessage = function(author, message) {
	console.log('Resending to ' + wss.clients.length + ' clients');
	wss.clients.forEach(function(client) {
		client.send(JSON.stringify({ author: author, message: message }));
	});
};

var broadcastNotification = function(message) {
	wss.clients.forEach(function(client) {
		client.send(JSON.stringify({ notification: true, message: message }));
	});
};

wss.on("connection", function(ws) {
	var name = 'User' + ++userIndex;
	
	broadcastNotification(name + ' connected!');
	
	ws.on('message', function(data) {
		if (data !== undefined && data !== '')
		{
			broadcastMessage(name, data);
		}
	});
	
	wss.on('close', function(data) {
		broadcastNotification(name + ' disconnected');
	});
});



server.listen(80);
