(function () {
    'use strict';

    angular
        .module('crud.form')
        .directive('form', directive);

    directive.$inject = ['FormHandler', '$compile'];

    /**
     * Form directive
     *
     * @param FormHandler
     * @param $compile
     * @returns {{link: link, restrict: string, scope: {manifest: string}}}
     */
    function directive(FormHandler, $compile) {
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
                scope.form = new FormHandler(defineEvents(scope.manifest, [{afterBuild: compile}]));
            }

            /**
             * Define Form Events
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
             * Compile Form
             *
             * @param {jQuery} form
             */
            function compile(form) {
                element.replaceWith($compile(form)(scope));
                var ngDialogContend = $(form).parents('div.ngdialog-content');
                if(ngDialogContend.length !== 1)
                    return;
                ngDialogContend.width(700);
            }
        }
    }

})();