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