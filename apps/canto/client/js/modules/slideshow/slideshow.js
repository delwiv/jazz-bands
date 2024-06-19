angular.module('app.modules.slideshow', [])
    .directive('slideshow', directive);
    // .controller('SlideshowController', controller);

function directive() {
    return {
        restrict: 'E',
        templateUrl: 'js/modules/slideshow/slideshow.html',
        controller: function($scope, $http) {
            $http.get('/photos').then(function(response) {
                // console.log(response.data);
                $scope.slides = response.data;
            })
        }
    }
}
