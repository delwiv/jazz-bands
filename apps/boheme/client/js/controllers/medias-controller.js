angular.module('app')
    .controller('MediasController', [
        'ImageUploader',
        'AudioUploader',
        '$rootScope',
        '$scope',
        'SidebarService',
        'UtilsService',
        // 'AudioService',
        'Media',
        function(ImageUploader, AudioUploader, $rootScope, $scope, SidebarService, UtilsService, /*AudioService,*/ Media) {
            $scope.$on('loginSuccessful', function() {
                $scope.logged = true;
            });

            $scope.$on('logoutSuccessful', function() {
                $scope.logged = false;
            });

            if ($rootScope.logged) {
                $scope.logged = true;
            }
            var medias = $scope.medias = [];
            var pictures = $scope.pictures = [];
            var videos = $scope.videos = [];
            var uploader = $scope.uploader = new ImageUploader('Medias');
            var audioUploader = $scope.audioUploader = new AudioUploader('audiofiles');

            uploader.onSuccessItem = function(item, response, status, headers) {
                // console.log('Success while uploading media!');
                // console.log(item, response);
                var media = {};
                media.path = UtilsService.getDlPath(item);
                media.type = "picture"

                Media.create(media, function(data) {
                    $scope.medias.push(data);
                })
            };

            uploader.onCompleteAll = function() {
                uploader.queue = [];
                fetchMedias();
            };

            audioUploader.onSuccessItem = function(item, response, status, headers) {
                // console.log('Success while uploading audio!');
                // console.log(item, response);
                var audio = {};
                audio.path = UtilsService.getDlPath(item);
                audio.name = item.file.name;

                Audio.create(audio, function(data) {
                    // AudioService.audioFiles.push(data);
                })
            };

            // growl.addInfoMessage('Ajout de ' + pictures[pictures.length - 1].name + ' au musicien ' + uploader.musician.name);
            $scope.medias = [];

            initOptions = function() {
                var options = [{
                    'state': 'editPictures',
                    'title': 'Ajouter/modifier des photos',
                    'name': 'Ajout/modif photos',
                    'admin': true
                }, {
                    'state': 'editVideos',
                    'title': 'Ajouter/modifier des vidéos Youtube, Dailymotion...',
                    'name': 'Ajout/modif vidéos',
                    'admin': true
                }, {
                    'state': 'viewPictures',
                    'title': 'Voir les photos disponibles',
                    'name': 'Photos',
                    'admin': false
                }, {
                    'state': 'viewVideos',
                    'title': 'Voir les vidéos disponibles',
                    'name': 'Vidéos',
                    'admin': false
                }];
                SidebarService.setOptions(options);
            };

            fetchMedias = function() {
                Media.find(function(data) {
                    $scope.medias = data;
                    angular.forEach($scope.medias, function(media) {
                    	if (media.type === 'picture') {
                    		pictures.push(media);
                    	} else if (media.type === 'video') {
                    		videos.push(media);
                    	}
                    });
                });
            };

            // $scope.savePictures = function() {
            //     uploader.uploadAll();
            // }

            // EXECUTION

            initOptions();
            fetchMedias();



        }
    ]);
