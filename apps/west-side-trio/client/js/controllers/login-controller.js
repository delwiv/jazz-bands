angular.module('app')
    .controller('LoginController', ['$scope', '$rootScope', '$timeout', 'LoginService', 'UserBoheme',
        function($scope, $rootScope, $timeout, LoginService, UserBoheme) {
            $scope.logged = false;
            $scope.creds = {};
            $scope.user = {};

            UserBoheme.getCurrent(function success(user) {
                $scope.user = user;
                $scope.logged = true;
                $rootScope.logged = true;
                LoginService.logged = true;
                $timeout(function() {
                    $rootScope.$broadcast('loginSuccessful');
                });
            });

            $scope.login = function() {
                UserBoheme.login($scope.creds,
                    function success(token) {
                        $scope.token = token;
                        UserBoheme.findById({
                            "id": token.userId
                        }, function success(data) {
                            $scope.user = data;
                            $scope.logged = true;
                            LoginService.logged = true;
                            $timeout(function() {
                                $rootScope.$broadcast('loginSuccessful');
                            });
                            $rootScope.logged = true;
                        });
                    });
            };

            $scope.logout = function() {
                var logoutResult = UserBoheme.logout({
                        "access_token": $scope.user.id
                    },
                    function(err) {
                        $scope.logged = false;
                        LoginService.logged = false;
                        $scope.token = {};
                        $scope.user = {};
                        $timeout(function() {
                            $rootScope.$broadcast('logoutSuccessful');
                        });

                        $rootScope.logged = false;
                    }
                );
            };
        }
    ]);
