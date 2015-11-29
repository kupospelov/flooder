var app = angular.module('flooder', ['ngRoute']);

app.controller('mainController', function($scope) {
	$scope.userName = '123';
	$scope.token = '123';
});

app.controller('chatController', function($scope) {
	var socket = new WebSocket('ws://' + location.hostname + ':8080');
	socket.onmessage = function(message) {
		var m = JSON.parse(message.data);
		var date = new Date(m.time), hh = date.getHours(), mm = date.getMinutes();
		var time = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
		
		if (m.notification) {
			$scope.messages.push({
				name: '',
				text: m.text,
				time: time
			});
		}
		else {
			$scope.messages.push({
				name: m.name + ':',
				text: m.text,
				time: time
			});
		}
		
		$scope.$apply();
		window.scrollTo(0, document.body.scrollHeight);
	};
	
	$scope.messages = [];
	$scope.messageText = '';
	$scope.sendMessage = function() {
		socket.send(JSON.stringify({
			token: $scope.token,
			text: $scope.messageText
		}));
		$scope.messageText = '';
	};
});

app.controller('signinController', function($scope, $http, $location) {
	$scope.welcomeMessage = 'Please sign in';
	$scope.buttonText = 'Sign in';
	$scope.login = '';
	$scope.password = '';
	
	$scope.sendCredentials = function() {
		$http.post('/api/signin', {
			login: $scope.login,
			password: $scope.password
		}).then(function(response) {
			$location.path('/create');
		});
	};
});

app.controller('signupController', function($scope) {
	$scope.welcomeMessage = 'Please enter your name and password';
	$scope.buttonText = 'Register';
	$scope.login = '';
	$scope.password = '';
	
	$scope.sendCredentials = function() {
		$scope.socket.send(JSON.stringify({
			type: 'signup',
			login: $scope.login,
			password: $scope.password
		}));
	};
});

app.config(function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/chat', {
			templateUrl: 'views/chat.html',
			controller: 'chatController'
		})
		.when('/signin', {
			templateUrl: 'views/enter.html',
			controller: 'signinController'
		})
		.when('/signup', {
			templateUrl: 'views/enter.html',
			controller: 'signupController'
		})
		.when('/create', {
			templateUrl: 'views/create.html',
			controller: 'chatController'
		})
		.otherwise({
			redirectTo: '/'
		});
		
	$locationProvider.html5Mode(true);
});
