angular.module('app')
    .controller('MusiciansController', [
        '$scope',
        '$rootScope',
        '$animate',
        'Musician',
        'Container',
        'ImageUploader',
        'SidebarService',
        'UtilsService',
        'growl',
        function($scope, $rootScope, $animate, Musician, Container, ImageUploader, SidebarService, UtilsService, growl) {

            // INIT

            // $scope.musicians = [];
            $scope.newMusician = {};
            $scope.newMusician.description = '<h1>Description du musicien</h1><br/><p>Description...</p>';
            $scope.addMusicianClicked = false;
            var uploader = $scope.uploader = new ImageUploader('Musicians');

            $scope.$on('loginSuccessful', function() {
                $scope.logged = true;
            });

            $scope.$on('logoutSuccessful', function() {
                $scope.logged = false;
            });

            $scope.$on('fileExists', function(event, array) {
                var file = array[0];
                growl.addErrorMessage('Le fichier ' + file.file.name + ' existe déjà! Choisir un autre fichier.');
                uploader.removeFromQueue(file);
            });

            if ($rootScope.logged) {
                $scope.logged = true;
            }

            var fetchMusicians = function() {
                Musician.find(function(data) {
                    initOptions();
                    $scope.musicians = data;
                    $scope.showArray = [];
                    angular.forEach($scope.musicians, function(musician, index) {
                        SidebarService.addOption({
                            'state': $scope.getMusicianAnchorID(musician),
                            'title': 'Voir la fiche de ' + musician.name,
                            'name': musician.name
                        })
                    })
                });
            };

            var initOptions = function() {
                var options = [{
                    'state': 'newMusician',
                    'title': 'Ajouter un musicien',
                    'name': 'Ajout musicien',
                    'admin': true
                }, {
                    'state': 'editMusicians',
                    'title': 'Modifier les musiciens, ajouter des photos...',
                    'name': 'Modifier musiciens',
                    'admin': true
                }];
                SidebarService.setOptions(options);
            };

            $scope.uploader.onSuccessItem = function(item, response, status, headers) {
                // console.log(item, response);
                var pictures = uploader.musician.pictures;
                if (!pictures) {
                    pictures = [];
                }
                pictures.push({
                    dlPath: UtilsService.getDlPath(item),
                    name: uploader.musician.name
                });
                uploader.musician.pictures = pictures;
                // growl.addInfoMessage('Ajout de ' + pictures[pictures.length - 1].name + ' au musicien ' + uploader.musician.name);
            };

            $scope.uploader.onCompleteAll = function() {
                Musician.upsert(uploader.musician, function(data) {
                    // growl.addInfoMessage('Sauvegarde du musicien ' + uploader.musician.name + ' effectuée :)');
                });
            };

            // $scope.clickAddMusician = function() {
            //     $scope.addMusicianClicked = !$scope.addMusicianClicked;
            // };

            $scope.addMusician = function() {
                Musician.create($scope.newMusician, function(data) {
                    growl.addInfoMessage('Ajout de ' + $scope.newMusician.name + ' effectué :)');
                    fetchMusicians();
                    $scope.newMusician = {};
                    $scope.newMusician.description = '<h1>Description du musicien</h1><br/><p>Description...</p>';
                    $scope.addMusicianClicked = false;
                });
            };

            $scope.saveMusician = function(musician) {
                if (uploader.queue.length > 0) {
                    uploader.musician = musician;
                    uploader.uploadAll();
                }
                Musician.upsert(musician, function(data) {
                    musician = data;
                    growl.addSuccessMessage('Le musicien ' + musician.name + ' a bien été sauvé :)');
                }, function(err) {
                    // console.log(err);
                });
            };

            $scope.deleteMusician = function(index) {
                var musician = $scope.musicians[index];
                if (musician.pictures) {
                    $scope.deletePicture(musician, -1);
                }
                Musician.deleteById({
                    'id': musician.id
                }, function(data) {
                    // console.log(data);
                    $scope.musicians.splice(index, 1);
                });
            };

            $scope.deletePicture = function(musician, index) {
                var pictures = [];
                var counter = 0;
                if (index >= 0) { // delete one picture
                    pictures.push(musician.pictures[index]);
                    musician.pictures.splice(index, 1);
                } else { // delete all (delete musician)
                    pictures = musician.pictures;
                }
                angular.forEach(pictures, function(picture) {
                    Container.removeFile({
                        'container': 'Musicians',
                        'file': UtilsService.getFileName(picture.dlPath)
                    }, function(data) {
                        // growl.addInfoMessage(data);
                        if (index >= 0) {
                            $scope.saveMusician(musician);
                        }
                    }, function(err) {
                        // growl.addErrorMessage(err);
                        if (index >= 0) {
                            $scope.saveMusician(musician);
                        }
                    });
                });
            };

            $scope.showMusician = function(index) {
                $scope.showArray[index] = true;
            };

            $scope.hideMusician = function(index) {
                $scope.showArray[index] = false;
            };

            $scope.getMusicianAnchorID = function(musician) {
                return musician.name.replace(' ', '-');
            };

            // EXECUTION

            fetchMusicians();


        }


    ]);
