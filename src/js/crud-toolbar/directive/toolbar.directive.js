(function () {
    'use strict';

    angular
        .module('crud.toolbar')
        .directive('toolbar', toolbar);

    toolbar.$inject = ['ToolBarHandler', '$compile'];

    function toolbar(ToolBarHandler, $compile) {
        return {
            link: link,
            restrict: 'E',
            scope: {
                manifest: '='
            }
        };

        /**
         * link
         *
         * @param scope
         * @param element
         */
        function link(scope, element) {
            if (!(scope.manifest instanceof Object))
                return;

            return activate();

            /**
             * Activation
             */
            function activate() {
                scope.toolbar = new ToolBarHandler(defineEvents(scope.manifest, [{afterBuild: compile}]));
            }

            /**
             * Define ToolBar Events
             *
             * @param {Object} manifest
             * @param {Array} events
             * @returns {Object}
             * @private
             */
            function defineEvents(manifest, events) {
                if (!manifest.hasOwnProperty('events'))
                    manifest.events = {};

                events.forEach(function (eventMap) {
                    var name = Object.keys(eventMap)[0],
                        event = eventMap[name];

                    if (this.hasOwnProperty(name))
                        return (this[name] = [event, this[name]]);

                    this[name] = event;
                }, manifest.events);

                return manifest;
            }

            /**
             * Compile ToolBar
             *
             * @param {jQuery} toolbar
             * @private
             */
            function compile(toolbar) {
                element.replaceWith($compile(toolbar)(scope));
            }
        }
    }

})();