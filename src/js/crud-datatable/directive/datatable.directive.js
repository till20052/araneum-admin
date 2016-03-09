(function () {
    'use strict';

    angular
        .module('crud.datatable')
        .directive('crudDatatable', CRUDDataTableDirective);

    CRUDDataTableDirective.$inject = ['DTHandler', 'DTOptionsBuilder', '$compile', '$state'];

    /**
     * CRUD DataTable Directive
     *
     * @returns {Object}
     * @constructor
     */
    function CRUDDataTableDirective(DTHandler, DTOptionsBuilder, $compile, $state) {

        return {
            link: link,
            restrict: 'E',
            scope: {
                manifest: '='
            }
        };

        /**
         * directive link
         */
        function link(scope, element) {
            if (!(scope.manifest instanceof Object))
                return;

            return activate();

            /**
             * Activation
             */
            function activate() {
                scope.dt = new DTHandler(defineEvents(scope.manifest, [{afterBuild: compile}]), {
                    compile: function (element) {
                        $compile(element)(scope);
                    }
                });
            }

            /**
             * Define DataTable Events
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
             * Compile DataTable
             *
             * @param {jQuery} datatable
             * @private
             */
            function compile(datatable) {
                element.replaceWith($compile(datatable)(scope));
            }
        }
    }

})();