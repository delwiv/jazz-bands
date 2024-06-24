angular.module('app.services').factory('AudioUploader', [
    'FileUploader',
    'Container',
    '$http',
    '$rootScope',
    'growl',
    'UtilsService',
    function(FileUploader, Container, $http, $rootScope, growl, UtilsService) {
        FileUploader.inherit(AudioUploader, FileUploader);

        var container = {};
        var uploader = {};
        var fileName = '';
        // var currentItem = {};

        function AudioUploader(containerName) {
            // fileName = itemName;
            AudioUploader.super_.apply(this, {});

            uploader = this;

            this.url = '/api/Containers/' + containerName + '/upload';
            this.formData = [{
                key: 'value'
            }];
            this.removeAfterUpload = true;

            Container.getContainer({
                container: containerName
            }, function success(data) {
                container = data;
            }, function err(data) {
                // console.log(data);
                Container.createContainer({
                    'name': containerName
                }, function success(data) {
                    container = data;
                });
            });
        };

        AudioUploader.prototype.onBeforeUploadItem = function(fileItem) {
            // var ext = getExtension(fileItem.file.name);
            // fileItem.file.name = fileName + '.' + ext;
        };

        AudioUploader.prototype.onAfterAddingFile = function(item) {
            // currentItem = item;
            var fileExt = UtilsService.getExtension(item.file.name);

            if (fileExt !== 'mp3') {
                $rootScope.$emit('notMp3File', [item.file.name]);
            }

            $http.get(this.url.replace('upload', 'files/' + item.file.name))
                // success means file exists so here it's a failure :)
                .success(function(data, status) {
                    // console.log(data, status);
                    angular.forEach(uploader.queue, function(fileItem, index) {
                        if (fileItem.file.name === data.name) {
                            $rootScope.$emit('fileExists', [fileItem]);
                        }
                    });

                });
            //error means file doesn't exist so we can upload
        };

        return AudioUploader;
    }
]);
