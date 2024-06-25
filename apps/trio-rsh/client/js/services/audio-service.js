angular.module('app.services')
    .factory('AudioService', [
        '$http',
        function($http) {
            var service = {};

            service.audioFiles = [];

            service.getFilenames = function() {
                return $http.get('/audiofiles');
            }

            service.getVideos = function() {
                return $http.get('/videofiles');
            }


            service.getImg = function() {
                return $http.get('/img');
            }

            return service;
        }
    ]);
