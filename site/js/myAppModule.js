var stop = true;
var swiping = false;


var myAppModule = angular.module('myAppModule', ['ngTouch']);
myAppModule.controller('myDemoCtrl', function ($scope, $http) {
  $scope.viewSelect = options.defaultView;
  $scope.options = options;
  $http.get(options.url + 'ListAlbums/' + options.userName + '.json').
    success(function(data, status, headers, config) {
      $scope.albums = data.Success;
      $scope.album = $scope.albums[0];
    }).
    error(function(data, status, headers, config) {
      console.log('Something went wrong with the connection')
    });
    $scope.$watch("album", function(newValue, oldValue) {
      if (newValue != oldValue) {
        $http.get(options.url + 'GetAlbum/' + options.userName + "/" + $scope.album.title + '.json').
          success(function(data, status, headers, config) {
            $scope.openAlbum = data.Success;
            $scope.albumUse = $scope.album;
            $scope.mainpic = $scope.openAlbum[0];
            setTimeout(function() { $('.sectioncontainer').scroll(); },100);
            setTimeout(function() { $('.bottomcontainer').scroll(); },100);
          }).
          error(function(data, status, headers, config) {
            console.log('Something went wrong with the connection')
        });
      }
    });
    $scope.changeTitle = function(album) {
      $scope.album = album;
      $('#rightside').removeClass('hidden'); $('#leftside').addClass('hidden');
    }
    $scope.changePic = function($event,pic) {
      $scope.mainpic = pic;
      if ($scope.viewSelect != 'aagallery') $scope.galleryImg();
    }
    $scope.changeView = function(view) {
      $scope.viewSelect = view;
      setTimeout(function() { $('.sectioncontainer').scroll(); },100);
      setTimeout(function() { $('.bottomcontainer').scroll(); },100);
    }
    $scope.galleryImg = function() {
      stop = false;
      if (!swiping) $('a[data="' + $scope.mainpic.filename + '"]').find('img').click();
      swiping = false;
    }
    $scope.nextBtn = function() {
      var idx = ($scope.openAlbum.indexOf($scope.mainpic) < $scope.openAlbum.length - 1 ? $scope.openAlbum.indexOf($scope.mainpic) + 1 : 0);
      $scope.mainpic = $scope.openAlbum[idx];
    }
    $scope.prevBtn = function() {
      var idx = ($scope.openAlbum.indexOf($scope.mainpic) > 0 ? $scope.openAlbum.indexOf($scope.mainpic) - 1 : $scope.openAlbum.length -1 );
      $scope.mainpic = $scope.openAlbum[idx];
    }
    $scope.swipeL = function() {
        swiping = true;
        $scope.nextBtn();
    }
    $scope.swipeR = function() {
        swiping = true;
        $scope.prevBtn();
    }
  });
