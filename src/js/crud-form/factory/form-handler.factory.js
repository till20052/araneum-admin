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