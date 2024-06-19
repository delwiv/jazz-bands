angular.module('app.services')
.factory('SidebarService', [
    function(){
    	var service = {};
    	service.options = [];

    	service.setOptions = function(options) {
    		if (options.constructor === Array){
    			service.options = options;
    		}
    	};

    	service.wipeOptions = function() {
			service.options = [];
    	};

    	service.addOption = function(option) {
    		service.options.push(option);
    	};

    	return service;
    }]);
