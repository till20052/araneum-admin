(function () {
    'use strict';

    angular
        .module('crud.toolbar')
        .factory('ToolBarHandler', ToolBarHandlerFactory);

    ToolBarHandlerFactory.$inject = ['ToolBar', 'EventsHandler'];

    /**
     * ToolBar Handler Factory
     *
     * @param ToolBar
     * @param EventsHandler
     * @returns {ToolBarHandler}
     * @constructor
     */
    function ToolBarHandlerFactory(ToolBar, EventsHandler) {
        return ToolBarHandler;

        /**
         * ToolBar Handler
         *
         * @param {Object} manifest
         * @returns {{
         *  buttons: Object,
         *  build: build
         * }}
         * @constructor
         */
        function ToolBarHandler(manifest) {
            /* jshint validthis: true */
            var $options = {},
                $element,
                $this = angular.extend(this, {
                    buttons: {},
                    refreshButtonsAccessibility: refreshButtonsAccessibility,
                    build: build
                });

            return activate();

            /**
             * Activation
             *
             * @returns {*}
             */
            function activate() {
                if (manifest.hasOwnProperty('events') && manifest.events instanceof Object) {
                    if (manifest.hasOwnProperty('actions') && manifest.actions instanceof Object)
                        angular.extend(manifest.events, manifest.actions);

                    angular.extend($this, new EventsHandler(manifest.events));
                }

                if (manifest.hasOwnProperty('useActionTransformer'))
                    $options.actTrn = manifest.useActionTransformer;

                Object.keys($this)
                    .forEach(function (key) {
                        if(key === 'event' || typeof this[key] !== 'function')
                            return;
                        manifest[key] = this[key];
                    }, $this);

                return $this;
            }

            /**
             * Refresh buttons accessibility
             *
             * @param state
             */
            function refreshButtonsAccessibility(state) {
                $('button', $element).filter(function(){
                    return $(this).data('$$').name !== 'create';
                }).prop('disabled', !state);
            }

            /**
             * Build toolbar
             *
             * @param data
             */
            function build(data) {
                delete manifest.build;
                (angular.extend($this, {buttons: data}))
                    .event('afterBuild')
                    .invoke(undefined, ($element = new ToolBar($this, $options)));
            }
        }
    }

})();