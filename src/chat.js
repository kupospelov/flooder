var ws = require('ws');
var db = require('./db.js');
var config = require('./config.js');

var wss = ws.createServer({ port: config.socketPort });
var rooms = {};

wss.on('connection', function(ws) {
	ws.confirmed = false;
	
	ws.on('message', function(data) {
		if (data !== undefined && data !== '') {
			var message = JSON.parse(data);
			
			if (ws.confirmed) {
				db.checkToken(message.token, function(error, name) {
					if (error === null) {
						exports.handleMessage(name, ws.room, message.text);
					}
				});
			}
			else {
				if (message.type === 'hello') {
					db.checkToken(message.token, function(error, name) {
						if (error === null && name !== null) {
                            db.checkRoom(message.room, function(error, exists) {
                                if (exists)
                                {
                                    ws.confirmed = true;
                                    ws.name = name;
                                    ws.room = message.room;
                                                  
                                    db.retrieveMessages(ws.room, function(error, data) {
                                        for (var i = data.length - 1; i >= 0; --i) {
                                                ws.send(data[i]);
                                        }
                                                                              
                                        if (rooms[ws.room] === undefined) {
                                            rooms[ws.room] = [];
                                        }
                                        
                                        var exists = rooms[ws.room].find(function(item) {
                                            return item.name === ws.name;
                                        });
                                        
                                        rooms[ws.room].push(ws);
                                        
                                        if (exists === undefined)
                                        {
                                            exports.handleNotification(ws.room, name + ' connected');
                                        }
                                    });
                                }
                            });
						}
					});
				}
			}
		}
	});
	 
	ws.on('close', function(data) {
        if (rooms[ws.room]) {
            var index = rooms[ws.room].indexOf(ws);
            
            if (index !== -1) {
                rooms[ws.room].splice(index, 1);
                
                var exists = rooms[ws.room].find(function(item) {
                    return item.name === ws.name;
               });
                
                if (exists === undefined) {
                    exports.handleNotification(ws.room, ws.name + ' disconnected');
                }
            }
        }
	});
});

var broadcastMessage = function(room, message) {
	console.log('Resending to ' + rooms[room].length + ' clients in room ' + room);
	
	rooms[room].forEach(function(client) {
		if (client.readyState === 1 && client.confirmed === true) {
			client.send(message);
		}
	});
};

exports.handleNotification = function(room, text) {
	var date = new Date();
	var message = JSON.stringify({
		type: 'notification',
		text: text,
		time: date.toUTCString()
	});
	
	broadcastMessage(room, message);
	db.storeMessage(room, message);
};

exports.handleMessage = function(name, room, text) {
	var date = new Date();
	var message = JSON.stringify({
		name: name,
		text: text,
		time: date.toUTCString()
	});
	
	broadcastMessage(room, message);
	db.storeMessage(room, message);
};
