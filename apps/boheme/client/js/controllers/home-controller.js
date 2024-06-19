angular.module('app')
.controller('HomeController', [
	'ImageUploader',
	'$rootScope',
	'$scope',
	'Home',
    'SidebarService',
	function(ImageUploader, $rootScope, $scope, Home, SidebarService){
	$scope.home = {};
    SidebarService.wipeOptions();

    $scope.updateHome = function() {
        Home.upsert($scope.home, function(data) {
            $scope.home = data;
        });
    };

    $scope.$on('loginSuccessful', function() {
        $scope.logged = true;
    });

    $scope.$on('logoutSuccessful', function() {
        $scope.logged = false;
    });

    if ($rootScope.logged) {
        $scope.logged = true;
    }

    Home.find(function(data) {
        $scope.home = data[0];
    });
}]);
