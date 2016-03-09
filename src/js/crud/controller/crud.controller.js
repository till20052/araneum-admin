(function () {
    'use strict';

    angular
        .module('crud')
        .controller('CRUDController', CRUDController);

    CRUDController.$inject = ['$scope', '$state', 'transport', 'supervisor', 'ngDialog', 'SweetAlert', '$filter'];

    /**
     * CRUD Controller
     *
     * @constructor
     */
    function CRUDController($scope, $state, transport, supervisor, Dialog, SweetAlert, $filter) {
        /* jshint validthis: true */
        var vm = this,
            translate = $filter('translate');

        $scope.icon = $state.$current.crud.icon;
        $scope.title = $state.$current.crud.title;

        vm.filter = filter();
        vm.toolbar = toolbar();
        vm.datatable = datatable();

        $scope.$on('panel-refresh',
            /**
             * Refresh filters
             *
             * @param {Object} event
             * @param {String} id
             */
            function (event, id) {
                console.log(event, id);
                $scope.$broadcast('removeSpinner', id);
                if (id !== 'filter')
                    return;
                vm.filter.actions.reset.call(vm.filter);
            }
        );

        activate();

        /**
         * Activation
         */
        function activate() {
            supervisor
                .loader('config')
                .load($state.$current.initialize)
                .onLoaded({
                    onSuccess: function (response) {
                        // set filter.form data
                        vm.filter.build(response.filter);
                        // set toolbar data
                        vm.toolbar.build(response.action.top);
                        // set datatable data
                        vm.datatable.build(response.grid);
                    }
                });
        }

        /**
         * Get filter manifest
         *
         * @returns {*}
         */
        function filter() {
            return {
                useFormTransformer: 'symfony',
                layout: 'grid',
                actionBar: [
                    {$$: 'search', icon: 'fa fa-search', title: 'admin.general.SEARCH', class: 'primary'},
                    {$$: 'reset', icon: 'fa fa-refresh', title: 'admin.general.RESET'}
                ],
                actions: {
                    search: search,
                    reset: reset
                }
            };

            function search() {
                var $this = this,
                    data = {};
                vm.datatable.filter(Object.keys(this.data()).forEach(function (key) {
                    this[$this.name + '[' + key + ']'] = $this.data(key);
                }, data) || data);
            }

            function reset() {
                this.data({});
                vm.datatable.reset();
            }
        }

        /**
         * Get ToolBar manifest
         *
         * @returns {{
         *  useActionTransformer: String
         *  actions: {
         *      create: create,
         *      setState: setState,
         *      remove: remove
         *  }
         * }}
         */
        function toolbar() {
            return {
                useActionTransformer: 'symfony',
                actions: {
                    create: create,
                    setState: setState,
                    remove: remove
                }
            };

            /**
             * Create row
             *
             * @param data
             */
            function create(data) {
                Dialog.open({
                    template: 'crud/dialog.html',
                    controller: 'CRUDDialogController',
                    controllerAs: 'vm',
                    data: {
                        icon: data.view.icon,
                        title: data.view.label,
                        datatable: vm.datatable,
                        form: {
                            source: data.form.source
                        }
                    }
                });
            }
        }

        /**
         * Create DataTable manifest
         *
         * @returns {{
         *  actions: {
         *      update: update,
         *      setState: setState,
         *      remove: remove
         *  }
         * }}
         */
        function datatable() {
            return {
                events: {
                    onRenderRows: refreshToolBar,
                    onSelectRow: refreshToolBar
                },
                actions: {
                    update: update,
                    setState: setState,
                    remove: remove
                }
            };

            /**
             * Refresh ToolBar
             */
            function refreshToolBar() {
                vm.toolbar.refreshButtonsAccessibility(this.getSelectedRows().length > 0);
            }

            /**
             * Edit row data
             *
             * @param data
             */
            function update(data) {
                Dialog.open({
                    template: 'crud/dialog.html',
                    controller: 'CRUDDialogController',
                    controllerAs: 'vm',
                    data: {
                        icon: data.view.icon,
                        title: data.view.label,
                        datatable: vm.datatable,
                        form: {
                            source: data.form.source + '/' + data.row.id
                        }
                    }
                });
            }
        }

        /**
         * Set row enable|disable state
         *
         * @param data
         */
        function setState(data) {
            var idx = [];

            if (data.hasOwnProperty('row'))
                idx.push(data.row.id);

            if (idx.length !== 1)
                idx = vm.datatable.getSelectedRows()
                    .map(function (row) {
                        return $(row).data('$$').id;
                    });

            transport.send({
                url: data.source,
                method: 'POST',
                data: {
                    data: idx
                },
                notify: true
            }, function () {
                vm.datatable.refresh();
            });
        }

        /**
         * Remove row
         *
         * @param {{
         *  row: Object,
         *  confirm: {
         *      title: String,
         *      actions: {
         *          confirm: String
         *      },
         *      buttons: {
         *          confirm: String,
         *          cancel: String
         *      }
         *  }
         * }} data
         */
        function remove(data) {
            var idx = [];

            if (data.hasOwnProperty('row'))
                idx.push(data.row.id);

            if (idx.length !== 1)
                idx = vm.datatable.getSelectedRows()
                    .map(function (row) {
                        return $(row).data('$$').id;
                    });

            SweetAlert.swal({
                title: translate(data.confirm.title),
                type: 'warning',
                showCancelButton: true,
                cancelButtonText: translate(data.confirm.buttons.cancel),
                confirmButtonText: translate(data.confirm.buttons.confirm),
                confirmButtonColor: '#dd6b55'
            }, function (confirmed) {
                if (!confirmed)
                    return;
                transport.send({
                    url: data.source,
                    method: 'POST',
                    data: {
                        data: idx
                    },
                    notify: true
                }, function () {
                    vm.datatable.refresh();
                });
            });
        }
    }

})();