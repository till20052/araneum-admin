(function () {
    'use strict';

    angular
        .module('crud.toolbar')
        .factory('ToolBar', ToolBarFactory);

    ToolBarFactory.$inject = ['tf.action'];

    /**
     * ToolBar Factory
     *
     * @returns {Function}
     * @constructor
     */
    function ToolBarFactory(transformer) {
        var $opt;

        return toolbar;

        /**
         * Create ToolBar
         *
         * @param {Object} handler
         * @param {Object} options
         * @returns {jQuery}
         */
        function toolbar(handler, options) {
            $opt = options;
            return $('<div />')
                .append(
                    Object.keys(handler.buttons)
                        .reverse()
                        .map(function (key) {
                            return group(handler.buttons[key]);
                        })
                )
                .find('>*:not(:first-child)')
                .addClass('mr')
                .parent();
        }

        /**
         * Create ToolBar Buttons Group
         *
         * @param {Array} buttons
         * @returns {jQuery}
         */
        function group(buttons) {
            return $('<div class="btn-group pull-right" />')
                .append(
                    buttons.map(function (data) {
                        return action(data);
                    })
                );
        }

        /**
         * Assign Action for ToolBar Button
         *
         * @param {Object} data
         * @returns {jQuery}
         */
        function action(data) {
            var $act = data;
            if ($opt.hasOwnProperty('actTrn'))
                $act = transformer($opt.actTrn).transform($act);
            return button(data)
                .data('$$', $act)
                .click(function () {
                    var toolbar = angular.element(this).scope().toolbar,
                        $$ = $(this).data('$$');
                    toolbar.event($$.name).invoke(toolbar, $$);
                });
        }

        /**
         * Create ToolBar Button
         *
         * @param {Object} data
         * @returns {jQuery}
         */
        function button(data) {
            return $('<button class="btn btn-sm" />')
                .addClass(data.display.btnClass)
                .attr('uib-tooltip', '{{ "' + data.display.label + '" | translate }}')
                .append(
                    $('<em />').addClass(data.display.icon)
                );
        }
    }


})();