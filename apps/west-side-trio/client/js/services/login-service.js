angular.module('app.services')
    .factory('LoginService', [
        'UserBoheme',
        '$rootScope',
        function(UserBoheme, $rootScope) {
            var loginService = {};
            loginService.logged = false;
            loginService.user = {};
            loginService.token = {};

            return loginService;
        }
    ]);
