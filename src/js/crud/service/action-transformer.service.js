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