/* jshint unused: false */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'app/util/queryUtil',
    'esri/dijit/_EventedWidget'
], function(declare, lang, queryUtil, _EventedWidget) {
    return declare(_EventedWidget, {

        floor: null,
        building: null,
        bldgExtent: null,
        site: null,
        siteExtent: null,
        availFloors: [],

        constructor: function(options) {
        },

        postCreate: function() {
        },

        startup: function() {
        },

        set: function(varToSet, newVal, silentSet) {
            console.debug('locationModel set', arguments);
            this.inherited(arguments);
            // make locModel responsible for finding its own bldgExtent if passed in as null.
            if (_.isObject(varToSet) && varToSet.building && !varToSet.bldgExtent) {
                console.debug('emitting locModel-findBldgExtent');
                this.emit('locModel-findBldgExtent', {building: varToSet.building, floor: varToSet.floor});
            } else {
                this.emit(varToSet + '-update', {silent: silentSet || false});
            }
        },

        silentSet: function(arg1, arg2) {
            var self = this;
            if (_.isObject(arg1)) {
                _.each(arg1, function(val, key) {
                    self.set(key, val, true);
                });
            } else {
                this.set(arg1, arg2, true);
            }
        },

    });
});
