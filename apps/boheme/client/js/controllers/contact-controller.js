angular.module('app')
    .controller('ContactController', [
        '$scope',
        'SidebarService',
        function($scope, SidebarService) {
            SidebarService.wipeOptions();
        }
    ]);
