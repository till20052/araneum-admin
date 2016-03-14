(function () {
    'use strict';

    angular
        .module('crud.datatable')
        .factory('DTHandler', DTHandlerFactory);

    DTHandlerFactory.$inject = ['DataTable', 'EventsHandler', 'DTOptionsBuilder', 'TranslateDatatablesService', '$state'];

    /**
     *
     * @returns {DTHandler}
     * @constructor
     */
    function DTHandlerFactory(DataTable, EventsHandler, DTOptionsBuilder, translate, $state) {
        return DTHandler;

        /**
         * DataTable Handler
         *
         * @param {Object} manifest
         * @param {{
         *  compile: Function
         * }} external
         * @returns {*}
         * @constructor
         */
        function DTHandler(manifest, external) {
            var $this = angular.extend(this, external, {
                instance: {},
                columns: [],
                source: '',
                options: {},
                selectRow: selectRow,
                getSelectedRows: getSelectedRows,
                draw: draw,
                filter: filter,
                refresh: refresh,
                reset: reset,
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

                $this.options = DTOptionsBuilder.newOptions()
                    .withOption('order', [[1, 'asc']])
                    .withOption('processing', true)
                    .withOption('serverSide', true)
                    .withOption('fnServerData', fnServerData)
                    .withOption('language', translate.translateTable())
                    .withPaginationType('full_numbers');

                Object.keys($this)
                    .forEach(function (key) {
                        if (key === 'event' || typeof this[key] !== 'function')
                            return;
                        manifest[key] = this[key];
                    }, $this);

                return $this;

                /**
                 * Get data for datatable from server
                 *
                 * @param {String} source
                 * @param {Array} data
                 * @param {Function} callback
                 * @param {Object} settings
                 * @private
                 */
                function fnServerData(source, data, callback, settings) {

                    (function (s) {
                        if ($('div.dataTables_ovCase', s.nTable).length > 0)
                            return;

                        var table = $(s.nTable),
                            div = $('<div class="dataTables_ovCase" />');

                        div.insertAfter(table)
                            .append(table)
                            .scroll(function () {
                                $('> tr > td.actions', s.nTBody).css({
                                    marginRight: (0 - $(this).scrollLeft()) + 'px'
                                });
                            });

                        $(window).resize(function () {
                            console.log($(div).width(), $(table).width(), div.scrollLeft());

                            if(table.width() - div.width() <= div.scrollLeft() - 1){
                                div.scrollLeft(table.width() - div.width());
                            }

                            $('> tr > td.actions', s.nTBody).each(function () {
                                $(this).css({
                                    padding: (($(this).parent().height() - $('> div', this).height()) / 2 - 1) + 'px 10px'
                                });
                            })
                        });

                    })(settings);

                    if ($this.instance.hasOwnProperty('drawAttrs')) {
                        var attrs = $this.instance.drawAttrs;

                        if (
                            attrs.hasOwnProperty('filter') &&
                            typeof attrs.filter === 'string' &&
                            attrs.filter.length > 0
                        )
                            source += '?' + attrs.filter;

                        if (attrs.hasOwnProperty('state')) {
                            settings._iDisplayStart = attrs.state.start;
                            data = data.map(function (item) {
                                if (item.name === 'iDisplayStart')
                                    item.value = attrs.state.start;
                                return item;
                            });
                            delete attrs.state;
                        }
                    }

                    settings.jqXHR = $.ajax({
                        dataType: 'json',
                        type: 'POST',
                        url: source,
                        data: data,
                        success: function (data) {
                            callback(angular.extend(data, {
                                aaData: $.map(data.aaData, function (data) {
                                    var row = {DT_RowId: data[0]};
                                    return ['<checkbox />'].concat(data.splice(0, data.length - 1).concat(['<dropdown />']))
                                            .forEach(function (value, i) {
                                                this[i] = value
                                            }, row) || row;
                                })
                            }));
                            $('input[type="checkbox"]', settings.nTable).prop('checked', false);
                            $this.compile(
                                $('> tbody > tr', settings.nTable)
                                    .each(function () {
                                        $(this).data('$$', {
                                            id: parseInt($(this).attr('id')),
                                            selected: false
                                        });
                                    })
                                    .find('> td > *')
                                    .filter(function () {
                                        return /^(dropdown|checkbox)$/ig.test($(this).prop('tagName'));
                                    })
                            );
                            $this.event('onRenderRows').invoke($this);
                            $(window).resize();
                        },
                        error: function (response) {
                            if (response.status !== 401)
                                return;
                            $state.go('login');
                        }
                    });
                }
            }

            /**
             * Draw DataTable
             *
             * @param {{
             *  holdState: Boolean=
             *  filter: Object=
             * }} options
             * @returns {*}
             */
            function draw(options) {
                var dt = $this.instance.DataTable,
                    drawAttrs = $this.instance.drawAttrs = {};

                if (options instanceof Object) {
                    ['filter', 'holdState'].forEach(function (key) {
                        if (!options.hasOwnProperty(key))
                            return;
                        angular.extend(drawAttrs, ({
                            filter: filter,
                            holdState: holdState
                        })[key](options[key]));
                    });
                }

                return dt.draw();

                /**
                 * Convert filter data to params
                 *
                 * @param data
                 */
                function filter(data) {
                    if (data.constructor !== Object)
                        return;
                    return {
                        filter: $.param(data)
                    };
                }

                /**
                 * Get DataTable page info if is set holdState attr
                 *
                 * @param value
                 */
                function holdState(value) {
                    if (value !== true)
                        return;
                    var $this = {state: {}};
                    return Object.keys(dt.page.info())
                            .forEach(function (key) {
                                this[key] = dt.page.info()[key];
                            }, $this.state) || $this;
                }
            }

            /**
             * Draw DataTable with filtering
             *
             * @param {Object} data
             */
            function filter(data) {
                $this.draw({
                    filter: data
                });
            }

            /**
             * Refresh DataTable
             */
            function refresh() {
                $this.draw(angular.extend({
                    holdState: true
                }, $this.instance.drawAttrs));
            }

            /**
             * Reset DataTable
             */
            function reset() {
                $this.draw({});
            }

            /**
             * Select row
             *
             * @param {jQuery} row
             * @param {Boolean} state
             */
            function selectRow(row, state) {
                if (!($(row).data('$$') instanceof Object))
                    throw console.error('[ERROR]: Cannot set row selection state', row);
                row.data('$$').selected = !!state;
                $this.event('onSelectRow').invoke($this);
            }

            /**
             * Get Selected Rows
             *
             * @returns {Array<jQuery>}
             */
            function getSelectedRows() {
                return $('> tbody > tr', $this.instance.dataTable).filter(function () {
                    return $(this).data('$$').selected;
                }).toArray();
            }

            /**
             * Build DataTable
             *
             * @param data
             */
            function build(data) {
                delete manifest.build;
                (angular.extend($this, data))
                    .event('afterBuild')
                    .invoke(null, new DataTable($this));
                $this.options.sAjaxSource = data.source;
            }
        }

    }

})();