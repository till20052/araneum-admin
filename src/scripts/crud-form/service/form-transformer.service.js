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
                    else if(value === 'date')
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