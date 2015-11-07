var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

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

server.listen(80);