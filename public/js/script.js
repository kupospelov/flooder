var app = angular.module('flooder', ['ngRoute', 'ngCookies']);

app.controller('mainController', function($scope, $http, $location, $cookies) {
	$scope.userName = localStorage.getItem('name');
	$scope.token = $cookies.get('Token');
	$scope.authorized = true;
	
    $scope.setAuthorized = function(value) {
        $scope.authorized = value;
    };
    
	$scope.signOut = function() {
		$http.post('/api/signout', { }).then(function(response) {
			localStorage.removeItem('name');
			$cookies.remove('Token');
			$location.path('/signin');
		});
	};
    
    $scope.createRoom = function() {
        $http.post('/api/chat', { }).then(function(response) {
            $location.path('/chat/' + response.data.room);
        });
    };
});

app.controller('chatController', function($scope, $routeParams) {
	var socket = new WebSocket('ws://' + location.hostname + ':8080');
	socket.onopen = function() {
		socket.send(JSON.stringify({
			type: 'hello',
            room: $routeParams.chatid,
			token: $scope.token
		}));
	};
    
	socket.onmessage = function(message) {
		var m = JSON.parse(message.data);
		var date = new Date(m.time), hh = date.getHours(), mm = date.getMinutes();
		var time = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
		
		if (m.type === 'notification') {
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

app.controller('signinController', function($scope, $http, $location, $cookies) {
	$scope.setAuthorized(false);
	$scope.welcomeMessage = 'Please sign in';
	$scope.buttonText = 'Sign in';
	$scope.login = '';
	$scope.password = '';
    
	$scope.sendCredentials = function() {
		$http.post('/api/signin', {
			login: $scope.login,
			password: $scope.password
		}).then(function(response) {
            $scope.setAuthorized(true);
			$scope.name = $scope.login;
			$scope.token = response.data.token;
			$cookies.put('Token', response.data.token);
			localStorage.setItem('name', $scope.name);
            $location.path('/');
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
		.when('/chat/:chatid', {
			templateUrl: 'views/chat.html',
			controller: 'chatController'
		})
		.when('/signin', {
			templateUrl: 'views/signin.html',
			controller: 'signinController'
		})
		.when('/signup', {
			templateUrl: 'views/signin.html',
			controller: 'signupController'
		})
		.otherwise({
			templateUrl: 'views/root.html',
			controller: 'mainController'
		});
		
	$locationProvider.html5Mode(true);
});
