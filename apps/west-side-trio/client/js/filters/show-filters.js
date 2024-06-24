(function(angular) {
    'use strict';

    var app = angular.module('app');

    function orderByDate(items, tableType) {
        if (tableType === 'next') {
            items.sort(function(a, b) {
                return parseDate(a.datetime).valueOf() - parseDate(b.datetime).valueOf();
            });
        } else if (tableType === 'previous') {
            items.sort(function(a, b) {
                return parseDate(b.datetime).valueOf() - parseDate(a.datetime).valueOf();
            });
        }
        return items;

    }

    function parseDate(input) {
        if (input) {
            return new Date(input);

        }
        return 'undefined';

    }

    app.filter('nextShows', function() {
        return function(items) {
            var nextShows = [];
            if (items !== undefined && items.length) {


                var today = new Date();


                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (parseDate(item.datetime).valueOf() > today.valueOf()) {
                        nextShows.push(item);
                    }
                }
            }

            return orderByDate(nextShows, 'next');
        };
    });

    app.filter('previousShows', function() {
        return function(items) {
            var previousShows = [];
            if (items !== undefined && items.length) {

                var today = new Date();

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (parseDate(item.datetime).valueOf() < today.valueOf()) {
                        previousShows.push(item);
                    }
                }
            }
            return orderByDate(previousShows, 'previous');
        };
    });

})(angular)
