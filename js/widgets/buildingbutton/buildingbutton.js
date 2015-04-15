define([
    'dojo/_base/declare',
    'dojo/on',
    'dojo/topic',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./buildingButtonView.html'],

function(declare, dojoOn, topic,
    _EventedWidget, _TemplatedMixin,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {

        templateString: template,
        id: 'buildingButton',

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
            var self = this;
            dojoOn(this.domNode, 'click', function() {
                if (self.locModel.bldgExtent) {
                    topic.publish('map-changeExtent', self.locModel.bldgExtent.expand(1.2));
                }
            });
        }
    });
});
