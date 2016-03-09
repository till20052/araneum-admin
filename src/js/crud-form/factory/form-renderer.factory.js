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