define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    './FloorPickerView'],

function(declare, lang, topic, PickerView) {

    return declare([], {

        locModel: null,

        constructor: function(options) {
            this.containerDiv = options.containerDiv;
            this.locModel = options.locModel;
            this.inherited(arguments);
            this.postCreate();
        },

        // this does not happen automatically.
        postCreate: function() {
            this.inherited(arguments);
            this.pickerView = new PickerView({
                locModel: this.locModel,
                containerDiv: this.containerDiv
            }, null);
            this.pickerView.startup();
        },

        startup: function() {
            this.inherited(arguments);
            this.attachEventListeners();
        },

        attachEventListeners: function() {
            var self = this;
            // if too far out, hide floor picker
            topic.subscribe('map-zoom-end', function(zoomResult) {
                self.pickerView.adjustVisibility(zoomResult.level);
            });
            this.locModel.on('availFloors-update', lang.hitch(this, this.onAvailFloorsUpdate));
            this.locModel.on('floor-update', lang.hitch(this, this.onFloorUpdate));
        },

        onAvailFloorsUpdate: function() {
            this.pickerView.constructUI();
        },

        onFloorUpdate: function() {
            this.pickerView.updateHighlightedFloor();
        },

        // TODO: GET RID OF THIS!
        testFloorPicker: function() {
            this.locModel.set('availFloors', ['5M', '03', 'B', '8', '12', '1', '3']);
        }

    });
});
