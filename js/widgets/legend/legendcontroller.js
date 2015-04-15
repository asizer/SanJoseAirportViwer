define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/topic',
    'dojo/on',

    'esri/dijit/Legend'],

function(declare, lang, domConstruct, domStyle, topic, dojoOn,
    EsriLegend) {

    return declare([], {

        constructor: function(options, viewElement) {
            this.postCreate(options, viewElement);
        },

        postCreate: function(options, viewElement) {
            var layerInfos = this.createLayerInfos(options.dataConfig, options.map);
            var legend = new EsriLegend({
                map: options.map,
                layerInfos: layerInfos,
                baseClass: !options.dataConfig.mapServiceUrl || options.dataConfig.hideLegendSubtitles ? 'hide-subtitles' : 'show-subtitles',
                id: options.id
            }, viewElement);
            this.attachEventListeners(legend, options);
            legend.startup();
        },

        startup: function() {
        },

        attachEventListeners: function(legend, options) {
            if (!options.locModel.floor) {
                dojoOn.once(options.locModel, 'floor-update', function() {
                    legend.refresh();
                });
            }
            dojoOn(legend.domNode, 'click', lang.partial(topic.publish, 'function-finished'));
            topic.subscribe('map-resize', lang.hitch(this, this.onMapResize, legend));
        },

        broadcastFunctionFinished: function() {
            topic.publish('function-finished');
        },

        createLayerInfos: function(dataConfig, map) {

            // dynamic map service
            if (dataConfig.mapServiceUrl) {
                var hideLayers = [];
                _.each(dataConfig, function(lyrInfo) {
                    if (lyrInfo && (lyrInfo.layerNum + 0 === lyrInfo.layerNum) && lyrInfo.addToMap && !lyrInfo.showInLegend) {
                        hideLayers.push(lyrInfo.layerNum);
                    }
                });
                return [{
                    title: dataConfig.legendTitle,
                    layer: map.getLayer('dataLayer'),
                    hideLayers: hideLayers
                }];
            }

            // feature service
            var layerInfos = [];

            _.each(dataConfig, function(lyrInfo, key) {
                if (lyrInfo && (lyrInfo.layerNum + 0 === lyrInfo.layerNum) && lyrInfo.addToMap && lyrInfo.showInLegend) {
                    layerInfos.push({
                        title: lyrInfo.titleForLegend,
                        layer: map.getLayer(key.replace('Info', ''))
                    });
                }
            });
            return layerInfos;
        },

        onMapResize: function(legend, newMapDimensions) {
            this.domNodeHeight = _.min([newMapDimensions.h * 0.9 - 50, 550]);
            domStyle.set(legend.domNode.parentElement, 'maxHeight', this.domNodeHeight + 'px');
        }
    });
});
