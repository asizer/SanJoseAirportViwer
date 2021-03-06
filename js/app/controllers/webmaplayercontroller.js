/* global console */

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/on',

    'esri/layers/ArcGISDynamicMapServiceLayer',

    'app/util/queryUtil',
    'esri/tasks/QueryTask'],

function(declare, lang, topic, dojoOn,
    DynamicLayer/*,
    queryUtil, QueryTask*/) {

    return declare([], {

        map: null,
        locModel: null,
        dataConfig: null,
        allLayers: [],

        constructor: function(options) {
            this.setClassProperties(options);
            this.addLayers();
            this.attachEventListeners();

        },

        setClassProperties: function(options) {
            this.map = options.map;
            this.locModel = options.locModel;
            this.dataConfig = options.dataConfig; // all config
            // more used objects in config
            this.buildingLyrInfo = options.dataConfig.buildingLayerInfo;
            this.mapServiceUrl = options.dataConfig.mapServiceUrl;

            // set up some other things...
            this.constructLayerInfo();
        },

        // TODO: put the setAllLayersVisible somewhere else, since this needs to happen
        // after the first floor update to minimize exportMap requests.
        attachEventListeners: function() {
            this.checkForFloorLoad();
            this.locModel.on('floor-update', lang.hitch(this, this.setDefExprs));
        },

        checkForFloorLoad: function() {
            if (!this.locModel.floor) {
                dojoOn.once(this.locModel, 'floor-update', lang.hitch(this, this.checkForFloorLoad));
                return;
            }
            this.setDefExprs({silent: true});
            if (this.mapServiceLayer.loaded) {
                this.setAllLayersVisible();
            } else {
                dojoOn.once(this.mapServiceLayer, 'load', lang.hitch(this, this.setAllLayersVisible));
            }
        },

        addLayers: function() {
            this.mapServiceLayer = new DynamicLayer(this.mapServiceUrl, {id: 'dataLayer'});
            // only show the building layer initially so the user doesn't see a giant jumble of every floor's data
            this.mapServiceLayer.setVisibleLayers([this.buildingLyrInfo.layerNum]);
            this.map.addLayer(this.mapServiceLayer);

        },


        // store the layer definition function and the list of visible layers
        constructLayerInfo: function() {
            var self = this;
            _.each(this.dataConfig, function(lyrInfo) {
                if (lyrInfo && (lyrInfo.layerNum + 0 === lyrInfo.layerNum) && lyrInfo.addToMap) {
                    self.allLayers.push(lyrInfo.layerNum);
                }
            });
            this.filterLayers = _.chain(this.dataConfig)
                                    .filter(function(obj) {
                                        return obj && (obj.layerNum + 0 === obj.layerNum) && obj.floorFilter;
                                    })
                                    .map(function(obj) {
                                        return {
                                            layerNum: obj.layerNum,
                                            filterFunction: function(bldg, flr) {
                                                return obj.buildingField + ' = \'' + bldg + '\' AND ' + obj.floorField + ' = \'' + flr + '\'';
                                            }
                                        };
                                    })
                                    .value();
        },

        setAllLayersVisible: function() {
            console.debug('setAllLayersVisible');
            this.mapServiceLayer.setVisibleLayers(this.allLayers);
        },

        setDefExprs: function(params) {
            console.debug('setDefExprs', arguments);
            var layerDefArr = [];
            var self = this;
            _.each(this.filterLayers, function(lyrInfo) {
                layerDefArr[lyrInfo.layerNum] = lyrInfo.filterFunction(self.locModel.building, self.locModel.floor);
            });

            this.mapServiceLayer.setLayerDefinitions(layerDefArr);

            topic.publish('dynamiclayer-defexpr-update', {layerDefArr: layerDefArr, silent: (params && params.silent) ? params.silent : false});
        }


    });
});
