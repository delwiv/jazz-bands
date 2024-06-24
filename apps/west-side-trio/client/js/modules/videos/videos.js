(function(angular) {

    angular.module('app.modules.videos', [
        'app.services'
    ])
        .config(config)
        .controller('VideosController', [
            "$sce",
            '$scope',
            '$rootScope',
            'Video',
            function($sce, $scope, $rootScope, Video) {
                var controller = this;

                $rootScope.video = true;

                $scope.$on('loginSuccessful', function() {
                    $scope.logged = true;
                });

                $scope.updateVideo = function() {
                    Video.upsert(controller.video, function(data) {
                        controller.video = data;
                    });
                };

                $scope.$on('logoutSuccessful', function() {
                    $scope.logged = false;
                });

                if ($rootScope.logged) {
                    $scope.logged = true;
                }

                $rootScope.$on('player:startPlaying', function() {
                    $rootScope.player.pause();
                });

                Video.find(function(data) {
                    controller.video = data[0];

                    $rootScope.$broadcast('video:enter');
                });

            }
        ]);

    function config($stateProvider, $provide) {
        $provide.decorator('taCustomRenderers', ['$delegate', function(taCustomRenderers){
            taCustomRenderers = [
                {
                    selector: 'img',
                    customAttribute:'ta-insert-video',
                    renderLogic: function(element){
                        var iframe = angular.element('<iframe></iframe>');
                        var attributes = element.prop("attributes");
                        // loop through element attributes and apply them on iframe
                        angular.forEach(attributes, function(attr) {
                            iframe.attr(attr.name, attr.value);
                        });
                        iframe.attr('src', iframe.attr('ta-insert-video'));
                        element.wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
                        element.replaceWith(iframe);
                    }
                }
            ]
            return taCustomRenderers;
        }]);
        $stateProvider.state('videos', {
            parent: 'base',
            url: '/videos',
            views: {
                'body@base': {
                    templateUrl: 'js/modules/videos/videos.html',
                    controller: 'VideosController',
                    controllerAs: 'vm'
                }
            }
        });
    }
})(angular);
