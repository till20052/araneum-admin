(function () {
    'use strict';

    angular
        .module('crud.datatable')
        .directive('checkbox', directive);

    directive.$inject = ['$compile'];

    /**
     * CheckBox Directive
     *
     * @param $compile
     * @returns {{
     *      link: link,
     *      restrict: string
     * }}
     * @constructor
     */
    function directive($compile) {
        return {
            link: link,
            restrict: 'E',
            scope: false
        };

        /**
         * link
         *
         * @param scope
         * @param element
         */
        function link(scope, element) {
            $(element).parent()
                .addClass('text-center')
                .html($compile(checkbox())(scope));

            /**
             * Create checkbox
             *
             * @returns {jQuery}
             */
            function checkbox() {
                return $('<div class="checkbox c-checkbox mr0" />').append(
                    $('<label />').append($('<input type="checkbox" />').change(change))
                        .append($('<span class="fa fa-check mr0" />'))
                );
            }

            /**
             * Event of checkbox state changing
             */
            function change() {
                /* jshint validthis: true */
                var checked = $(this).prop('checked'),
                    selector = 'input[type="checkbox"]';

                (function (thead) {
                    if (!thead.length)
                        return;
                    thead.next()
                        .find(selector)
                        .prop('checked', checked)
                        .change();
                })($(this).parents('thead'));

                (function (tbody) {
                    if (!tbody.length)
                        return;
                    scope.dt.selectRow(this.parents('tr'), checked);
                    checked = $(selector, tbody).toArray()
                        .every(function (checkbox) {
                            return !!$(checkbox).prop('checked');
                        });
                    $(selector, tbody.prev()).prop('checked', checked);
                }).call($(this), $(this).parents('tbody'));
            }
        }
    }

})();