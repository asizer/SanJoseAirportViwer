/* global console */

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/on',

    'esri/layers/FeatureLayer',

    'app/util/queryUtil',
    'esri/tasks/QueryTask'],

function(declare, lang, topic, dojoOn,
    FeatureLayer/*,
    queryUtil, QueryTask*/) {

    return declare([], {

        map: null,
        locModel: null,
        dataConfig: null,
        allLayers: [],
        filterLayers: [],

        constructor: function(options) {
            this.setClassProperties(options);
            this.addLayers();
            this.attachEventListeners();

        },

        setClassProperties: function(options) {
            this.map = options.map;
            this.locModel = options.locModel;
            this.dataConfig = options.dataConfig; // all config
        },

        // TODO: put the setAllLayersVisible somewhere else, since this needs to happen
        // after the first floor update to minimize exportMap requests.
        attachEventListeners: function() {
            var self = this;
            if (this.locModel.floor) {
                this.setDefExprs();
                this.setAllLayersVisible();
            } else {
                dojoOn.once(this.locModel, 'floor-update', function() {
                    self.setAllLayersVisible();
                });
            }
            this.locModel.on('floor-update', lang.hitch(this, this.setDefExprs));
        },

        addLayers: function() {
            var self = this;
            _.each(this.dataConfig, function(lyrInfo, key) {
                if (lyrInfo && lyrInfo.layerNum + 0 === lyrInfo.layerNum && lyrInfo.url && lyrInfo.addToMap) {
                    var lyr = new FeatureLayer(lyrInfo.url, {id: key.replace('Info', '')});
                    lyr.setVisibility(key === 'buildingLayerInfo');
                    self.allLayers.push(lyr);

                    if (lyrInfo.floorFilter) {
                        self.filterLayers.push({
                            layer: lyr,
                            filterFunction: function(bldg, flr) {
                                return lyrInfo.buildingField + ' = \'' + bldg + '\' AND ' + lyrInfo.floorField + ' = \'' + flr + '\'';
                            }
                        });
                    }
                    self.map.addLayer(lyr);
                    lyr.on('load', self.onLayerLoad);
                }
            });

        },

        // this is a little hacky and dangerous since it uses _ properties,
        // but allows labels without having to specify outfields for the layer in config.
        onLayerLoad: function(loadObj) {
            if (loadObj.layer && loadObj.layer.labelingInfo) {
                console.debug('adding outfields to feature layer for labels');
                _.each(loadObj.layer.labelingInfo, function(info) {
                    var labelFieldArr = info.labelExpression.replace(/[\[\]\s+]+/g, '').split(',');
                    loadObj.layer._outFields = _.union(loadObj.layer._outFields, labelFieldArr);
                });
            }
        },

        setAllLayersVisible: function() {
            _.each(this.allLayers, function(lyr) {
                lyr.show();
            });
        },

        setDefExprs: function(params) {
            console.debug('setDefExprs', arguments);
            var self = this;
            _.each(this.filterLayers, function(lyrInfo) {
                lyrInfo.layer.setDefinitionExpression(lyrInfo.filterFunction(self.locModel.building, self.locModel.floor));
            });

            topic.publish('featurelayer-defexpr-update', {silent: (params && params.silentFlag) ? params.silentFlag : false});
        }


    });
});
