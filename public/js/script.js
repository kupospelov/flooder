var socket = new WebSocket('ws://' + location.hostname + ':8080');

window.onload = function() {
	var model = new (function() {
		this.messages = ko.observableArray([]);
		this.messagetext = ko.observable();
		
		this.sendMessage = function() {
			socket.send(this.messagetext());
			this.messagetext('');
		},
		
		this.keypressHandler = function(data, event) {
			if (event.keyIdentifier === "Enter") {
				this.sendMessage();
				return false;
			}
			
			return true;
		}
	})();
	
	socket.onmessage = function(message) {
		var m = JSON.parse(message.data);
		var date = new Date(), hh = date.getHours(), mm = date.getMinutes();
		var time = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
		
		if (m.notification) {
			model.messages.push({
				name: 'System',
				message: m.message,
				time: time
			});
		}
		else {
			model.messages.push({
				name: m.author,
				message: m.message,
				time: time
			});
		}
	};

	ko.applyBindings(model);
};

