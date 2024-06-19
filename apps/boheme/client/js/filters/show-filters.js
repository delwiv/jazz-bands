(function(angular, moment) {
    'use strict';

    var app = angular.module('app');

    function orderByDate(items, tableType) {
        if (tableType === 'next') {
            items.sort(function(a, b) {
                return moment(new Date(a.datetime)).isAfter(moment(new Date(b.datetime))) ? 1 : -1;
            });
        } else if (tableType === 'previous') {
            items.sort(function(a, b) {
                return moment(new Date(a.datetime)).isBefore(moment(new Date(b.datetime))) ? 1 : -1;
            });
        }
        return items;

    }

    app.filter('nextShows', function() {
        return function(items) {
            if (items && items.length) {
                var today = moment().subtract(6, 'hours');
                return orderByDate(items.filter(function(item) {
                    return moment(new Date(item.datetime)).isAfter(today);
                }), 'next');
            }
        };
    });

    app.filter('previousShows', function() {
        return function(items) {
            var previousShows = [];
            if (items && items.length) {
                var today = moment().add(6, 'hours');
                return orderByDate(items.filter(function(item) {
                    return moment(new Date(item.datetime)).isBefore(today);
                }), 'previous');
            }
        };
    });

})(angular, moment)
