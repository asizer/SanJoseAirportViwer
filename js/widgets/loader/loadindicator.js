define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/topic',
    'dojo/dom-class',


    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./LoadIndicatorView.html'],

function(declare, lang, dojoOn, topic, domClass,
    _EventedWidget, _TemplatedMixin,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {

        templateString: template,
        id: 'load-indicator',

        constructor: function(options) {
            this.inherited(arguments);
            this.containerDiv = options.containerDiv;
        },

        postCreate: function() {
            this.inherited(arguments);
            this.attachEventListeners();
        },

        startup: function() {
            this.inherited(arguments);
            this.placeAt(this.containerDiv);
        },

        attachEventListeners: function() {
            topic.subscribe('query-start', lang.hitch(this, this.showIndicator));
            topic.subscribe('map-update-start', lang.hitch(this, this.showIndicator));

            topic.subscribe('query-done', lang.hitch(this, this.hideIndicator));
            topic.subscribe('map-update-end', lang.hitch(this, this.hideIndicator));
        },

        hideIndicator: function() {
            console.debug('hideBusy');
            domClass.add(this.domNode, 'hide');
        },
        showIndicator: function() {
            console.debug('showBusy');
            domClass.remove(this.domNode, 'hide');
        }
    });
});
