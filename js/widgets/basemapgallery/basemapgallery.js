define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/topic',
    'dojo/on',

    'esri/dijit/Basemap',
    'esri/dijit/BasemapLayer',
    'esri/dijit/BasemapGallery'],

function(declare, lang, domConstruct, domStyle, topic, dojoOn,
    Basemap, BasemapLayer, BMG) {

    return declare([], {

        constructor: function(options, viewElement) {
            this.postCreate(options, viewElement);
        },

        postCreate: function(options, viewElement) {
            var bmg = new BMG({
                showArcGISBasemaps: true,
                // portalUrl: options.config.portalUrl,
                map: options.map,
                // basemaps: this.createCustomBasemaps(options.config.customBasemaps),
                id: options.id,
            }, viewElement);
            this.attachEventListeners(bmg, options);
            bmg.startup();
        },

        startup: function() {
            console.log("basemap gallery start");
        },

        attachEventListeners: function(bmg, options) {
            // if you don't want to exclude basemaps (in config), you need to comment out the next line
            bmg.on('load', lang.partial(this.customizeBMG, options.config.basemapTitles));
            bmg.on('selection-change', lang.hitch(this, this.broadcastFunctionFinished));
            dojoOn.once(bmg, 'selection-change', lang.partial(this.onFirstSelection, options.map));
            topic.subscribe('map-resize', lang.hitch(this, this.onMapResize, bmg));
        },

        onFirstSelection: function(map, dojoOnObj) {
            dojoOn.once(map, 'update-end', lang.hitch(this, function() {
                _.each(map.basemapLayerIds, function(bmid) {
                    if (_.contains(map.layerIds, bmid)) {
                        map.removeLayer(map.getLayer(bmid));
                    }
                });
            }));
        },

        broadcastFunctionFinished: function() {
            topic.publish('function-finished');
        },

        createCustomBasemaps: function(basemaps) {
            return _.map(basemaps, function(bmInfo) {
                bmInfo.layers =  _.map(bmInfo.baseMapLayers, function(lyrInfo) {
                    return new BasemapLayer({url: lyrInfo.url});
                });
                return new Basemap(bmInfo);
            });
        },

        customizeBMG: function(BMTitlesArr) {
            // 'this' = bmg
            var bmg = this;
            var bmIdsToRemove = [];

            _.each(this.basemaps, function(bm) {
                if (!_.contains(BMTitlesArr, bm.title) && !bm.layers) {
                    bmIdsToRemove.push(bm.id);
                }
            });
            _.each(bmIdsToRemove, function(id) {
                bmg.remove(id);
            });
        },

        onMapResize: function(bmg, newMapDimensions) {
            this.domNodeHeight = _.min([newMapDimensions.h * 0.9 - 50, 600]);
            domStyle.set(bmg.domNode.parentElement, 'maxHeight', this.domNodeHeight + 'px');
        }
    });
});
