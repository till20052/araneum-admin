(function () {
    'use strict';

    angular
        .module('crud.datatable')
        .factory('DataTable', DataTableFactory);

    /**
     * DataTable Factory
     *
     * @returns {table}
     * @constructor
     */
    function DataTableFactory() {
        return table;

        /**
         * Create table
         *
         * @param data
         * @returns {jQuery}
         */
        function table(data) {
            return $('<table class="table-bordered table-striped hover" />')
                .attr({
                    datatable: 'crud',
                    'dt-instance': 'dt.instance',
                    'dt-options': 'dt.options'
                })
                .append(thead(data.columns));
        }

        /**
         * Create table head
         *
         * @param columns
         * @returns {jQuery}
         */
        function thead(columns) {
            return $('<thead />').append(
                $('<tr />').append(
                    $.map(columns, function (column) {
                        return $('<th class="bt0 bl0" />')
                            .html('{{ "' + column + '" | translate }}');
                    }),
                    $('<th class="bt0 bl0" />')
                        .attr({
                            width: 1,
                            'data-sortable': false
                        }),
                    $('<th class="bt0 bl0 p text-center" />')
                        .attr({
                            width: 1,
                            'data-sortable': false
                        })
                        .append($('<checkbox />'))
                )
            );
        }

    }

})();