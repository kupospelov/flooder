var app = angular.module('flooder', ['ngRoute', 'ngCookies', 'ngAnimate']);

app.controller('mainController', function($scope, $http, $location, $cookies, $timeout) {
	$scope.userName = localStorage.getItem('name');
	$scope.token = $cookies.get('Token');
	$scope.authorized = true;
	$scope.toastText = '';
    $scope.toastShown = false;
    
    var toastTimer = 0;
    
    $scope.setAuthorized = function(value) {
        $scope.authorized = value;
    };
    
    $scope.setUser = function(name, token) {
        $scope.userName = name;
        $scope.token = token;
        localStorage.setItem('name', name);
        $cookies.put('Token', token);
    };
    
    $scope.showToast = function(text) {       
        $timeout.cancel(toastTimer);
        
        $scope.toastText = text;
        $scope.toastShown = true;
        
        toastTimer = $timeout(function() {
            $scope.toastShown = false;
        }, 4000);
    };
    
    $scope.showError = function(text) {
        $scope.showToast(text || 'Error occured');
    };
    
    $scope.signIn = function() {
        $location.path('/signin');  
    };
    
    $scope.signUp = function() {
        $location.path('/signup');
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
    
    $scope.$on('$destroy', function() {
        $timeout.cancel(toastTimer);
    });
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
	$scope.login = '';
	$scope.password = '';
    
	$scope.sendCredentials = function() {
		$http.post('/api/signin', {
			login: $scope.login,
			password: $scope.password
		}).then(function(response) {
            $scope.showToast('Authorization successful');
            $scope.setAuthorized(true);
            $scope.setUser(response.data.name, response.data.token);
            $location.path('/');
		}, function(response) {
            $scope.showError(response.data);            
        });
	};
});

app.controller('signupController', function($scope, $http, $location) {
    $scope.setAuthorized(false);
	$scope.login = '';
	$scope.password = '';
	$scope.passwordRetyped = '';
    
	$scope.sendCredentials = function() {
		if ($scope.password !== $scope.passwordRetyped) {
            $scope.showToast('Passwords do not match');
            return;
        }
        
        $http.post('/api/users', {
            login: $scope.login,
            password: $scope.password
        }).then(function(response) {
            $scope.showToast('Registration successful');
            $location.path('/signin');
        }, function(response) {
            $scope.showError(response.data);
        });
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
			templateUrl: 'views/signup.html',
			controller: 'signupController'
		})
		.otherwise({
			templateUrl: 'views/root.html',
			controller: 'mainController'
		});
		
	$locationProvider.html5Mode(true);
});
