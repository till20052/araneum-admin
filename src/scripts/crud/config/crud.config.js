(function () {
    'use strict';

    angular
        .module('crud')
        .config(['$httpProvider', function ($httpProvider) {

            $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        }]);

})();