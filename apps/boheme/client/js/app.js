'use strict';

angular.module('app', [
    'ngRoute',
    'ui.router',
    'ui.bootstrap',
    'ngResource',
    'ngSanitize',
    "com.2fdevs.videogular",
    "com.2fdevs.videogular.plugins.controls",
    'ngAnimate',
    'lbServices',
    'duScroll',
    'textAngular',
    'angular-growl',
    'app.services',
    'app.modules'
]);
angular.module('app.services', ['lbServices', 'angularFileUpload']);
angular.module('app').controller('IndexController', function() {});
