angular.module('app').config([
  '$stateProvider',
  '$urlRouterProvider',
  '$locationProvider',
  function($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/')
    // $locationProvider.html5Mode(true)

    $stateProvider
      .state('base', {
        views: {
          '@': {
            templateUrl: 'partials/layout.html',
            controller: 'IndexController',
          },
          'footer@': {
            templateUrl: 'partials/footer.html',
          },
        },
        abstract: true,
      })
      .state('index', {
        parent: 'base',
        url: '/',
        views: {
          'body@base': {
            templateUrl: 'partials/body.html',
            controller: 'HomeController',
          },
        },
      })
      .state('musicians', {
        parent: 'base',
        url: '/musicians',
        views: {
          'body@base': {
            templateUrl: 'partials/musicians/body.html',
            controller: 'MusiciansController',
          },
        },
      })
      .state('medias', {
        parent: 'base',
        url: '/medias',
        views: {
          'body@base': {
            controller: 'MediasController',
            templateUrl: 'partials/medias/body.html',
          },
        },
      })
      .state('contact', {
        parent: 'base',
        url: '/contact',
        views: {
          'body@base': {
            templateUrl: 'partials/contact/body.html',
            controller: 'ContactController',
          },
        },
      })
      .state('tour', {
        parent: 'base',
        url: '/tour',
        views: {
          'body@base': {
            controller: 'TourController',
            templateUrl: 'partials/tour/body.html',
          },
        },
      })
  },
])
