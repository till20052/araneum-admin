(function () {
    'use strict';

    angular
        .module('crud')
        .controller('CRUDDialogController', CRUDDialogController);

    CRUDDialogController.$inject = ['$scope', 'transport', 'supervisor', '$filter'];

    function CRUDDialogController($scope, transport, supervisor, $filter) {
        /* jshint -W004, validthis: true */
        var vm = this,
            dt;

        vm.isLoaded = false;
        vm.icon = 'fa fa-file-o';
        vm.title = 'Dialog';
        vm.errors = [];

        vm.form = {
            useFormTransformer: 'symfony',
            actionBar: [
                {$$: 'save', icon: 'fa fa-check', title: 'admin.general.SAVE', class: 'primary'},
                {$$: 'cancel', icon: 'fa fa-minus-circle', title: 'admin.general.CANCEL'}
            ],
            actions: {
                save: function () {
                    var data = {};
                    transport.send({
                        url: this.action,
                        method: this.method,
                        data: Object.keys(this.data()).forEach(function (key) {
                            var value = this.data(key);
                            if(value instanceof Date)
                                value = $filter('date')(value, 'dd/MM/yyyy');
                            data[this.getChildById(key).name] = value;
                        }, this) || data,
                        notify: {
                            skipIf: 'error'
                        }
                    }, function () {
                        dt.refresh();
                        $scope.closeThisDialog();
                    }, function (data) {
                        vm.errors = data.message.split(/\n/);
                    });
                },
                cancel: function () {
                    $scope.closeThisDialog();
                }
            }
        };

        activate();

        /**
         * Controller Activation
         */
        function activate() {
            if (
                !$scope.hasOwnProperty('ngDialogData') || !($scope.ngDialogData instanceof Object)
            )
                throw console.error('[ERROR]: Controller cannot access required initialisation data.');

            var $data = $scope.ngDialogData;

            ['icon', 'title']
                .forEach(function (key) {
                    if (!$data.hasOwnProperty(key))
                        return;
                    vm[key] = $scope.ngDialogData[key];
                });

            if ($data.hasOwnProperty('datatable'))
                activateDataTable($data.datatable);

            if ($data.hasOwnProperty('form'))
                activateForm($data.form);
        }

        /**
         * Form Activation
         *
         * @param {{
         *  source: String
         * }} data
         */
        function activateForm(data) {
            if (!(data instanceof Object) || !data.hasOwnProperty('source'))
                return;

            supervisor
                .loader('form')
                .load(data.source)
                .onLoaded({
                    onSuccess: function (response) {
                        vm.isLoaded = true;
                        vm.form.build(response);
                    }
                });
        }

        /**
         * DataTable Activation
         *
         * @param {Object} data
         */
        function activateDataTable(data) {
            dt = data;
        }
    }

})();