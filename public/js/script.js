window.onload = function() {
	var socket = new WebSocket('ws://' + location.hostname + ':8080');
	socket.onmessage = function(message) {
		var m = JSON.parse(message.data);
		var date = new Date(m.time), hh = date.getHours(), mm = date.getMinutes();
		var time = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
		
		if (m.notification) {
			model.messages.push({
				name: '',
				text: m.text,
				time: time
			});
		}
		else {
			model.messages.push({
				name: m.name + ':',
				text: m.text,
				time: time
			});
		}
		
		window.scrollTo(0, document.body.scrollHeight);
	};
	
	var sendRequest = function(method, path, data, handler) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			handler(xhr.readyState, xhr.status, xhr.responseText);
		};
		xhr.open(method, path, true);
		xhr.send(data);
	};
	
	var model = new (function() {
		var self = this;
		
		// States
		this.LOADING = ko.observable(true);
		this.SIGNIN = ko.observable(false);
		this.REGISTER = ko.observable(false);
		this.CREATEROOM = ko.observable(false);
		this.INROOM = ko.observable(false);
		
		var setState = function(state) {
			self.LOADING(self.LOADING === state);
			self.SIGNIN(self.SIGNIN === state);
			self.REGISTER(self.REGISTER === state);
			self.CREATEROOM(self.CREATEROOM === state);
			self.INROOM(self.INROOM === state);
		}
		
		// Chat room
		this.userName = ko.observable('');
		this.messages = ko.observableArray([]);
		this.messageText = ko.observable('');
		this.sendMessage = function() {
			socket.send(this.messageText());
			self.messageText('');
		},
		this.keypressHandler = function(data, event) {
			if (event.keyIdentifier === 'Enter') {
				self.sendMessage();
				return false;
			}
			
			return true;
		}
		
		// Credentials
		this.login = ko.observable('');
		this.password = ko.observable('');
		this.openSignIn = function() {
			setState(self.SIGNIN);
		},
		this.openRegister = function() {
			setState(self.REGISTER);
		},
		this.checkToken = function() {
			var token = localStorage.getItem('token');
			sendRequest('POST', '/api/knock', JSON.stringify({ token: token }), function(state, status, reply) {
				if (state === 4 && status === 200 && reply) {
					var user = JSON.parse(reply);
					
					if (user.name) {
						self.userName(user.name);
						setState(self.CREATEROOM);
						return;
					}
				}
				
				setState(self.SIGNIN);
			});
		},
		this.signIn = function() {
			sendRequest('POST', '/api/signin', JSON.stringify({ login: self.login(), password: self.password() }), function(state, status, reply) {
				if (state === 4 && status === 200) {
					var user = JSON.parse(reply);
					localStorage.setItem('token', user.token);
					
					self.userName(user.name);
					setState(self.CREATEROOM);
				}
			});
		},
		this.signOut = function() {
			sendRequest('POST', '/api/signout', JSON.stringify({ token: localStorage.getItem('token') }), function() {
				self.userName('');
				setState(self.SIGNIN);
			});
		},
		this.register = function() {
			
		}
	})();
	
	model.checkToken();
	ko.applyBindings(model);
};

