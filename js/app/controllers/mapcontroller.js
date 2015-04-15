define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/topic',
    'dojo/on',

    'dojo/dom-class',


    'app/controllers/ResultsLayerController',
    'app/controllers/DynamicLayerController',
    'app/controllers/FeatureLayerController'
],

function(declare, lang, dojoQuery, topic, dojoOn,
    domClass,
    ResultsLayerController, DynamicLayerController, FeatureLayerController ) {

    return declare([], {

        map: null,
        locModel: null,
        config: null,

        constructor: function(options) {
            this.setClassProperties(options);
            this.addLayers();
            this.attachEventListeners();

        },

        addLayers: function() {
            if (this.mapServiceUrl) {
                new DynamicLayerController({
                    dataConfig: this.config.dataLayer,
                    locModel: this.locModel,
                    map: this.map
                });
            } else {
                new FeatureLayerController({
                    dataConfig: this.config.dataLayer,
                    locModel: this.locModel,
                    map: this.map
                });
            }

            new ResultsLayerController({
                map: this.map,
                dataConfig: this.config.dataLayer,
                symbolConfig: this.config.selectionSymbol,
                popupWrapper: 'popupWrapper'
            });
        },

        setClassProperties: function(options) {
            this.map = options.map;
            this.locModel = options.locModel;
            this.config = options.config; // all config
            // more used objects in config
            this.roomZoom = this.config.dataLayer.roomLayerInfo.zoomTo || 21;
            this.mapServiceUrl = options.config.dataLayer.mapServiceUrl;

            // set up some things...
        },

        attachEventListeners: function() {
            var self = this;
            // publish some map events so that every widget doesn't
            // have to have hold of the map
            this.map.on('click', function(mapEvt) {
                topic.publish('map-click', mapEvt);
            });
            this.map.on('update-start', function() {
                topic.publish('map-update-start');
            });
            this.map.on('update-end', function() {
                topic.publish('map-update-end');
            });
            this.map.on('zoom-end', function(zoomResult) {
                topic.publish('map-zoom-end', zoomResult);
            });
            this.map.on('resize', function(resizeResult) {
                self.publishMapSize(resizeResult);
                dojoOn.once(self.map, 'update-end', lang.hitch(self, self.checkLogoSize));
            });
            // check logo size on load.
            dojoOn.once(this.map, 'update-end', lang.hitch(self, self.checkLogoSize));

            if (this.locModel.bldgExtent) {
                this.locModelExtentChangeHandler('bldgExtent');
            }
            this.locModel.on('bldgExtent-update', function(updateObj) {
                var newExtent = updateObj.target.bldgExtent;
                if (newExtent && !updateObj.silent) {
                    self.navigateMap(newExtent.expand(1.2));
                }
            });
            topic.subscribe('map-changeExtent', lang.hitch(this, this.navigateMap));
            topic.subscribe('map-center', lang.hitch(this, this.centerMap));
        },

        checkLogoSize: function() {
            var smallEsriLogo = dojoQuery('.logo-sm', this.map.root);
            console.debug('smallEsriLogo?', smallEsriLogo.length);
            domClass.toggle(this.map.container, 'small-logo', smallEsriLogo.length > 0);

        },

        locModelExtentChangeHandler: function(extentField, dijitEvt) {
            var locTarget = dijitEvt ? dijitEvt.target : this.locModel;
            if (locTarget && locTarget[extentField]) {
                this.navigateMap(locTarget[extentField].expand(1.2));
            }
        },

        navigateMap: function(newExtent) {
            this.map.setExtent(newExtent, true);
        },

        centerMap: function(centerPoint) {
            console.debug('centerMap', arguments);

            // TODO: why wasn't this working?
            // if (this.map.extent.contains(centerPoint) && this.locModel.bldgExtent.contains(centerPoint)) {
            //     console.debug('already showing building and in selected building');
                this.waitForMapToCenterAndZoom(centerPoint);
            // } else {
                // console.debug('not showing building, waiting for extent-change');
                // dojoOn.once(this.map, 'extent-change', lang.hitch(this, this.waitForMapToCenterAndZoom, zoomTo, centerPoint));
            // }
        },

        waitForMapToCenterAndZoom: function(centerPoint) {
            console.debug('waitForMapToCenterAndZoom', arguments, this);
            this.map.centerAndZoom(centerPoint, this.roomZoom).then(lang.hitch(this, function() {
                topic.publish('map-center-complete', {centerPoint: centerPoint});
            }));
        },

        publishMapSize: function(resizeResult) {
            resizeResult = resizeResult || {};
            var h = resizeResult.height || this.map.height;
            var w = resizeResult.width || this.map.width;
            topic.publish('map-resize', {h: h, w: w});
        }
    });
});
