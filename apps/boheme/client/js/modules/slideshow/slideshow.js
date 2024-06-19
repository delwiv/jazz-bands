angular.module('app.modules.slideshow', [])
    .directive('slideshow', directive);
    // .controller('SlideshowController', controller);

function directive() {
    return {
        restrict: 'E',
        templateUrl: 'js/modules/slideshow/slideshow.html',
        scope: {
            active: '=bind'
        },
        controller: function($scope, $http) {
            $scope.active = 0;
            $http.get('/photos').then(function(response) {
                // // console.log(response.data);
                $scope.slides = response.data.map(function(slide, index) {
                    return {
                        path: '/photos/' + slide,
                        index: index
                    }
                });
            })
        }
    }
}
