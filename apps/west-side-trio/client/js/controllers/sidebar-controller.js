angular.module('app')
    .controller('SidebarController', [
    	'SidebarService',
    	'$scope',
    	function(SidebarService, $scope) {
    		$scope.$watch(function() {
    			return SidebarService.options;
    		}, function(data) {
    			$scope.options = data;
    		}, true);
    	}
	]);
