define([
    'dojo/_base/declare',
    'dojo/topic',
    'dojo/query',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom',
    'dojo/NodeList-traverse', // this is used to add more functionality to dojoQuery. DON'T GET RID OF IT.

    'config/layoutConfig',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./templates/MapCoverView.html'],

function(declare, topic, dojoQuery, lang, dojoOn, domConstruct, domClass, dom, nlt,
    layoutConfig,
    _EventedWidget, _TemplatedMixin,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {

        iconClass: null,
        templateString: template,

        constructor: function(options) {
            /* jshint unused: false */
            this.inherited(arguments);
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
            var self = this;
            dojoOn(this.domNode, 'click', function(evt) {
                if (evt.target === this) {
                    self.closeCover();
                }
            });

            topic.subscribe('maptoggle-click', function(targetToggle) {
                domClass.toggle(self.domNode, 'push-down', !domClass.contains(targetToggle, 'highlight'));
            });
            topic.subscribe('window-resize', lang.hitch(this, this.responsiveLayout));
            topic.subscribe('function-finished', lang.hitch(this, this.closeCover));

        },

        closeCover: function() {
            if (!domClass.contains(this.domNode, 'hide')) {
                domClass.add(this.domNode, 'push-down');
                topic.publish('mapcover-close');
            }
        },

        responsiveLayout: function(windowSize) {
            if (windowSize.h < layoutConfig.breakHeight2 || windowSize.w < layoutConfig.breakWidth1) {
                domClass.remove(this.domNode, 'hide');
            } else {
                domClass.add(this.domNode, 'hide');
            }
        }

    });
});
