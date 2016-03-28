(function(){
    'use strict';

    angular
        .module('crud', [
            'ngDialog',
            'crud.form',
            'crud.toolbar',
            'crud.datatable'
        ]);

})();
(function(){
    'use strict';

    angular
        .module('crud.datatable', []);

})();
(function(){
    'use strict';

    angular
        .module('crud.toolbar', []);

})();
(function(){
    'use strict';

    angular
        .module('crud.form', []);

})();
(function () {
    'use strict';

    angular
        .module('crud')
        .config(['$httpProvider', function ($httpProvider) {

            $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        }]);

})();
(function () {
    'use strict';

    angular
        .module('crud')
        .factory('EventsHandler', EventsHandlerFactory);

    /**
     * Events Handler Factory
     *
     * @returns {EventsHandler}
     * @constructor
     */
    function EventsHandlerFactory() {
        Events.prototype = Object.create(Array.prototype);
        return EventsHandler;
    }

    /**
     * Events Handler
     *
     * @param {Object<String, Function|Array<Function>>} events
     * @returns {{event: get}}
     * @constructor
     */
    function EventsHandler(events) {
        var $events,
            $this = angular.extend(this, {
                event: get
            });

        activate();

        return $this;

        /**
         * Events Handler Activation
         */
        function activate() {
            $events = {};
            Object.keys(events)
                .forEach(function (name) {
                    if (!(events[name] instanceof Array))
                        events[name] = [events[name]];
                    events[name].forEach(function (event) {
                        set(name, event);
                    });
                });
        }

        /**
         * Get array of events by name
         *
         * @param {String} name
         * @returns {Events|undefined}
         * @public
         */
        function get(name) {
            if (!$events.hasOwnProperty(name))
                $events[name] = new Events();
            return $events[name];
        }

        /**
         * Append event to array of events by name
         *
         * @param {String} name
         * @param {Function} event
         * @returns {EventsHandler}
         * @private
         */
        function set(name, event) {
            if (!$events.hasOwnProperty(name))
                $events[name] = new Events();
            $events[name].push(event);
            return $this;
        }
    }

    /**
     * Events
     *
     * @returns {{
     *  invoke: invoke
     * }}
     * @constructor
     */
    function Events() {
        /* jshint validthis: true */
        var $this = angular.extend(this, {
            invoke: invoke
        });

        return $this;

        /**
         * Invoke each event which was registered in this array of events
         *
         * @param {Object} [thisArg]
         * @param {...*} [args]
         */
        function invoke(thisArg, args) {
            args = arguments;
            $this.forEach(
                function (event) {
                    event.apply(thisArg, this);
                },
                Object.keys(args)
                    .filter(function (i) {
                        return thisArg !== args[i];
                    })
                    .map(function (i) {
                        return args[i];
                    })
            );
        }
    }

})();
(function () {
    'use strict';

    angular
        .module('crud')
        .factory('CRUDLoader', CRUDLoader);

    CRUDLoader.$inject = ['$http'];

    /**
     * Interface of CRUD Loader
     *
     * @param $http
     * @returns {Function}
     * @constructor
     */
    function CRUDLoader($http) {
        return function () {
            /* jshint validthis: true,
             eqeqeq: false */

            /** @typedef {Object} */
            var promise;

            return {
                load: load,
                onLoaded: onLoaded,
                clearPromise: clearPromise
            };

            /**
             * Load data by url
             *
             * @param {String} url
             * @return {{
             *     load: Function,
             *     onLoaded: Function,
             *     clearPromise: Function
             * }}
             */
            function load(url) {
                promise = $http({
                    url: url,
                    method: 'GET'
                });
                return this;
            }

            /**
             * Event of data loading
             *
             * @param {{
             *      onSuccess: <Function>,
             *      onError: <Function>
             * }} triggers
             * @returns {Object}
             */
            function onLoaded(triggers) {
                if (
                    triggers instanceof Object &&
                    promise !== undefined
                ) {
                    promise.then.apply(promise, ['onSuccess', 'onError']
                        .map(function (key) {
                            return triggers.hasOwnProperty(key) ?
                                function (r) {
                                    triggers[key](r.data, r.status, r);
                                } : undefined;
                        })
                    );
                }

                return this;
            }

            /**
             * Clear loader promise
             */
            function clearPromise() {
                promise = undefined;
            }
        };
    }

})();
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
                !$scope.$parent.hasOwnProperty('ngDialogData') || !($scope.$parent.ngDialogData instanceof Object)
            )
                throw console.error('[ERROR]: Controller cannot access required initialisation data.');

            var $data = $scope.$parent.ngDialogData;

            ['icon', 'title']
                .forEach(function (key) {
                    if (!$data.hasOwnProperty(key))
                        return;
                    vm[key] = $data[key];
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
(function () {
    'use strict';

    angular
        .module('crud')
        .service('tf.action', transformer);

    /**
     * Action Transformer Service
     *
     * @returns {Function}
     */
    function transformer() {
        var transformers = {
            symfony: new SymfonyActionTransformer()
        };

        return function (name) {
            return transformers[name];
        };

        /**
         * Symfony Action Transformer
         *
         * @returns {*}
         * @constructor
         */
        function SymfonyActionTransformer() {
            var $helper,
                $this = angular.extend(this, {
                    transform: transform
                });

            return activate();

            /**
             * Activation
             *
             * @returns {*}
             */
            function activate() {
                $helper = helper();
                return $this;
            }

            /**
             * Get Transformer Helper
             *
             * @returns {{
             *  name: getName,
             *  confirm: getConfirm,
             *  form: getForm,
             *  source: getSource
             * }}
             */
            function helper() {
                return {
                    name: getName,
                    confirm: getConfirm,
                    form: getForm,
                    view: getView,
                    source: getSource
                };

                function getName(data) {
                    var fnMap = {
                        editRow: 'setState',
                        deleteRow: 'remove'
                    };

                    if (fnMap.hasOwnProperty(data.callback))
                        return fnMap[data.callback];

                    return data.callback;
                }

                /**
                 * Get confirm
                 *
                 * @param {{
                 *  resource: String
                 *  confirm: {
                 *      title: String,
                 *      yes: Object,
                 *      no: Object
                 *  }
                 * }} data
                 * @returns {undefined|{
                 *  title: String,
                 *  buttons: {
                 *      confirm: String,
                 *      cancel: String
                 *  }
                 * }}
                 */
                function getConfirm(data) {
                    if (!data.hasOwnProperty('confirm'))
                        return;
                    return {
                        title: data.confirm.title,
                        buttons: {
                            confirm: data.confirm.yes.title,
                            cancel: data.confirm.no.title
                        }
                    };
                }

                function getForm(data) {
                    if (!data.hasOwnProperty('form'))
                        return;
                    return {
                        source: data.form
                    };
                }

                function getSource(data) {
                    if (!data.hasOwnProperty('resource'))
                        return;
                    return data.resource;
                }

                function getView(data) {
                    if (!data.hasOwnProperty('display'))
                        return;
                    return data.display;
                }
            }

            /**
             * Transform data
             *
             * @param {Object} data
             * @returns {Object}
             */
            function transform(data) {
                return (function () {
                    var $this = this;
                    return Object
                            .keys(arguments)
                            .forEach(function (i) {
                                if (this[i][Object.keys(this[i])[0]] === undefined)
                                    return;
                                angular.extend($this, this[i]);
                            }, arguments) || $this;
                }).apply({
                    name: $helper.name(data)
                }, [
                    {confirm: $helper.confirm(data)},
                    {form: $helper.form(data)},
                    {source: $helper.source(data)},
                    {view: $helper.view(data)}
                ]);
            }
        }
    }

})();
(function () {
    /* jshint validthis: true */
    'use strict';

    angular
        .module('crud')
        .service('supervisor', Supervisor);

    Supervisor.$inject = ['CRUDLoader'];

    /**
     *
     * @param CRUDLoader
     * @returns {{
     *      loader: loader
     * }}
     * @constructor
     */
    function Supervisor(CRUDLoader) {
        var register = new Register();

        return {
            loader: loader
        };

        /**
         * Set|Get sub-register in|from register
         *
         * @param id
         * @returns {*}
         */
        function subRegister(id) {
            if (register.get(id) === undefined)
                register.set(id, new Register());

            return register.get(id);
        }

        /**
         * Set|Get loader by id
         *
         * @param {String} id
         * @returns {CRUDLoader}
         */
        function loader(id) {
            if (subRegister('loader').get(id) === undefined)
                subRegister('loader').set(id, new CRUDLoader());

            return subRegister('loader').get(id);
        }
    }

    /**
     * CRUD Supervisor Register
     *
     * @returns {{
     *      set: set,
     *      get: get
     * }}
     * @constructor
     */
    function Register() {
        var $ = {},
            srv = {
                set: set,
                get: get
            };

        return srv;

        /**
         * Set value into container of register
         *
         * @param id
         * @param value
         * @returns {{
         *      set: set,
         *      get: get
         * }}
         */
        function set(id, value) {
            $[id] = value;
            return srv;
        }

        /**
         * Get value from container of register
         *
         * @param {Number|String} id
         * @returns {*}
         */
        function get(id) {
            return $[id];
        }
    }

})();
(function () {
    'use strict';

    angular
        .module('crud')
        .service('transport', DataTransport);

    DataTransport.$inject = ['$http', 'toaster'];

    /**
     * Data Transport Service
     *
     * @constructor
     */
    function DataTransport($http, toaster) {
        /* jshint validthis: true */
        return angular.extend(this, {
            send: send
        });

        /**
         * Send Data to Server
         *
         * @param {Object|{
         *  data: Object
         *  contentType: String
         *  notify: Boolean|String|Object
         * }} config
         * @param {Function} onSuccess
         * @param {Function} onError
         */
        function send(config, onSuccess, onError) {
            $http(angular.extend(config,
                (function (def) {
                    if (!config.hasOwnProperty('data'))
                        return def;
                    return $.param(config.data);
                })({}),
                (function (def) {
                    if (!config.hasOwnProperty('contentType') || config.contentType !== 'form')
                        return def;
                    return {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    };
                })({})
            )).then(
                function (response) {
                    var data = response.data;

                    if (config.hasOwnProperty('notify'))
                        notify(config.notify, 'success', data);

                    if (typeof onSuccess !== 'function')
                        return;

                    onSuccess(data);
                },
                function (response) {
                    var data = response.data;

                    if (config.hasOwnProperty('notify'))
                        notify(config.notify, 'error', data);

                    if (typeof onError !== 'function')
                        return;

                    onError(response.data);
                }
            );
        }

        /**
         * Notify about transporting data
         *
         * @param ntf
         * @param evn
         * @param rsp
         * @returns {*}
         */
        function notify(ntf, evn, rsp) {
            if (!(ntf instanceof Object)) {
                if (['boolean'].indexOf(typeof ntf) === -1)
                    return;

                if (typeof ntf === 'boolean')
                    ntf = {};
            }

            var evnMap = {
                success: {title: 'Success'},
                error: {title: 'Error'}
            };

            return activate();

            /**
             * Activation
             */
            function activate() {
                if (!ntf.hasOwnProperty('message'))
                    ntf.message = '=';

                if (ntf.hasOwnProperty('skipIf') && ntf.skipIf.constructor !== Array)
                    ntf.skipIf = [ntf.skipIf];

                if (!isAccessible())
                    return;

                toaster.pop(evn, evnMap[evn].title, getMessage(ntf.message));
            }

            /**
             * Check is notify accessible
             *
             * @returns {boolean}
             */
            function isAccessible() {
                return evnMap.hasOwnProperty(evn) && !(ntf.hasOwnProperty('skipIf') && ntf.skipIf.indexOf(evn) !== -1);
            }

            /**
             * Get message
             *
             * @param {String|Object} msg
             * @returns {*}
             */
            function getMessage(msg) {
                if (msg instanceof Object && msg.hasOwnProperty(evn))
                    return getMessage(msg[evn]);
                return rsp[(function (m) {
                    if (m && m[1] !== undefined)
                        return m[1];
                    return 'message';
                })(/=?([A-z0-9-_]+)?/.exec(msg))];
            }
        }
    }

})();
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
(function () {
    'use strict';

    angular
        .module('crud.datatable')
        .directive('zzDatatable', CRUDDataTableDirective);

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
                            // console.log($(div).width(), $(table).width(), div.scrollLeft());

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
                    $('<th class="bt0 bl0 p text-center" />')
                        .attr({
                            width: 1,
                            'data-sortable': false
                        })
                        .append($('<checkbox />')),
                    $.map(columns, function (column) {
                        return $('<th class="bt0 bl0" />')
                            .html('{{ "' + column + '" | translate }}');
                    }),
                    $('<th class="actions" />')
                        .attr({
                            width: 1,
                            'data-sortable': false
                        })
                        .append($('<div />'))
                )
            );
        }

    }

})();
(function () {
    'use strict';

    angular
        .module('crud.toolbar')
        .directive('zzToolbar', toolbar);

    toolbar.$inject = ['ToolBarHandler', '$compile'];

    function toolbar(ToolBarHandler, $compile) {
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
                scope.toolbar = new ToolBarHandler(defineEvents(scope.manifest, [{afterBuild: compile}]));
            }

            /**
             * Define ToolBar Events
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
             * Compile ToolBar
             *
             * @param {jQuery} toolbar
             * @private
             */
            function compile(toolbar) {
                element.replaceWith($compile(toolbar)(scope));
            }
        }
    }

})();
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
(function () {
    'use strict';

    angular
        .module('crud.form')
        .factory('FormHandler', FormHandlerFactory);

    FormHandlerFactory.$inject = ['Form', 'EventsHandler', 'FormRenderer', 'tf.form'];

    /**
     * Form Handler Factory
     *
     * @returns {FormHandler}
     * @constructor
     */
    function FormHandlerFactory(Form, EventsHandler, FormRenderer, transformer) {
        return FormHandler;

        /**
         * Form Handler
         *
         * @param manifest
         * @returns {*|{
         *  name: String,
         *  children: Array,
         *  actionBar: Array
         * }}
         * @constructor
         */
        function FormHandler(manifest) {
            /* jshint validthis: true */
            var $data = {}, $renderer, $transformer,
                $this = angular.extend(this, {
                    name: '',
                    action: '',
                    method: '',
                    children: [],
                    actionBar: [],
                    data: data,
                    getChildren: getChildren,
                    getChild: getChild,
                    getChildById: getChildById,
                    build: build
                });

            return activate();

            /**
             * Activation
             *
             * @returns {*}
             */
            function activate() {
                /* jshint -W061, eqeqeq: false */
                ['name:String', 'children:Array', 'actionBar:Array'].forEach(function (token) {
                    var $this = this,
                        parts = token.split(':'),
                        field = parts[0];
                    $this[field] = (function (field, type) {
                        if (!this.hasOwnProperty(field) || this[field].constructor.name != type)
                            return eval('new ' + type + '()');
                        return this[field];
                    }).apply(manifest, parts);
                }, $this);

                $renderer = new FormRenderer(manifest.hasOwnProperty('layout') ? manifest.layout : undefined);

                if (manifest.hasOwnProperty('useFormTransformer'))
                    $transformer = transformer(manifest.useFormTransformer);

                if (manifest.hasOwnProperty('events') && manifest.events instanceof Object) {
                    if (manifest.hasOwnProperty('actions') && manifest.actions instanceof Object)
                        angular.extend(manifest.events, manifest.actions);

                    angular.extend($this, new EventsHandler(manifest.events));
                }

                Object.keys($this)
                    .forEach(function (key) {
                        if (key === 'event' || typeof this[key] !== 'function')
                            return;
                        manifest[key] = this[key];
                    }, $this);

                return $this;
            }

            /**
             * Set|Get data value of form
             *
             * @param key
             * @param val
             * @returns {*}
             */
            function data(key, val) {
                if (key === undefined)
                    return $data;

                if (typeof key === 'string') {
                    if (val !== undefined) {
                        $data[key] = val;

                        return $this;
                    }

                    if ($data.hasOwnProperty(key))
                        return $data[key];

                    return undefined;
                }

                if (key instanceof Object)
                    $data = key;

                return $this;
            }

            /**
             * Get children of form
             *
             * @returns {Array<Object>}
             */
            function getChildren() {
                return $this.children;
            }

            /**
             * Get child of form by index
             *
             * @param {Number} index
             * @returns {undefined|Object}
             */
            function getChild(index) {
                return $this.children[index] !== undefined ? $this.children[index] : undefined;
            }

            /**
             * Get child of form by index
             *
             * @param {String} id
             * @returns {undefined|Object}
             */
            function getChildById(id) {
                try {
                    return $this.children.forEach(function (child) {
                        if (child.id !== id)
                            return;
                        throw child;
                    });
                }
                catch (child) {
                    return child;
                }
            }

            /**
             * Build form
             */
            function build(data) {
                delete manifest.build;

                if ($transformer !== undefined)
                    data = $transformer.transform(data);

                (angular.extend($this, data))
                    .data(data.values)
                    .event('afterBuild')
                    .invoke(undefined, $renderer.render(new Form($this)));

                Object.keys($this.values)
                    .forEach(function (key) {
                        if (this.indexOf(key) > -1)
                            return;
                        delete $this.values[key];
                    }, $this.children.map(function (child) {
                        return child.id;
                    }));
            }
        }

    }

})();
(function () {
    'use strict';

    angular
        .module('crud.form')
        .factory('FormRenderer', FormRendererFactory);

    FormRendererFactory.$inject = [];

    /**
     * Form Renderer Factory
     *
     * @returns {FormRenderer}
     * @constructor
     */
    function FormRendererFactory() {
        /* jshint validthis: true */
        return FormRenderer;

        /**
         * Form Renderer
         *
         * @param ruleValue
         * @returns {*}
         * @constructor
         */
        function FormRenderer(ruleValue) {
            var $rule,
                $this = angular.extend(this, {
                    rule: rule,
                    render: render
                });

            return activate();

            /**
             * Activation
             *
             * @returns {*}
             */
            function activate() {
                return $this.rule(ruleValue !== undefined ? ruleValue : 'dumb');
            }

            /**
             * Set|Get rule value
             *
             * @param value
             * @returns {*}
             */
            function rule(value) {
                if (value === undefined)
                    return $rule;

                $rule = value;

                return $this;
            }

            /**
             * Render form
             *
             * @param form
             * @returns {*}
             */
            function render(form) {
                $('body').append(form);
                ({
                    dumb: dumb,
                    grid: grid
                })[$rule](form);
                return form;
            }
        }

        /**
         * Render form in default style
         *
         * @param {jQuery} form
         */
        function dumb(form) {
            $('> children > child', form).each(function () {
                var child = $('> *', this).toArray();

                if ($('> input[type="hidden"]', this).length === 1)
                    return form.prepend(child);

                if (child.length > 1) {
                    $(child[0]).attr('class', 'col-lg-3');

                    if ($(child[0]).is('label'))
                        $(child[0]).addClass('control-label');

                    child[1] = $('<div class="col-lg-9" />').append($(child[1]));
                }
                else if (child.length > 0) {
                    child[0] = $('<div class="col-lg-offset-3 col-lg-9" />').append($(child[0]));
                }

                form.append($('<div class="form-group" />').append(child));
            });

            form.addClass('form-horizontal')
                .append(
                    $('<div class="form-group mb0" />').append(
                        $('<div class="col-lg-offset-3 col-lg-9" />').append($('> action-bar > *', form))
                    )
                );

            $('> children, > action-bar', form).remove();
        }

        /**
         * Render form in grid style
         *
         * @param {jQuery} form
         */
        function grid(form) {
            $('> div.form-group', dumb(form) || form).addClass('col-lg-6');
        }
    }

})();
(function () {
    'use strict';

    angular
        .module('crud.form')
        .factory('Form', FormFactory);

    /**
     * Form Factory
     *
     * @returns {getForm}
     * @constructor
     */
    function FormFactory() {
        return getForm;

        /**
         * Get form
         *
         * @param {Object} $
         * @returns {jQuery}
         */
        function getForm($) {
            return form($.name)
                .append(getChildren($.children))
                .append(getActionBar($.actionBar));
        }

        /**
         * Get children
         *
         * @param {Array<Object>} children
         * @returns {Array}
         */
        function getChildren(children) {
            return $('<children />').append(
                children.map(function (child, i) {
                    /* jshint -W061, eqeqeq: false */
                    try {
                        return $('<child />').append({
                            hidden: hidden,
                            checkbox: checkbox,
                            text: text,
                            select: select,
                            datePicker: datePicker
                        }[child.type](angular.extend(child, {
                            index: i,
                            model: 'form.data().' + child.id
                        })));
                    }
                    catch (error) {
                        throw console.error('Cannot find element by type: ' + child.type, child);
                    }
                })
            );
        }

        /**
         * Get actions
         *
         * @param {Array} actionBar
         * @returns {Array}
         */
        function getActionBar(actionBar) {
            return $('<action-bar />').append(
                actionBar.map(function (data, i) {
                    var btn = button(data);
                    if (i !== 0)
                        btn.addClass('ml');
                    return btn;
                })
            );
        }
    }

    /**
     * Create jQuery From Element
     *
     * @param {{String}} name
     * @returns {jQuery}
     */
    function form(name) {
        return $('<form class="form-validate" role="form" novalidate />').attr('name', name);
    }

    /**
     * Create hidden input
     *
     * @param data
     * @returns {jQuery}
     */
    function hidden(data) {
        return $('<input type="hidden" />').attr({
            name: data.name,
            'ng-model': data.model
        });
    }

    /**
     * Create checkbox
     *
     * @param data
     * @returns {jQuery}
     */
    function checkbox(data) {
        return $('<div class="checkbox c-checkbox pt0" />').css('minHeight', '0')
            .append(
                $('<label />').html(data.label)
                    .prepend(
                        $('<input type="checkbox" />').attr({
                            name: data.name,
                            'ng-model': data.model
                        }),
                        $('<span class="fa fa-check" />')
                    )
            );
    }

    /**
     * Create text input
     *
     * @param data
     * @returns {Array<jQuery>}
     */
    function text(data) {
        return [
            $('<label class="control-label mt-sm" />').html(data.label),
            $('<input type="text" class="form-control" />').attr({
                name: data.name,
                placeholder: data.placeholder,
                'ng-model': data.model
            })
        ];
    }

    /**
     * Create select
     *
     * @param data
     * @returns {Array<jQuery>}
     */
    function select(data) {
        return [
            $('<label class="control-label mt-sm" />').html(data.label),
            (function () {
                if (data.hasOwnProperty('multiple') && data.multiple !== false)
                    return multiple(data);
                return single(data);
            })(data)
        ];

        /**
         * Create select with single selection
         *
         * @param data
         * @returns {jQuery}
         */
        function single(data) {
            return $('<select class="form-control" />').attr({
                name: data.name,
                'ng-model': data.model,
                'ng-options': 'option.id as option.text | translate for option in form.getChild(' + data.index + ').options'
            });
        }

        /**
         * Create select with multiple selection based on ui-select
         *
         * @param data
         * @returns {jQuery}
         */
        function multiple(data) {
            return $('<ui-select />').attr({
                    name: data.name,
                    'ng-model': data.model,
                    theme: 'bootstrap',
                    multiple: true
                })
                .append(
                    $('<ui-select-match />').html('{{ $item.text }}')
                        .attr({
                            placeholder: data.placeholder
                        }),
                    $('<ui-select-choices />')
                        .attr('repeat', 'option.id as option in (form.getChild(' + data.index + ').options | filter: $select.search)')
                        .append(
                            $('<div />').html('{{ option.text }}')
                        )
                );
        }
    }

    /**
     *
     */
    function datePicker(data) {
        angular.extend(data, {
            isOpen: false,
            options: {}
        });
        return [
            $('<label class="control-label mt-sm" />').html(data.label),
            $('<div class="input-group" />').append(
                $('<input type="text" class="form-control" />').attr({
                    'uib-datepicker-popup': 'dd-MMMM-yyyy',
                    'datepicker-options': 'form.children[' + data.index + '].options',
                    'close-text': 'Close',
                    'is-open': 'form.children[' + data.index + '].isOpen',
                    'ng-model': data.model
                }),
                $('<span class="input-group-btn">').append(
                    $('<button class="btn btn-default" />').append($('<i class="fa fa-calendar" />'))
                        .click(function () {
                            data.isOpen = true;
                        })
                )
            )
        ];
    }

    /**
     * Create button
     *
     * @param data
     * @returns {jQuery}
     */
    function button(data) {
        var btn = $('<button class="btn btn-default" />').html('{{ "' + data.title + '" | translate }}');

        if (data.hasOwnProperty('class'))
            btn.removeClass('btn-default')
                .addClass('btn-' + data.class);

        if (data.hasOwnProperty('icon'))
            btn.prepend(
                $('<em class="mr-sm" />').addClass(data.icon)
            );

        if (data.hasOwnProperty('$$'))
            btn.data('$$', data.$$).click(function () {
                var form = angular.element(this).scope().form,
                    $$ = $(this).data('$$');

                form.event($$).invoke(form);
            });

        return btn;
    }

})();
(function () {
    'use strict';

    angular
        .module('crud.form')
        .directive('zzForm', directive);

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
(function () {
    'use strict';

    angular
        .module('crud')
        .service('tf.form', transformer);

    /**
     * Form Transformer Service
     *
     * @returns {Function}
     */
    function transformer() {
        var transformers = {
            symfony: new SymfonyFormTransformer()
        };

        return function (name) {
            return transformers[name];
        };

        /**
         * Symfony Form Transformer
         *
         * @returns {*}
         * @constructor
         */
        function SymfonyFormTransformer() {
            var $helper,
                $this = angular.extend(this, {
                    transform: transform
                });

            return activate();

            /**
             * Activation
             *
             * @returns {*}
             */
            function activate() {
                $helper = helper();
                return $this;
            }

            /**
             * Get Transformer Helper
             *
             * @returns {{
             *  values: getValues,
             *  multiple: isMultiple,
             *  type: getType,
             *  label: getLabel,
             *  options: getOptions,
             *  child: getChild,
             *  children: getChildren,
             *  form: getForm
             * }}
             */
            function helper() {
                return {
                    values: getValues,
                    multiple: isMultiple,
                    type: getType,
                    label: getLabel,
                    options: getOptions,
                    child: getChild,
                    children: getChildren,
                    form: getForm
                };

                /**
                 * Get form values
                 *
                 * @param data
                 * return {Object}
                 */
                function getValues(data) {
                    if (data.constructor !== Object)
                        return {};

                    var typesMap = {
                        object: object,
                        array: array
                    };

                    return Object.keys(data)
                            .forEach(function (key) {
                                key = (function (key, value) {
                                    var field = key.replace(/_([a-z])/g, function (g) {
                                            return g[1].toUpperCase();
                                        });

                                    this[field] = value;

                                    if (key !== field)
                                        delete this[key];

                                    return field;
                                }).call(this, key, this[key]);

                                var type = this[key].constructor.name.toLowerCase();
                                if (!typesMap.hasOwnProperty(type))
                                    return;
                                this[key] = typesMap[type](this[key]);
                            }, data) || data;

                    /**
                     * Object modification
                     *
                     * @param {Object} data
                     * @returns {Number}
                     */
                    function object(data) {
                        return data.id;
                    }

                    /**
                     * Array modification
                     *
                     * @param {Array} data
                     * @returns {Array}
                     */
                    function array(data) {
                        return data.map(function (item) {
                            return item.id;
                        });
                    }
                }

                /**
                 * Is select multiple
                 *
                 * @param data
                 * @returns {undefined|boolean}
                 */
                function isMultiple(data) {
                    if (!data.hasOwnProperty('multiple'))
                        return;
                    return !!data.multiple;
                }

                /**
                 * Get child type
                 *
                 * @param {String} value
                 * @returns {String}
                 */
                function getType(value) {
                    if (value === 'choice')
                        return 'select';
                    else if (value === 'date')
                        return 'datePicker';
                    return value;
                }

                /**
                 * Get label or placeholder value of child
                 *
                 * @param {{
                 *  label: String,
                 *  attr: {
                 *      translateLabel: String
                 *  }
                 * }} data
                 * @param {String} field
                 * @param {String=} attr
                 * @returns {String|*}
                 */
                function getLabel(data, field, attr) {
                    field = attr !== undefined ? attr : field;
                    if (data.attr.hasOwnProperty(field))
                        return '{{ "' + data.attr[field] + '" | translate }}';
                    return data[field];
                }

                /**
                 * Get options
                 *
                 * @param {{
                 *  choices: Array<Object>,
                 *  placeholder: String
                 * }} data
                 * @returns {Array|undefined}
                 */
                function getOptions(data) {
                    if (data.hasOwnProperty('choices') && data.choices instanceof Object) {
                        data.choices = Object.keys(data.choices).map(function (key) {
                            return data.choices[key];
                        });
                    }
                    if (!data.hasOwnProperty('choices') || !(data.choices instanceof Array))
                        return;
                    return [{
                        id: undefined,
                        text: data.placeholder
                    }].concat(data.choices.map(function (choice) {
                        return {
                            id: choice.data instanceof Object ? choice.data.id : choice.data,
                            text: choice.label
                        };
                    }));
                }

                /**
                 * Get child
                 *
                 * @param {Object|{
                 *  block_prefixes: Array<String>,
                 *  full_name: String
                 * }} data
                 * @returns {{
                 *  id: String,
                 *  type: String,
                 *  name: String,
                 *  label: String,
                 *  placeholder: String,
                 *  options: Array<Object>
                 * }}
                 */
                function getChild(data) {
                    /* jshint -W106 */
                    return (function () {
                        /* jshint validthis: true */
                        var self = this;
                        Object
                            .keys(arguments)
                            .forEach(function (i) {
                                if (this[i][Object.keys(this[i])[0]] === undefined)
                                    return;
                                angular.extend(self, this[i]);
                            }, arguments);
                        return self;
                    }).apply({
                        // id: data.name.split(/(?=[A-Z])/).join('_').toLowerCase(),
                        id: data.name,
                        type: $helper.type(data.block_prefixes[1]),
                        name: data.name
                    }, [
                        {label: $helper.label(data, 'label', 'translateLabel')},
                        {placeholder: $helper.label(data, 'placeholder')},
                        {options: $helper.options(data)},
                        {multiple: $helper.multiple(data)}
                    ]);
                }

                /**
                 * Get children
                 *
                 * @param data
                 * @returns {undefined|Array.<T>}
                 */
                function getChildren(data) {
                    if (!data.hasOwnProperty('children'))
                        return;
                    return Object.keys(data.children)
                        .map(function (key) {
                            if (!data.children[key].hasOwnProperty('vars'))
                                return;
                            return $helper.child(data.children[key].vars);
                        })
                        .filter(function (child) {
                            return child !== undefined;
                        });
                }

                /**
                 * Get form
                 *
                 * @param {Object} data
                 * @returns {undefined|{
                 *  name: String
                 * }}
                 */
                function getForm(data) {
                    /* jshint -W106 */
                    if (!data.hasOwnProperty('vars'))
                        return;
                    return {
                        name: data.vars.full_name,
                        action: data.vars.action,
                        method: data.vars.method,
                        children: $helper.children(data),
                        values: $helper.values(data.vars.value)
                    };
                }
            }

            /**
             * Get Transformer Helper
             *
             * @param {Object} data
             * @returns {Object}
             */
            function transform(data) {
                return $helper.form(data);
            }
        }
    }

})();