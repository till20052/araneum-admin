(function () {
    'use strict';

    angular
        .module('crud')
        .service('transport', DataTransport);

    DataTransport.$inject = ['$http', 'toaster'];

    /**
     * Data Transport Service
     *
     * @constructor
     */
    function DataTransport($http, toaster) {
        /* jshint validthis: true */
        return angular.extend(this, {
            send: send
        });

        /**
         * Send Data to Server
         *
         * @param {Object|{
         *  data: Object
         *  contentType: String
         *  notify: Boolean|String|Object
         * }} config
         * @param {Function} onSuccess
         * @param {Function} onError
         */
        function send(config, onSuccess, onError) {
            $http(angular.extend(config,
                (function (def) {
                    if (!config.hasOwnProperty('data'))
                        return def;
                    return $.param(config.data);
                })({}),
                (function (def) {
                    if (!config.hasOwnProperty('contentType') || config.contentType !== 'form')
                        return def;
                    return {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    };
                })({})
            )).then(
                function (response) {
                    var data = response.data;

                    if (config.hasOwnProperty('notify'))
                        notify(config.notify, 'success', data);

                    if (typeof onSuccess !== 'function')
                        return;

                    onSuccess(data);
                },
                function (response) {
                    var data = response.data;

                    if (config.hasOwnProperty('notify'))
                        notify(config.notify, 'error', data);

                    if (typeof onError !== 'function')
                        return;

                    onError(response.data);
                }
            );
        }

        /**
         * Notify about transporting data
         *
         * @param ntf
         * @param evn
         * @param rsp
         * @returns {*}
         */
        function notify(ntf, evn, rsp) {
            if (!(ntf instanceof Object)) {
                if (['boolean'].indexOf(typeof ntf) === -1)
                    return;

                if (typeof ntf === 'boolean')
                    ntf = {};
            }

            var evnMap = {
                success: {title: 'Success'},
                error: {title: 'Error'}
            };

            return activate();

            /**
             * Activation
             */
            function activate() {
                if (!ntf.hasOwnProperty('message'))
                    ntf.message = '=';

                if (ntf.hasOwnProperty('skipIf') && ntf.skipIf.constructor !== Array)
                    ntf.skipIf = [ntf.skipIf];

                if (!isAccessible())
                    return;

                toaster.pop(evn, evnMap[evn].title, getMessage(ntf.message));
            }

            /**
             * Check is notify accessible
             *
             * @returns {boolean}
             */
            function isAccessible() {
                return evnMap.hasOwnProperty(evn) && !(ntf.hasOwnProperty('skipIf') && ntf.skipIf.indexOf(evn) !== -1);
            }

            /**
             * Get message
             *
             * @param {String|Object} msg
             * @returns {*}
             */
            function getMessage(msg) {
                if (msg instanceof Object && msg.hasOwnProperty(evn))
                    return getMessage(msg[evn]);
                return rsp[(function (m) {
                    if (m && m[1] !== undefined)
                        return m[1];
                    return 'message';
                })(/=?([A-z0-9-_]+)?/.exec(msg))];
            }
        }
    }

})();