(function () {
    'use strict';

    angular
        .module('crud')
        .factory('CRUDLoader', CRUDLoader);

    CRUDLoader.$inject = ['$http'];

    /**
     * Interface of CRUD Loader
     *
     * @param $http
     * @returns {Function}
     * @constructor
     */
    function CRUDLoader($http) {
        return function () {
            /* jshint validthis: true,
             eqeqeq: false */

            /** @typedef {Object} */
            var promise;

            return {
                load: load,
                onLoaded: onLoaded,
                clearPromise: clearPromise
            };

            /**
             * Load data by url
             *
             * @param {String} url
             * @return {{
             *     load: Function,
             *     onLoaded: Function,
             *     clearPromise: Function
             * }}
             */
            function load(url) {
                promise = $http({
                    url: url,
                    method: 'GET'
                });
                return this;
            }

            /**
             * Event of data loading
             *
             * @param {{
             *      onSuccess: <Function>,
             *      onError: <Function>
             * }} triggers
             * @returns {Object}
             */
            function onLoaded(triggers) {
                if (
                    triggers instanceof Object &&
                    promise !== undefined
                ) {
                    promise.then.apply(promise, ['onSuccess', 'onError']
                        .map(function (key) {
                            return triggers.hasOwnProperty(key) ?
                                function (r) {
                                    triggers[key](r.data, r.status, r);
                                } : undefined;
                        })
                    );
                }

                return this;
            }

            /**
             * Clear loader promise
             */
            function clearPromise() {
                promise = undefined;
            }
        };
    }

})();