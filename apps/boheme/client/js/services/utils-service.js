angular.module('app.services')
    .factory('UtilsService', [
        function() {
            var service = {};

            service.getDlPath = function(fileItem) {
                var dlPath = fileItem.url.replace('\/upload', '\/download') + '/' + fileItem.file.name;
                // console.log(dlPath);
                return dlPath;
            };

            service.getExtension = function(filename) {
                var parts = filename.split('.');
                return parts[parts.length - 1];
            }

            return service;
        }
    ]);
