;(function(angular) {
  angular.module('app').controller('AudioController', [
    '$sce',
    '$rootScope',
    '$scope',
    'AudioService',
    'Audio',
    '$window',
    '$timeout',
    function($sce, $rootScope, $scope, AudioService, Audio, $window, $timeout) {
      var controller = this

      var init = false

      controller.onPlayerReady = function(API) {
        $rootScope.player = API
        $rootScope.player.setVolume(0.8)

        $rootScope.$watch('player.isBuffering', function(newVal, oldVal) {
          if (newVal === false && oldVal === true) {
            $rootScope.buffering = false
          }
        })

        if (API.currentState !== 'play') {
          //Force play if autoplay doesn't work
          API.play()
          // API.currentState = 'play';
        }
      }

      $rootScope.files = []
      $rootScope.buffering = true

      $rootScope.$on('video:enter', function() {
        $rootScope.player.pause()
      })

      controller.vgComplete = function() {
        if ($rootScope.playing < $rootScope.files.length) {
          // console.log('end of song, launchinf following...');
          controller.changeTrack($rootScope.playing + 1)
        }
      }

      controller.changeTrack = function(index) {
        // console.log($rootScope.files[index][0])
        // $rootScope.player.pause();
        $rootScope.playing = index

        angular.forEach($rootScope.files, function(file) {
          file[0].playing = false
        })
        controller.config.sources = $rootScope.files[index]
        $rootScope.files[index][0].playing = true

        // $rootScope.player.changeSource();
        $rootScope.player.play()
      }

      function initPlayer(width) {
        // if (width < 1024) return;
        init = true
        AudioService.getFilenames().then(function(response) {
          $rootScope.files = []
          angular.forEach(response.data, function(file) {
            var composer = file.substr(file.indexOf('('))
            var endIndex = composer.indexOf(';')
            var comp = composer.substr(1, --endIndex)
            // console.log(comp)
            var source = [
              {
                name: file,
                src: $sce.trustAsResourceUrl('/audiofiles/' + file),
                type: 'audio/mp3',
                composer: comp,
                playing: false,
                displayName: file.substr(0, file.indexOf('(')),
                // movie: file.substr(file.indexOf(';') + 1, file.indexOf('.')).replace('.mp3', ''),
                fullName: file.substr(0, file.indexOf('.')),
              },
            ]
            $rootScope.files.push(source)
          })
          $rootScope.buffering = false
          $rootScope.playing = 0

          if (!$rootScope.video) {
            $timeout(function() {
              // console.log('start playing');
              $rootScope.files[0][0].playing = true
              $rootScope.player.play()
            })
          } else {
            // console.log('video flag on rootScope');
          }

          controller.config = {
            sources: $rootScope.files[0],

            theme: {
              url: 'bower_components/videogular-themes-default/videogular.min.css',
            },
          }
          // console.log(controller);
        })
      }

      $scope.$watch(
        function() {
          return $window.innerWidth
        },
        function(width) {
          // console.log('width: ' + width);
          // if (width > 1024) {
          $('#leftcol').show()
          if ($rootScope.player) $rootScope.player.play()
          // } else {
          //     $('#leftcol').hide();
          //     if ($rootScope.player)
          //         $rootScope.player.pause();
          // }
          if (!init) {
            initPlayer(width)
          }
        }
      )
    },
  ])
})(angular)
