angular.module('app.services').factory('ImageUploader', [
    'FileUploader',
    'Container',
    '$http',
    '$rootScope',
    'growl',
    'UtilsService',
    function(FileUploader, Container, $http, $rootScope, growl, UtilsService) {
        FileUploader.inherit(ImageUploader, FileUploader);

        var container = {};
        var uploader = {};
        var fileName = '';
        // var currentItem = {};

        function ImageUploader(containerName) {
            // fileName = itemName;
            ImageUploader.super_.apply(this, {});

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

        ImageUploader.prototype.onBeforeUploadItem = function(fileItem) {
            // var ext = getExtension(fileItem.file.name);
            // fileItem.file.name = fileName + '.' + ext;
        };

        ImageUploader.prototype.onAfterAddingFile = function(item) {
            // currentItem = item;
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



        return ImageUploader;
    }
]);
