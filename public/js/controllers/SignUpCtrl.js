var SignUpCtrl = angular.module('SignUpCtrl', []).controller('SignUpController',['$scope', '$rootScope',
 '$location', '$timeout', 'GetPost', 'Helper', '$window', function($scope, $rootScope,  
 	$location, $timeout, GetPost, Helper, $window) {

	SignUpCtrl.directive('ngCompare', function () {
		return {
			require: 'ngModel',
			link: function (scope, currentEl, attrs, ctrl) {
				var comparefield = document.getElementsByName(attrs.ngCompare)[0]; //getting first element
				compareEl = angular.element(comparefield);
				
				//current field key up
				currentEl.on('keyup', function () {
					if (compareEl.val() != "") {
						var isMatch = currentEl.val() === compareEl.val();
						ctrl.$setValidity('compare', isMatch);
						scope.$digest();
					}
				});
				
				//Element to compare field key up
				compareEl.on('keyup', function () {
					if (currentEl.val() != "") {
						var isMatch = currentEl.val() === compareEl.val();
						ctrl.$setValidity('compare', isMatch);
						scope.$digest();
					}
				});
			}
		}
	});

	GetPost.get({ url : '/startApp' }, function(err, resp) {
		if (resp.status) {
			$window.location.href = '/signup';
		}
	});
	
	Helper.checkForMessage();
	$scope.signup = function() {
		var data  = {input : $scope.input, url : '/signup'};
		GetPost.post(data, function(err, resp) {
			if (!err) {
				$rootScope.isMainLoader = true;
				Helper.createToast(resp.message, 'success');
				$timeout(() => {
					$location.path('/login');
				}, 3000);
			} else if (err && !resp.status) {
				Helper.createToast(resp.error.message, 'warning');
			} else {
				Helper.showAlert('error500');
			}
			$scope.input = {};
			$scope.userForm.$setUntouched();
	    });
	}

}]);