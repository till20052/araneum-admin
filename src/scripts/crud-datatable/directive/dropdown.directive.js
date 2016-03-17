(function () {
    'use strict';

    angular
        .module('crud.datatable')
        .directive('dropdown', CRUDDropdownDirective);

    CRUDDropdownDirective.$inject = ['$compile', 'tf.action', 'supervisor'];

    /**
     * CRUD DropDown Directive
     *
     * @param $compile
     * @param supervisor
     * @returns {{
     *      link: link,
     *      restrict: string
     * }}
     * @constructor
     */
    function CRUDDropdownDirective($compile, transformer, supervisor) {
        return {
            link: link,
            restrict: 'E',
            scope: false
        };

        /**
         * Directive link
         *
         * @param scope
         * @param element
         */
        function link(scope, element) {
            supervisor
                .loader('config')
                .onLoaded({
                    onSuccess: function (data) {
                        $(element)
                            .parent()
                            .addClass('text-center actions')
                            .html($compile(createDropdown(data.action.row))(scope));
                    }
                });
        }

        /**
         * Create DropDown
         *
         * @param list
         * @returns {*|jQuery}
         */
        function createDropdown(list) {
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0;
                return (c == 'x' ? r : (r&0x3|0x8)).toString(16);
            });
            return $('<div class="btn-group" />')
                .attr({
                    'uib-dropdown': uuid,
                    'dropdown-append-to-body': true
                })
                .append(
                    $('<button class="btn btn-xs btn-default dropdown-toggle" />')
                        .attr({
                            type: 'button',
                            'uib-dropdown-toggle': ''
                        })
                        .append($('<em class="icon-settings" />')),
                    createDropdownMenu(uuid, list)
                );
        }

        /**
         * Create DropDownMenu
         *
         * @param list
         * @returns {*|jQuery}
         */
        function createDropdownMenu(uuid, list) {
            var groups = Object.keys(list);
            return $('<ul class="dropdown-menu-right" />')
                .attr({
                    uuid: uuid,
                    role: 'menu',
                    'uib-dropdown-menu': ''
                })
                .append($.map(list, function (list, groupKey) {
                    var container = [];

                    if (groups.indexOf(groupKey) !== 0)
                        container.push($('<li class="divider" />'));

                    list.forEach(function (options) {
                        container.push($('<li role="menuitem" />')
                            .append(
                                $('<a href="javascript:void(0);" />')
                                    .data('$$', transformer('symfony').transform(options))
                                    .click(function () {
                                        var uuid = $(this).parents('ul[uib-dropdown-menu]').attr('uuid'),
                                            dd = $('div[uib-dropdown="' + uuid + '"]'),
                                            dt = angular.element(dd).scope().dt,
                                            $$ = angular.extend(
                                                {row: $(dd).parents('tr').data('$$')},
                                                $(this).data('$$')
                                            );
                                        dt.event($$.name).invoke(dt, $$);
                                    })
                                    .html('{{ "' + options.display.label + '" | translate }}')
                                    .prepend(
                                        $('<em class="mr" />').addClass(options.display.icon)
                                    )
                            ));
                    });

                    return container;
                }));
        }
    }

})();