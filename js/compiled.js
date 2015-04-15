require({
cache: {
// Source: js/app/controller.js
'app/controller': function() {
/* global app:true */

define([
    'config/config-pros', // if you change this, change the one in main.js too.

    'app/views/LayoutView',
    'app/models/LocationModel',
    'app/controllers/MapController',
    'app/controllers/QueryController',

    'widgets/buildingbutton/BuildingButton',
    'widgets/floorpicker/FloorPicker',
    'widgets/overviewmap/OverviewMap',
    'widgets/loader/LoadIndicator',
    'widgets/basemapgallery/BasemapGallery',
    'widgets/bookmarks/BookmarksController',
    'widgets/newlayersearch/NewLayerSearch',
    'widgets/legend/LegendController',


    'app/views/MapButtonPanelView',
    'app/views/MapCoverView',

    'esri/map',
    'esri/basemaps',
    'esri/geometry/Extent'],

function(config,
    Layout, LocationModel, MapController, QueryController,
    BuildingButton, FloorPicker, OverviewMap, LoadIndicator, CustomBMG, Bookmarks, LayerSearch,
    CustomLegend,
    MapButtonPanelView, MapCoverView,
    Map, esriBasemaps, Extent) {

    return {

        /**
         * This is the entry point for the application, called from index.html
         * @return { N/A }
         */
        startup: function() {
            app = this;
            this.initConfig();
            this.initQueryParams();
            this.initModels();
            this.initLayout();
            var self = this;
            this.map.on('load', function() {
                app.initQueries();
                app.initWidgets();
                self.layout.publishWindowSize();
                self.mapController.publishMapSize();
            });
        },

        /**
         * Initialize esri configuration settings
         * @return { N/A }
         */
        initConfig: function() {

        },

        initQueryParams: function() {
            var match,
            urlParams = {},
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); },
            query  = window.location.search.substring(1);

            while ((match = search.exec(query))) {
               urlParams[decode(match[1])] = decode(match[2]);
            }
            this.queryParams = urlParams;

        },

        initModels: function() {
            var startLoc = {
                building: null,
                floor: null
            };
            if (!this.queryParams.room) {
                if (this.queryParams.building) {
                    startLoc.building = this.queryParams.building;
                    startLoc.floor = this.queryParams.floor || null;
                } else {
                    startLoc = config.defaultLocation;
                }
            }

            this.locModel = new LocationModel(_.extend(startLoc, {id: 'locModel'}));

            this.locModel.startup();
        },

        /**
         * Initialize the application layout by inserting top level nodes into the DOM
         * @return { N/A }
         */
        initLayout: function() {
            this.layout = new Layout({
                config: config.layout,
            }, 'main-container');
            this.layout.startup();

            this.initMap();

        },

        /**
         * Initialize the map and place it in 'map-container'
         * @return { N/A }
         */
        initMap: function() {

            var mapConfig;
            // enable labels on feature layers (there doesn't seem to be a way to do this after map load)
            if (!config.dataLayer.mapServiceUrl) {
                mapConfig = _.extend(config.mapSetup, {showLabels: true});
            } else {
                mapConfig = config.mapSetup;
            }

            if (mapConfig.extent && _.isObject(mapConfig.extent)) {
                mapConfig.extent = new Extent(mapConfig.extent);
            }

            if (!esriBasemaps.hasOwnProperty(mapConfig.basemap)) {
                this.initBasemaps();
            }

            this.map = new Map('map-container', mapConfig);
            this.mapController = new MapController({
                map: this.map,
                locModel: this.locModel,
                config: config
            });
        },

        initBasemaps: function() {
            _.each(config.basemapGallery.customBasemaps, function(bmInfo) {
                if (esriBasemaps.hasOwnProperty(bmInfo.title)) {
                    console.warn('duplicate basemap title');
                    return;
                }
                esriBasemaps[bmInfo.title] = bmInfo;
            });
        },

        initQueries: function() {
            var qc = new QueryController({
                locModel: this.locModel,
                dataConfig: config.dataLayer
            });
            if (this.queryParams.room) {
                qc.runRoomFromRoomIDQuery(this.queryParams.room);
            }
        },

        initUtils: function() {

        },

        /**
         * Initialize components of the application, this is the last responsibility of the Controller
         * @return { N/A }
         */
        initWidgets: function() {

            this.initBuildingButton();
            this.initFloorPicker();
            this.initOverviewMap();
            this.initLoader();

            var mapCoverView = new MapCoverView({
                containerDiv: 'main-container',
                id: 'map-cover',
                config: config.layout
            });
            mapCoverView.startup();

            this.initBMG(mapCoverView);
            this.initLegend(mapCoverView);
            this.initBookmarks(mapCoverView);
            this.initSearch(mapCoverView);
            // this.initInfo(mapCoverView);

        },

        initBuildingButton: function() {
            var btn = new BuildingButton({
                locModel: this.locModel,
                containerDiv: 'map-container'
            }, null);
            btn.startup();
        },

        initFloorPicker: function() {
            var floorPicker = new FloorPicker({
                locModel: this.locModel,
                containerDiv: 'map-container'
            });
            floorPicker.startup();
            app.fp = floorPicker;
        },

        initOverviewMap: function() {
            var overviewMap = new OverviewMap({
                map: this.map,
                config: config.overviewMap,
                mapServiceUrl: config.dataLayer.mapServiceUrl
            });
            overviewMap.startup();
        },

        initLoader: function() {
            var loading = new LoadIndicator({
                containerDiv: 'map-container'
            });
            loading.startup();
        },

        initBMG: function(mobileView) {
            var bmgView = new MapButtonPanelView({
                config: config.layout,
                buttonTitle: 'Change Basemap',
                iconClass: 'fa-image',
                id: 'bmgView',
                toggleDiv: 'map-buttons-horizontal',
                panelDiv: 'map-panels-horizontal',
                mobileView: mobileView
            });
            bmgView.startup();

            var bmg = new CustomBMG({
                map: this.map,
                config: config.basemapGallery,
                id: 'bmg'
            }, bmgView.replaceDiv);
            bmg.startup();

        },

        initLegend: function(mobileView) {
            var legendView = new MapButtonPanelView({
                config: config.layout,
                buttonTitle: 'Show Legend',
                iconClass: 'fa-th-list',
                id: 'legendView',
                toggleDiv: 'map-buttons-horizontal',
                panelDiv: 'map-panels-horizontal',
                mobileView: mobileView
            });
            legendView.startup();

            // TODO: make legend work with feature layers
            var legend = new CustomLegend({
                map: this.map,
                dataConfig: config.dataLayer,
                locModel: this.locModel,
                id: 'legend'
            }, legendView.replaceDiv);
            legend.startup();
        },

        initBookmarks: function(mobileView) {
            var bookmarksView = new MapButtonPanelView({
                config: config.layout,
                buttonTitle: 'Change buildings',
                iconClass: 'fa-location-arrow',
                id: 'bookmarksView',
                toggleDiv: 'map-buttons-horizontal',
                panelDiv: 'map-panels-horizontal',
                mobileView: mobileView
            });
            bookmarksView.startup();

            var bookmarks = new Bookmarks({
                map: this.map,
                dataConfig: config.dataLayer,
                locModel: this.locModel,
                id: 'bookmarks'
            }, bookmarksView.replaceDiv);
            bookmarks.startup();
            if (!this.locModel.building) {
                bookmarksView.mapToggle.click();
            }

        },

        initSearch: function(mobileView) {
            var searchView = new MapButtonPanelView({
                config: config.layout,
                buttonTitle: 'Search for Rooms and People',
                iconClass: 'fa-search',
                id: 'searchView',
                toggleDiv: 'map-buttons-horizontal',
                panelDiv: 'map-panels-horizontal',
                mobileView: mobileView
            });
            searchView.startup();

            var search = new LayerSearch({
                dataConfig: config.dataLayer,
                id: 'layer-search',
                viewWidget: searchView
            }, searchView.replaceDiv);
            search.startup();
            app.globalSearch = search;
        },

        initInfo: function(mobileView) {
            var infoView = new MapButtonPanelView({
                config: config.layout,
                buttonTitle: 'More Info',
                iconClass: 'fa-info',
                id: 'infoView',
                toggleDiv: 'map-buttons-horizontal',
                panelDiv: 'map-panels-horizontal',
                mobileView: mobileView
            });
            infoView.startup();
        }
    };
});
},
// Source: js/app/controllers/DynamicLayerController.js
'app/controllers/DynamicLayerController': function() {
/*jslint ihateyou */
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
        nonFilterLayers: [],
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
                if (this.mapServiceLayer.loaded) {
                    this.setNonFilteredLayersVisible();
                } else {
                    dojoOn.once(this.mapServiceLayer, 'load', lang.hitch(this, this.setNonFilteredLayersVisible));
                }
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
                    if (lyrInfo.floorFilter) {
                        self.filterLayers.push({
                            layerNum: lyrInfo.layerNum,
                            filterFunction: function(bldg, flr) {
                                return lyrInfo.buildingField + ' = \'' + bldg + '\' AND ' + lyrInfo.floorField + ' = \'' + flr + '\'';
                            }
                        });
                    } else {
                        self.nonFilterLayers.push(lyrInfo.layerNum);
                    }
                }
            });
        },

        setAllLayersVisible: function() {
            console.debug('setAllLayersVisible');
            this.mapServiceLayer.setVisibleLayers(this.allLayers);
        },

        setNonFilteredLayersVisible: function() {
            console.debug('setNonFilteredLayersVisible');
            this.mapServiceLayer.setVisibleLayers(this.nonFilterLayers);
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
},
// Source: js/app/controllers/FeatureLayerController.js
'app/controllers/FeatureLayerController': function() {
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
},
// Source: js/app/controllers/MapController.js
'app/controllers/MapController': function() {
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
},
// Source: js/app/controllers/QueryController.js
'app/controllers/QueryController': function() {

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/on',

    'esri/layers/FeatureLayer',

    'app/util/queryUtil'],

function(declare, lang, topic, dojoOn,
    FeatureLayer,
    queryUtil) {

    return declare([], {

        locModel: null,
        dataConfig: null,
        currentQueryResults: {},

        constructor: function(options) {
            this.setClassProperties(options);
            this.attachEventListeners();
            if (this.locModel.building) {
                this.runBuildingQuery({building: this.locModel.building, floor: this.locModel.floor});
            }

        },

        setClassProperties: function(options) {
            this.locModel = options.locModel;
            // more used objects in config
            this.buildingLyrInfo = options.dataConfig.buildingLayerInfo;
            this.floorLyrInfo = options.dataConfig.floorLayerInfo;
            this.roomLyrInfo = options.dataConfig.roomLayerInfo;
            this.personQLyrInfo = options.dataConfig.personQueryLayerInfo;
            this.mapServiceUrl = options.dataConfig.mapServiceUrl;

            // save outfields for room and person query layers
            this.roomOutfields = this.computeLayerOutfields(this.roomLyrInfo);
            this.personOutfields = this.computeLayerOutfields(this.personQLyrInfo);

            // construct room and person query layers
            this.roomQLayer = new FeatureLayer(this.roomLyrInfo.url || this.mapServiceUrl + '/' + this.roomLyrInfo.layerNum, {
                outFields: this.roomOutfields
            });
            this.personQLayer = new FeatureLayer(this.personQLyrInfo.url || this.mapServiceUrl + '/' + this.personQLyrInfo.layerNum, {
                outFields: this.personOutfields
            });

        },

        attachEventListeners: function() {
            topic.subscribe('map-click', lang.hitch(this, this.runMapClickQuery));
            topic.subscribe('search-select-oid', lang.hitch(this, this.runOIDQuery));
            this.locModel.on('locModel-findBldgExtent', lang.hitch(this, this.runBuildingQuery));
        },

        computeLayerOutfields: function(lyrInfo) {
            return _.chain(lyrInfo.popupFields)
                    .map(function(obj) {return obj.fieldName;})
                    .union([lyrInfo.oidField])
                    .union(lyrInfo.popupTitleField)
                    .value();
        },

        // find building geometry given building name
        runBuildingQuery: function(argObj) {
            console.debug('runBuildingQuery');
            this.clearCurrentQueryResults();

            this.currentQueryResults.building = argObj.building;
            this.currentQueryResults.floor = argObj.floor || null;
            this.currentQueryResults.silentFlag = argObj.silentFlag || false;

            queryUtil.createAndRun({
                query: {
                    outFields: [this.buildingLyrInfo.buildingField],
                    returnGeometry: true,
                    where: queryUtil.constructWhereAnd([{
                        fieldName: this.buildingLyrInfo.buildingField,
                        newValue: this.currentQueryResults.building
                    }])
                },
                url: this.buildingLyrInfo.url || this.mapServiceUrl + '/' + this.buildingLyrInfo.layerNum,
                self: this,
                callback: this.buildingQueryResponseHandler
            });
        },

        buildingQueryResponseHandler: function(response) {
            console.debug('buildingQueryResponseHandler');
            if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response)) {
                this.clearCurrentQueryResults();
                topic.publish('query-done');
                return;
            }

            if (!queryUtil.checkSingleFeature(response)) {
                console.warn('more than one building found. using the first one');
            }

            this.currentQueryResults.bldgExtent = response.features[0].geometry.getExtent();
            this.runFloorQuery();
        },

        runMapClickQuery: function(mapEvt) {
            console.debug('runMapClickQuery');
            this.clearCurrentQueryResults();

            queryUtil.createAndRun({
                query: {
                    outFields: [this.buildingLyrInfo.buildingField],
                    geometry: mapEvt.mapPoint,
                    returnGeometry: true
                },
                url: this.buildingLyrInfo.url || this.mapServiceUrl + '/' + this.buildingLyrInfo.layerNum,
                self: this,
                callback: this.mapClickResponseHandler,
                callbackArgs: mapEvt.mapPoint
            });

        },

        mapClickResponseHandler: function(mapClickPoint, response) {
            console.debug('mapClickResponseHandler');
            if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response) || !queryUtil.checkSingleFeature(response)) {
                this.clearCurrentQueryResults();
                topic.publish('query-done');
                return;
            }

            var feat = response.features[0];
            this.currentQueryResults.building = feat.attributes[this.buildingLyrInfo.buildingField];
            this.currentQueryResults.bldgExtent = feat.geometry.getExtent();

            // did we click within the same building that's already selected?
            if (this.currentQueryResults.building === this.locModel.building) {
                this.runRoomQuery(mapClickPoint);
            } else {
                this.runFloorQuery();
            }
        },

        runFloorQuery: function() {
            console.debug('runFloorQuery');

            queryUtil.createAndRun({
                query: {
                    outFields: [this.floorLyrInfo.buildingField, this.floorLyrInfo.floorField],
                    where: queryUtil.constructWhereAnd([{
                        fieldName: this.floorLyrInfo.buildingField,
                        newValue: this.currentQueryResults.building
                    }]),
                    returnGeometry: false
                },
                url: this.floorLyrInfo.url || this.mapServiceUrl + '/' + this.floorLyrInfo.layerNum,
                self: this,
                callback: this.floorQueryResponseHandler
            });
        },

        floorQueryResponseHandler: function(response) {
            console.debug('floorQueryResponseHandler');
            topic.publish('query-done'); // end of the line for queries, even if things go wrong.
            if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response)) {
                this.clearCurrentQueryResults();
                return;
            }

            var floorField = this.floorLyrInfo.floorField;
            this.currentQueryResults.availFloors = _.map(response.features, function(feat) {
                return feat.attributes[floorField];
            });

            if (!this.currentQueryResults.floor) {
                var newFloor = _.min(this.currentQueryResults.availFloors);
                newFloor = (newFloor === Infinity) ? this.currentQueryResults.availFloors[0] : newFloor;
                this.currentQueryResults.floor = newFloor;
            }

            if (this.currentQueryResults.building === this.locModel.building) {
                this.currentQueryResults = _.omit(this.currentQueryResults, 'building');
                if (this.currentQueryResults.floor === this.locModel.floor) {
                    this.currentQueryResults = _.omit(this.currentQueryResults, 'floor');
                }
            }

            if (this.currentQueryResults.silentFlag) {
                this.locModel.silentSet(_.omit(this.currentQueryResults, 'silentFlag'));
            } else {
                this.locModel.set(_.omit(this.currentQueryResults, 'silentFlag'));
            }
        },

        runRoomQuery: function(mapClickPoint) {
            console.debug('runRoomQuery');
            queryUtil.createAndRun({
                query: {
                    outFields: this.roomOutfields,
                    geometry: mapClickPoint,
                    returnGeometry: true,
                    where: queryUtil.constructWhereAnd([{
                        fieldName: this.roomLyrInfo.buildingField,
                        newValue: this.locModel.building
                    }, {
                        fieldName: this.roomLyrInfo.floorField,
                        newValue: this.locModel.floor
                    }])
                },
                url: this.roomLyrInfo.url || this.mapServiceUrl + '/' + this.roomLyrInfo.layerNum,
                self: this,
                callback: this.roomQueryResponseHandler,
                callbackArgs: {centerMap: false}
            });
        },

        runRoomFromRoomIDQuery: function(roomId) {
            console.debug('runRoomFromRoomIDQuery', roomId);
            queryUtil.createAndRun({
                query: {
                    outFields: _.union(this.roomOutfields, [this.roomLyrInfo.buildingField, this.roomLyrInfo.floorField]),
                    returnGeometry: true,
                    where: queryUtil.constructWhereAnd([{
                        fieldName: 'UPPER(' + this.roomLyrInfo.roomField + ')',
                        newValue: roomId.toUpperCase()
                    }])
                },
                url: this.roomLyrInfo.url || this.mapServiceUrl + '/' + this.roomLyrInfo.layerNum,
                self: this,
                callback: this.roomQueryResponseHandler,
                callbackArgs: {centerMap: true, setCurrentQueryResults: true}
            });
        },


        roomQueryResponseHandler: function(params, response) {
            console.debug('roomQueryResponseHandler');
            if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response)) {

                this.clearCurrentQueryResults();
                topic.publish('query-done'); // end of the line. no more queries from here.
                return;
            }
            if (!queryUtil.checkSingleFeature(response)) {
                console.warn('more than one room found, so choosing the first one...');
            }

            var roomFeature = response.features[0];

            if (params.setCurrentQueryResults) {
                this.currentQueryResults = {
                    building: roomFeature.attributes[this.roomLyrInfo.buildingField],
                    floor: roomFeature.attributes[this.roomLyrInfo.floorField],
                    silentFlag: true
                };
                this.runBuildingQuery(this.currentQueryResults);
            }

            roomFeature.centerMap = params.centerMap; // eh, this is a little hacky...

            this.runRoomRelatedQuery(roomFeature);
        },

        runRoomRelatedQuery: function(roomFeature) {
            queryUtil.createAndRunRelated({
                rq: {
                    outFields: this.personOutfields,
                    returnGeometry: false,
                    relationshipId: this.personQLyrInfo.relationshipId,
                    objectIds: [roomFeature.attributes[this.roomLyrInfo.oidField]],
                },
                self: this,
                layerToQuery: this.roomQLayer,
                callback: this.roomRelatedQueryResponseHandler,
                callbackArgs: roomFeature
            });
        },

        roomRelatedQueryResponseHandler: function(roomFeature, peopleResponse) {
            topic.publish('query-done'); // end of the line. no more queries from here.
            var roomFeatureOID = roomFeature.attributes[this.roomLyrInfo.oidField];
            console.debug('roomRelatedQueryResponseHandler.');

            var relatedPeople, personAttrs;
            // walker to find actual related people
            if ((relatedPeople = peopleResponse[roomFeatureOID]) && (relatedPeople = relatedPeople.features)) {
                if (relatedPeople.length > 1) {
                    personAttrs = this.consolidateAttributes(relatedPeople);
                } else {
                    personAttrs = relatedPeople[0].attributes;
                }
            }

            topic.publish('feature-find', {
                roomAttr: roomFeature.attributes,
                roomGeom: roomFeature.geometry,
                centerMap: roomFeature.centerMap,
                personAttr: personAttrs
            });

        },

        runPersonRelatedQuery: function(personFeature) {
            queryUtil.createAndRunRelated({
                rq: {
                    outFields: _.union(this.roomOutfields, [this.roomLyrInfo.buildingField, this.roomLyrInfo.floorField]),
                    returnGeometry: true,
                    relationshipId: this.personQLyrInfo.relationshipId,
                    objectIds: [personFeature.attributes[this.personQLyrInfo.oidField]],
                },
                self: this,
                layerToQuery: this.personQLayer,
                callback: this.personRelatedQueryResponseHandler,
                callbackArgs: personFeature
            });
        },

        personRelatedQueryResponseHandler: function(personFeature, roomResponse) {
            topic.publish('query-done'); // end of the line. no more queries from here.
            var personFeatureOID = personFeature.attributes[this.personQLyrInfo.oidField];

            var relatedRooms;
            // walker to find actual related people
            if (!(relatedRooms = roomResponse[personFeatureOID]) || !(relatedRooms = relatedRooms.features)) {
                console.warn('no related room');
                topic.publish('feature-find', {
                    personAttr: personFeature.attributes
                });
                this.locModel.silentSet({
                    building: null,
                    floor: null,
                    availFloors: [],
                    bldgExtent: null
                });
                return;
            }
            if (relatedRooms.length > 1) {
                console.warn('more than one related room.');
            }

            var roomFeature = relatedRooms[0];
            roomFeature.centerMap = true;

            this.currentQueryResults = {
                building: roomFeature.attributes[this.roomLyrInfo.buildingField],
                floor: roomFeature.attributes[this.roomLyrInfo.floorField],
                silentFlag: true
            };

            this.locModel.silentSet(this.currentQueryResults);

            this.runBuildingQuery(this.currentQueryResults);

            topic.publish('feature-find', {
                roomAttr: roomFeature.attributes,
                roomGeom: roomFeature.geometry,
                centerMap: true,
                personAttr: personFeature.attributes
            });

        },

        runOIDQuery: function(oidArgs) {
            switch (oidArgs.lyr) {
                case 'room':
                    this.runRoomOIDQuery(oidArgs.oid);
                    break;
                case 'person':
                    this.runPersonOIDQuery(oidArgs.oid);
                    break;
                default:
                    console.warn('runOIDQuery type fell through', arguments);
            }
        },

        runRoomOIDQuery: function(oid) {

            queryUtil.createAndRun({
                query: {
                    outFields: _.union(this.roomOutfields, [this.roomLyrInfo.buildingField, this.roomLyrInfo.floorField]),
                    returnGeometry: true,
                    objectIds: [oid]
                },
                url: this.roomLyrInfo.url || this.mapServiceUrl + '/' + this.roomLyrInfo.layerNum,
                self: this,
                callback: this.roomOIDQueryResponseHandler,
                callbackArgs: {centerMap: true}
            });

        },

        roomOIDQueryResponseHandler: function(params, response) {
            console.debug('roomOIDQueryResponseHandler');
            if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response) || !queryUtil.checkSingleFeature(response)) {
                this.clearCurrentQueryResults();
                topic.publish('query-done'); // end of the line. no more queries from here.
                return;
            }

            var roomFeature = response.features[0];

            this.currentQueryResults = {
                building: roomFeature.attributes[this.roomLyrInfo.buildingField],
                floor: roomFeature.attributes[this.roomLyrInfo.floorField],
                silentFlag: true
            };

            if (this.currentQueryResults.building !== this.locModel.building) {
                this.runBuildingQuery(this.currentQueryResults);
            } else {
                this.locModel.silentSet(this.currentQueryResults);
            }

            roomFeature.centerMap = params.centerMap; // eh, this is a little hacky...

            this.runRoomRelatedQuery(roomFeature);

        },

        runPersonOIDQuery: function(oid) {

            queryUtil.createAndRun({
                query: {
                    outFields: this.personOutfields,
                    objectIds: [oid]
                },
                url: this.personQLayer.url || this.mapServiceUrl + '/' + this.personQLayer.layerNum,
                self: this,
                callback: this.personOIDQueryResponseHandler
            });

        },

        personOIDQueryResponseHandler: function(response) {
            console.debug('personOIDQueryResponseHandler', response);
            if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response) || !queryUtil.checkSingleFeature(response)) {
                this.clearCurrentQueryResults();
                topic.publish('query-done'); // end of the line. no more queries from here.
                return;
            }
            var personFeature = response.features[0];

            this.runPersonRelatedQuery(personFeature);
        },

        consolidateAttributes: function(featureArr) {
            var returnAttrs = {};
            _.each(featureArr, function(feat) {
                _.each(feat.attributes, function(attrValue, attrKey) {
                    returnAttrs[attrKey] = returnAttrs[attrKey] || [];
                    returnAttrs[attrKey].push(attrValue);
                });
            });
            _.each(returnAttrs, function(attrArr, key, obj) {
                obj[key] = attrArr.join(',<br>');
            });
            return returnAttrs;
        },


        clearCurrentQueryResults: function() {
            this.currentQueryResults = {};
        }

    });
});
},
// Source: js/app/controllers/ResultsLayerController.js
'app/controllers/ResultsLayerController': function() {
/* global console */

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/topic',
    'dojo/on',

    'dojo/dom-construct',
    'dojo/dom-class',

    'dijit/layout/ContentPane',
    'dijit/registry',

    'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/dijit/Popup',
    'esri/dijit/PopupMobile',
    'esri/dijit/PopupTemplate',

    'config/layoutConfig',

    'app/util/symbolUtil',
    'dojo/text!app/views/templates/PopupView.html'],


function(declare, lang, dojoQuery, topic, dojoOn,
    domConstruct, domClass,
    ContentPane, registry,
    Graphic, GraphicsLayer, Popup, PopupMobile, PopupTemplate,
    layoutConfig,
    symbolUtil, thisPopupTemplate) {

    return declare([], {

        map: null,
        popupInfo: {}, // storage
        dataConfig: null,
        symbolConfig: null,
        mobileLayout: false, // start assuming desktop/panel layout
        popupTimer: setTimeout(function() {}, 100),

        constructor: function(options) {
            this.setClassProperties(options);
            this.addLayers();
            this.attachEventListeners();
        },

        setClassProperties: function(options) {
            this.map = options.map;
            this.symbolConfig = options.symbolConfig;
            this.dataConfig = options.dataConfig;
            this.personQLyrInfo = options.dataConfig.personQueryLayerInfo;
            this.roomLyrInfo = options.dataConfig.roomLayerInfo;

            // set up some other things...
            this.createInfoTemplates();
            this.setUpInfoWindow(options.popupWrapper);
        },

        addLayers: function() {
            this.resultsLayer = this.map.addLayer(new GraphicsLayer({id: 'resultGraphicsLayer'}));
            this.resultsLayer.setInfoTemplate(this.popupInfo.popupTemplate);
        },

        attachEventListeners: function() {
            var self = this;
            topic.subscribe('feature-find', lang.hitch(this, this.featureFindHandler));

            topic.subscribe('map-center-complete', function(params) {
                console.debug('map-center-complete from resultsLayer', params);
                self.map.infoWindow.show(params.centerPoint);
            });
            topic.subscribe('dynamiclayer-defexpr-update', function(params) {
                if (!params.silent) {
                    self.hidePopupsAndClearResults();
                }
            });
            topic.subscribe('window-resize', lang.hitch(this, this.responsiveLayout));
        },

        /**
         * Create the infotemplate for the map service layer
         * @return { N/A }
         */
        createInfoTemplates: function() {
            // to not clutter up the config with "visible: true" for all the popup fields, add it here.
            this.popupInfo.allFields = _.map(this.roomLyrInfo.popupFields.concat(this.personQLyrInfo.popupFields), function(obj) {
                return _.extend(obj, {visible: true});
            });

            this.popupInfo.formatFields = _.filter(this.roomLyrInfo.popupFields.concat(this.personQLyrInfo.popupFields), function(obj) {
                return obj.formatter;
            });


            this.popupInfo.popupTemplate = new PopupTemplate({
                title: 'Placeholder title',
                fieldInfos: this.popupInfo.allFields.push({fieldName: 'ROOMNOTFOUND', label: 'Room', visible: true})
            });

            this.popupInfo.popupTitleArr = this.roomLyrInfo.popupTitlePriority ?
                    this.roomLyrInfo.popupTitleField.concat(this.personQLyrInfo.popupTitleField) :
                    this.personQLyrInfo.popupTitleField.concat(this.roomLyrInfo.popupTitleField);
        },

        /**
         * Change the attributes shown in the popup based on the available data
         * (Filter out blank data)
         * @param  {array} attrs feature attributes
         * @return { N/A }
         */
        modifyPopupTemplate: function(attrs) {
            var infoFields = _.filter(this.popupInfo.allFields, function(fieldInfo) {
                return attrs[fieldInfo.fieldName] !== null && attrs[fieldInfo.fieldName] !== undefined;
            });
            this.popupInfo.popupTemplate.info.fieldInfos = infoFields;

            _.each(this.popupInfo.formatFields, function(fieldInfo) {
                if (attrs[fieldInfo.fieldName]) {
                    attrs[fieldInfo.fieldName] = fieldInfo.formatter(attrs[fieldInfo.fieldName]);
                }
            });

            // title
            var self = this;
            _.some(this.popupInfo.popupTitleArr, function(field) {
                // yes, i mean this to be ==. (false + 0 == false) is true, while null + 0 and undef + 0 != their original
                /* jshint eqeqeq: false */
                if (attrs[field] || attrs[field] + 0 == attrs[field]) {
                    self.popupInfo.popupTemplate.info.title = attrs[field];
                    return true;
                }
                return false;
            });

            if (!this.popupInfo.popupTemplate.info.title) {
                this.popupInfo.popupTemplate.info.title = '(no title)';
            }
            domClass.toggle(this.popupInfo.mobileTitle, 'multi', this.popupInfo.popupTemplate.info.title.indexOf('<br>') >= 0);
        },

        featureFindHandler: function(featureInfo) {
            this.resultsLayer.clear();
            if (!featureInfo.roomAttr) {
                featureInfo.roomAttr = { ROOMNOTFOUND: 'Not Found'};
            }
            var consolidatedAttrs = _.extend(featureInfo.roomAttr, featureInfo.personAttr);
            // set infotemplate fields based on what isn't null on the feature
            this.modifyPopupTemplate(consolidatedAttrs);

            // set infowindow
            var roomGraphicsArr = [this.addRoomGraphic(consolidatedAttrs, featureInfo.roomGeom)];
            this.map.infoWindow.setFeatures(roomGraphicsArr);

            var popupAnchor = featureInfo.anchorGeom || (featureInfo.roomGeom ? featureInfo.roomGeom.getExtent().getCenter() : null);
            domClass.toggle(this.map.infoWindow.domNode, 'no-anchor', !popupAnchor);

            if (featureInfo.centerMap && popupAnchor) {
                topic.publish('map-center', popupAnchor);
            } else {
                this.map.infoWindow.show(popupAnchor);
            }

        },

        setUpInfoWindow: function(popupWrapper) {

            domConstruct.place(thisPopupTemplate, popupWrapper);
            dojoOn(dojoQuery('.close', popupWrapper)[0], 'click', lang.hitch(this, this.hidePopupsAndClearResults));

            // the popup NEEDS to be in a content pane.
            var popupPane = new ContentPane({id: 'resultsPopup'}, 'popup-pane');
            popupPane.startup();

            var mapPopup = this.map.infoWindow;
            var mobilePopup = new PopupMobile(null, domConstruct.create('div'));
            this.popupInfo.popups = {
                original: mapPopup,
                mobile: mobilePopup
            };
            this.popupInfo.mobileTitle = dojoQuery('.title', mobilePopup.domNode)[0];
            mapPopup.set('popupWindow', false);

            this.popupInfo.fillSymbol = symbolUtil.createSFSFromObject(this.symbolConfig);
            this.map.infoWindow.fillSymbol = this.popupInfo.fillSymbol;

            // listeners for popup events, which will take popup content and put it into the sidepane.
            mapPopup.on('set-features', lang.partial(this.genericPopupSelectFeatures, this, popupPane));
            mapPopup.on('clear-features', lang.partial(this.onPopupClearFeatures, this, popupWrapper));
            mobilePopup.on('set-features', lang.partial(this.genericPopupSelectFeatures, this));

        },

        genericPopupSelectFeatures: function(self, popupWrapper) {
            var popup = this;
            clearTimeout(self.popupTimer);
            if (popupWrapper && popupWrapper.id === 'resultsPopup') {
                popupWrapper = popupWrapper.domNode.parentElement;
            }
            self.popupTimer = setTimeout(function() {
                if (popupWrapper) {
                    self.onPopupSelectFeatures(popup.getSelectedFeature(), popupWrapper);
                }
            });
        },

        onPopupSelectFeatures: function(feat, popupWrapper) {
            registry.byId('resultsPopup').set('content', feat.getContent());
            this.reformatLinks();
            this.showPopupParent(feat, popupWrapper);
            if (this.map.graphics.graphics.length <= 0) {
                    return;
            }
            // TODO: what if popup pane blocks the selected room? we should
            // move the map a little so that it's visible.
            /*var grGeom = this.map.graphics.graphics[0].getNode().getBoundingClientRect();
            var popupGeom = popupParent.getBoundingClientRect();*/
        },

        onPopupClearFeatures: function(self, popupWrapper) {
            clearTimeout(self.popupTimer);
            self.popupTimer = setTimeout(function() {
                registry.byId('resultsPopup').set('content', null);

                if (!domClass.contains(popupWrapper, 'hide')) {
                    self.hidePopupParent(popupWrapper);
                }
            }, 400);
        },

        hidePopupParent: function(popupWrapper) {
            this.resultsLayer.clear();
            domClass.add(popupWrapper, 'hide');
        },

        showPopupParent: function(feat, popupWrapper) {
            domClass.remove(popupWrapper, 'hide');
        },

        addRoomGraphic: function(attr, geom) {
            var roomGraphic = new Graphic(geom, null, attr);
            this.resultsLayer.add(roomGraphic);
            return roomGraphic;
        },

        reformatLinks: function() {
            var popupLinks = dojoQuery('.esriViewPopup a');
            console.debug('finding links');
            _.each(popupLinks, function(lnk) {
                var thisHref = lnk.getAttribute('href');
                if (thisHref.substring(0, 7) === 'mailto:' || thisHref.substring(0, 4) === 'tel:') {
                    lnk.removeAttribute('target');
                }
            });
        },

        hidePopupsAndClearResults: function() {
            this.hideOriginalPopup();
            this.hideMobilePopup();
            this.resultsLayer.clear();
        },

        hideOriginalPopup: function() {
            this.popupInfo.popups.original.hide();
            this.popupInfo.popups.original.clearFeatures();
        },

        hideMobilePopup: function() {
            dojoQuery('.esriMobileNavigationBar').style('display', 'none');
            dojoQuery('.esriMobilePopupInfoView').style('display', 'none');
            this.popupInfo.popups.mobile.hide();
            this.popupInfo.popups.mobile.clearFeatures();
        },

        responsiveLayout: function(windowSize) {
            if (windowSize.h < layoutConfig.breakHeight2 || windowSize.w < layoutConfig.breakWidth1) {
                if (!this.mobileLayout) {
                    this.hidePopupsAndClearResults();
                    this.map.setInfoWindow(this.popupInfo.popups.mobile);
                    // yes, this has to happen every time we switch popups.
                    this.map.infoWindow.fillSymbol = this.popupInfo.fillSymbol;
                    this.mobileLayout = true;
                }
            } else {
                if (this.mobileLayout) {
                    this.hidePopupsAndClearResults();
                    this.map.setInfoWindow(this.popupInfo.popups.original);
                    // yes, this has to happen every time we switch popups.
                    this.map.infoWindow.fillSymbol = this.popupInfo.fillSymbol;
                    this.mobileLayout = false;
                }
            }
        }

    });
});
},
// Source: js/app/controllers/WebmapLayerController.js
'app/controllers/WebmapLayerController': function() {
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
},
// Source: js/app/models/LocationModel.js
'app/models/LocationModel': function() {
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
},
// Source: js/app/util/queryUtil.js
'app/util/queryUtil': function() {
define([
    'dojo/_base/lang',
    'dojo/topic',

    'config/serverConfig',

    'esri/layers/FeatureLayer',

    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/RelationshipQuery'],

function(lang, topic,
    config,
    FeatureLayer,
    EsriQuery, QueryTask, RelationshipQuery) {
    return {

        createQuery: function(argObj) {
            var q = new EsriQuery();
            lang.mixin(q, argObj);
            return q;
        },

        createRelQuery: function(argObj) {
            var rq = new RelationshipQuery();
            lang.mixin(rq, argObj);
            return rq;
        },

        createAndRun: function(argObj) {
            argObj.query = this.createQuery(argObj.query);
            this.runQT(argObj);
        },

        createAndRunRelated: function(argObj) {
            argObj.rq = this.createRelQuery(argObj.rq);
            this.runRelated(argObj);
        },

        runQT: function(argObj) {
            topic.publish('query-start');
            var qt = new QueryTask(argObj.url);
            if (argObj.callbackArgs) {
                qt.execute(argObj.query,
                    lang.hitch(argObj.self, argObj.callback, argObj.callbackArgs),
                    this.genericErrback);
            } else {
                qt.execute(argObj.query,
                    lang.hitch(argObj.self, argObj.callback),
                    this.genericErrback);
            }
        },

        runRelated: function(argObj) {
            topic.publish('query-start');
            if (argObj.callbackArgs) {
                argObj.layerToQuery.queryRelatedFeatures(argObj.rq)
                    .then(lang.hitch(argObj.self, argObj.callback, argObj.callbackArgs),
                        this.genericErrback);
            } else {
                argObj.layerToQuery.queryRelatedFeatures(argObj.rq)
                    .then(lang.hitch(argObj.self, argObj.callback),
                        this.genericErrback);
            }

        },

        constructWhere: function(fieldValArr, joinStr) {
            var whereArr = _.map(fieldValArr, function(obj) {
                if (obj.newValue + 0 === obj.newValue) {
                    return obj.fieldName + ' = ' + obj.newValue;
                }
                return obj.fieldName + ' = \'' + obj.newValue + '\'';
            });
            // hack to fix a bug in server 10.1...
            whereArr.push(this.getDirtyStr());

            return whereArr.join(joinStr);

        },

        // TODO: this 'dirty' trick addresses a server bug and isn't
        // necessary except for AGS 10.1.
        getDirtyStr: function() {
            // hack to fix a bug in server 10.1...
            if (config.serverBug) {
                var dirty = (new Date()).getTime();
                return dirty + ' = ' + dirty;
            }
            return '';
        },

        constructWhereOr: function(fieldValArr) {
            return this.constructWhere(fieldValArr, ' OR ');
        },

        constructWhereAnd: function(fieldValArr) {
            return this.constructWhere(fieldValArr, ' AND ');
        },

        genericErrback: function(error) {
            topic.publish('query-done');
            console.error('Generic errback', error);
        },

        checkResponseSuccess: function(response) {
            if (response.error) {
                this.genericErrback(response.error);
                return false;
            }
            return true;
        },

        checkFeatureExistence: function(response) {
            if (!response.features || response.features.length <= 0) {
                console.debug('no features found', response);
                return false;
            }
            return true;
        },

        checkSingleFeature: function(response) {
            if (response.features.length !== 1) {
                console.debug('not a single feature', response);
                return false;
            }
            return true;
        }
    };
});
},
// Source: js/app/util/symbolUtil.js
'app/util/symbolUtil': function() {
define([
    'esri/renderers/SimpleRenderer',
    'esri/symbols/SimpleFillSymbol'
], function(SimpleRenderer, SFS) {

    return {

        createSFS: function(fillColor, lineColor, lineWidth) {
            return new SFS({
                type: 'esriSFS',
                style: 'esriSFSSolid',
                color: fillColor,
                outline: {
                    type: 'esriSLS',
                    style: 'esriSLSSolid',
                    color: lineColor,
                    width: lineWidth
                }
            });
        },

        createSFSFromObject: function(obj) {
            return this.createSFS(obj.fillColor, obj.lineColor, obj.lineWidth);
        },

        createSimpleRenderer: function(fillColor, lineColor, lineWidth) {
            return new SimpleRenderer({
                type: 'simple',
                symbol: {
                    color: fillColor,
                    type: 'esriSFS',
                    style: 'esriSFSSolid',
                    outline: {
                        color: lineColor,
                        width: lineWidth,
                        type: 'esriSLS',
                        style: 'esriSLSSolid'
                    }
                }
            });
        }
    };
});},
// Source: js/app/views/LayoutView.js
'app/views/LayoutView': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/dom-attr',
    'dojo/dom-style',
    'dojo/dom-class',

    'config/layoutConfig',

    // even though this isn't evented, still needed for full dijit lifecycle.
    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',


    'dojo/text!./templates/LayoutView.html'],

function(declare, lang, topic, domAttr, domStyle, domClass,
    layoutConfig,
    _EventedWidget, _TemplatedMixin,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {

        templateString: template,

        constructor: function() {
            this.inherited(arguments);
        },

        postCreate: function() {
            this.inherited(arguments);
            this.setupClassVars();
            this.attachEventListeners();
            domAttr.set(this.headerIcon, 'src', this.config.headerIconLarge);
            domStyle.set(this.headerTitle, 'left', this.config.headerIconLargeWidth + 20 + 'px');
            this.headerTitle.innerHTML = this.config.headerTitle;
        },

        startup: function() {
            this.inherited(arguments);
        },

        attachEventListeners: function() {
            this.attachWindowResize();
        },

        setupClassVars: function() {
            this.win = window;
            this.docEl = document.documentElement;
            this.docBody = document.getElementsByTagName('body')[0];
        },

        // throttle windowresize here and use publish/subscribe
        // for all the other widgets to hook into
        attachWindowResize: function() {
            // IE8 won't let a timer just be null, or have a null function.
            var windowResizeTimer = setTimeout(function() {}, 10);

            var self = this;

            if (window.addEventListener) {
                window.addEventListener('resize', function() {
                    clearTimeout(windowResizeTimer);
                    windowResizeTimer = setTimeout(lang.hitch(self, self.publishWindowSize), 500);
                });
            } else {
                window.attachEvent('onresize', function() {
                    clearTimeout(windowResizeTimer);
                    windowResizeTimer = setTimeout(lang.hitch(self, self.publishWindowSize), 500);
                });
            }

        },

        publishWindowSize: function() {
            var h = this.win.innerHeight|| this.docEl.clientHeight|| this.docBody.clientHeight;
            var w = this.win.innerWidth || this.docEl.clientWidth || this.docBody.clientWidth;
            console.debug('windowSize', h, w);
            this.onWindowResize({h: h, w: w});
            topic.publish('window-resize', {h: h, w: w});
        },

        onWindowResize: function(dims) {
            domClass.remove(this.headerTitle, 'small smaller smallest');
            if (dims.h <= layoutConfig.breakHeight2 || dims.w <= layoutConfig.breakWidth3) {
                domAttr.set(this.headerIcon, 'src', this.config.headerIconSmall);
                domStyle.set(this.headerTitle, 'left', this.config.headerIconSmallWidth + 20 + 'px');
            } else {
                domAttr.set(this.headerIcon, 'src', this.config.headerIconLarge);
                domStyle.set(this.headerTitle, 'left', this.config.headerIconLargeWidth + 20 + 'px');
            }

            if (this.headerTitle.scrollWidth > this.headerTitle.offsetWidth) {
                domClass.add(this.headerTitle, 'small');
                if (this.headerTitle.scrollWidth > this.headerTitle.offsetWidth) {
                    domClass.remove(this.headerTitle, 'small');
                    domClass.add(this.headerTitle, 'smaller');
                }
                    if (this.headerTitle.scrollWidth > this.headerTitle.offsetWidth) {
                        domClass.remove(this.headerTitle, 'smaller');
                        domClass.add(this.headerTitle, 'smallest');
                    }
            }

        }

    });
});
},
// Source: js/app/views/MapButtonPanelView.js
'app/views/MapButtonPanelView': function() {
define([
    'dojo/_base/declare',
    'dojo/topic',
    'dojo/query',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom',

    'config/layoutConfig',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./templates/MapButtonView.html',
    'dojo/text!./templates/MapPanelView.html'],

function(declare, topic, dojoQuery, lang, dojoOn, domConstruct, domClass, dom,
    layoutConfig,
    _EventedWidget, _TemplatedMixin,
    buttonTemplate, panelTemplate) {

    return declare([_EventedWidget, _TemplatedMixin], {

        iconClass: null,
        templateString: panelTemplate,
        mobileLayout: false, // start assuming desktop/panel layout

        constructor: function(options) {
            /* jshint unused: false */
            this.inherited(arguments);
        },

        postCreate: function() {
            this.domNode.id += '-panel';
            this.inherited(arguments);
            var templateOptions = {
                iconClass: this.iconClass,
                buttonTitle: this.buttonTitle,
                id: this.id + '-toggle'

            };
            var templated = lang.replace(buttonTemplate, templateOptions);
            this.mapToggle = domConstruct.place(templated, this.toggleDiv);
        },

        startup: function() {
            this.inherited(arguments);
            this.placeAt(this.panelDiv);
            this.attachEventListeners();
        },

        attachEventListeners: function() {
            var self = this;

            dojoOn(this.mapToggle, 'click', function() {
                // 'this' = self.mapToggle
                domClass.toggle(self.domNode, 'hide');
                domClass.toggle(this, 'highlight arrow-box');
                topic.publish('maptoggle-click', this);
                if (!domClass.contains(self.domNode, 'hide')) {
                    self.emit('mappanel-show');
                }
            });

            topic.subscribe('maptoggle-click', function(targetToggle) {
                if (targetToggle === self.mapToggle) {
                    return;
                }
                self.hideSelf();
            });
            topic.subscribe('window-resize', lang.hitch(this, this.responsiveLayout));
            topic.subscribe('mapcover-close', lang.hitch(this, this.hideSelf));

        },

        hideSelf: function() {
            domClass.add(this.domNode, 'hide');
            domClass.remove(this.mapToggle, 'highlight arrow-box');
        },

        responsiveLayout: function(windowSize) {
            if ((windowSize.h < layoutConfig.breakHeight2 || windowSize.w < layoutConfig.breakWidth1)) {
                if (!this.mobileLayout) {
                    this.placeAt(this.mobileView);
                    domClass.add(this.mapToggle, 'mobile-view');
                    this.mobileLayout = true;
                }
            } else {
                if (this.mobileLayout) {
                    this.placeAt(this.panelDiv);
                    domClass.remove(this.mapToggle, 'mobile-view');
                    this.mobileLayout = false;
                }
            }
        }
    });
});
},
// Source: js/app/views/MapCoverView.js
'app/views/MapCoverView': function() {
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
},
// Source: js/widgets/basemapgallery/BasemapGallery.js
'widgets/basemapgallery/BasemapGallery': function() {
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
                portalUrl: options.config.portalUrl,
                map: options.map,
                basemaps: this.createCustomBasemaps(options.config.customBasemaps),
                id: options.id,
            }, viewElement);
            this.attachEventListeners(bmg, options);
            bmg.startup();
        },

        startup: function() {
        },

        attachEventListeners: function(bmg, options) {
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
},
// Source: js/widgets/bookmarks/BookmarksController.js
'widgets/bookmarks/BookmarksController': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',

    'app/util/queryUtil',

    './BookmarksView'],

function(declare, lang, topic,
    queryUtil,
    BookmarksView) {

    return declare([], {

        locModel: null,
        bldgStorage: {},

        constructor: function(options, viewElement) {
            this.dataConfig = options.dataConfig;
            this.locModel = options.locModel;
            this.buildingLyrInfo = options.dataConfig.buildingLayerInfo;
            this.postCreate(options, viewElement);
        },

        // this does not happen automatically.
        postCreate: function(options, viewElement) {
            this.navView = new BookmarksView({id: options.id}, viewElement);
            this.navView.startup();
        },

        startup: function() {
            this.getAllBuildingNames();
        },

        attachEventListeners: function() {
            var self = this;
            this.locModel.on('building-update', function(dijitEvt) {
                console.debug('navController heard locModel buildingUpdate');
                self.navView.updateSelectedBuilding(dijitEvt.target.building);
            });
            this.navView.on('bldg-change', function(newBuilding) {
                topic.publish('function-finished');
                console.debug('navController setting building', newBuilding);
                if (self.locModel.building === newBuilding) {
                    return;
                }
                self.locModel.set({
                    building: newBuilding,
                    floor: null,
                    bldgExtent: null
                });
            });
        },

        getAllBuildingNames: function() {
            queryUtil.createAndRun({
                query: {
                    outFields: [this.buildingLyrInfo.buildingField, this.buildingLyrInfo.labelField],
                    returnGeometry: false,
                    // seems like we should just be able to do 1=1 here, but the server bug requires that we run it through queryUtil's construct instead.
                    where: queryUtil.constructWhereAnd([{
                        fieldName: 1,
                        newValue: 1
                    }])
                },
                url: this.dataConfig.buildingLayerInfo.url || this.dataConfig.mapServiceUrl + '/' + this.dataConfig.buildingLayerInfo.layerNum,
                self: this,
                callback: this.allBuildingsResponseHandler
            });
        },

        allBuildingsResponseHandler: function(response) {
            this.getAllFloors(response.features);
        },

        // can't just take all the buildings, since some don't have floors,
        // and we don't want to show blank buildings in the bookmarks.
        getAllFloors: function(buildingFeatures) {
            queryUtil.createAndRun({
                query: {
                    outFields: [this.dataConfig.floorLayerInfo.buildingField],
                    returnGeometry: false,
                    where: queryUtil.constructWhereAnd([{
                        fieldName: 1,
                        newValue: 1
                    }])
                },
                url: this.dataConfig.floorLayerInfo.url || this.dataConfig.mapServiceUrl + '/' + this.dataConfig.floorLayerInfo.layerNum,
                self: this,
                callback: this.allFloorsResponseHandler,
                callbackArgs: buildingFeatures
            });
        },

        allFloorsResponseHandler: function(buildingFeatures, response) {
            var self = this;
            // list the buildings that actually have floors.
            var buildingsWithFloors = _.chain(response.features)
                .map(function(floorFeat) {
                    return floorFeat.attributes[self.dataConfig.floorLayerInfo.buildingField];
                })
                .uniq()
                .value();
            // store the buildings and their labels that have floors.
            var buildingArr = _.chain(buildingFeatures)
                .filter(function(feat) {
                    return _.contains(buildingsWithFloors, feat.attributes[self.buildingLyrInfo.buildingField]);
                })
                .map(function(feat) {
                    return {
                        value: feat.attributes[self.buildingLyrInfo.buildingField],
                        label: feat.attributes[self.buildingLyrInfo.labelField]
                    };
                })
                .sortBy(function(obj) {
                    return obj.label.replace(/\d+\s+/g, '');
                })
                .value();

            this.attachEventListeners();
            this.navView.constructBuildingDropdown(buildingArr);
            this.navView.updateSelectedBuilding(this.locModel.building);
        }

    });
});},
// Source: js/widgets/bookmarks/BookmarksView.js
'widgets/bookmarks/BookmarksView': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dom-attr',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./BookmarksView.html'],

function(declare, lang, dojoOn, domConstruct, domAttr,
    _EventedWidget, _TemplatedMixin,
    template) {
    /* jshint unused: false */
    return declare([_EventedWidget, _TemplatedMixin], {

        templateString: template,

        constructor: function(options) {
            this.inherited(arguments);
        },

        postCreate: function() {
            this.inherited(arguments);
        },

        startup: function() {
            this.inherited(arguments);
            this.attachListeners();
        },

        attachListeners: function() {
            // when the building dropdown changes
            dojoOn(this.buildingDropdown, 'change', lang.partial(this.onSelectionChange, this));
        },

        onSelectionChange: function(self, evt) {
            console.debug('bookmarks onSelectionChange');
            // 'this' = dropdown of event.
            var selectedOption = this.options[this.selectedIndex];
            if (!selectedOption) {
                return;
            }
            self.emit('bldg-change', selectedOption.value);
        },

        createOption: function(targetDropdown, optionObj) {
            return domConstruct.create('option', {
                'value': optionObj.value,
                'label': optionObj.label || optionObj.value,
                'innerHTML': optionObj.label || optionObj.value
            }, targetDropdown);
        },

        constructBuildingDropdown: function(bldgArr) {
            _.each(bldgArr, lang.partial(this.createOption, this.buildingDropdown));
        },

        updateSelectedBuilding: function(building) {
            console.debug('updateSelectedBuilding');
            if (!building) {
                building = '';
            }
            var hasBuilding = _.some(this.buildingDropdown.options, function(opt) {
                return opt.value === building;
            });
            if (!hasBuilding) {
                return;
            }
            this.buildingDropdown.value = building;
        }

    });
});},
// Source: js/widgets/buildingbutton/BuildingButton.js
'widgets/buildingbutton/BuildingButton': function() {
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
},
// Source: js/widgets/floorpicker/FloorPicker.js
'widgets/floorpicker/FloorPicker': function() {
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
},
// Source: js/widgets/floorpicker/FloorPickerView.js
'widgets/floorpicker/FloorPickerView': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/query',
    'dojo/on',
    'dojo/NodeList-dom',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./FloorPickerView.html'],

function(declare, lang, domConstruct, domStyle, domClass, domAttr, dojoQuery, dojoOn, nld,
    _EventedWidget, _TemplatedMixin,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {

        templateString: template,
        baseClass: 'vertical',
        locModel: null,
        id: 'floorPicker',

        constructor: function() {
            this.inherited(arguments);
        },

        postCreate: function() {
            this.inherited(arguments);
        },

        startup: function() {
            this.inherited(arguments);
            this.placeAt(this.containerDiv);
            this.addEventListeners();
        },

        addEventListeners: function() {
            var fontSize = domStyle.get(this.scrollUp, 'font-size') || domStyle.get(this.scrollUp, 'fontSize');
            var buttonHeight = parseInt(fontSize, 10) * 2;
            dojoOn(this.scrollUp, 'click', lang.hitch(this, this.scrollAnimate, this.floorsDiv, buttonHeight, -1));
            dojoOn(this.scrollDown, 'click', lang.hitch(this, this.scrollAnimate, this.floorsDiv, buttonHeight, 1));
        },

        adjustScrollButtons: function() {
            /* no pretty things for you, ie8 */
            if (dojoQuery('.no-media-queries').length || this.locModel.availFloors.length <= 5) {
                return;
            }
            var topButton = dojoQuery('.btn', this.floorsDiv)[0];
            var bottomButton = dojoQuery('.btn:last-child', this.floorsDiv)[0];
            var floorsDivBB = this.floorsDiv.getBoundingClientRect();
            domClass.toggle(this.scrollUp, 'disabled', topButton && topButton.getBoundingClientRect().top >= floorsDivBB.top);
            domClass.toggle(this.scrollDown, 'disabled', bottomButton && bottomButton.getBoundingClientRect().bottom <= floorsDivBB.bottom);
        },

        scrollAnimate: function(targetDiv, scrollDiff, scrollInt) {
            // var scrollTopTarget = this.floorsDiv.scrollTop + scrollDiff * scrollInt;
            var intCount = 0;
            var self = this;
            var interval = setInterval(function() {
                intCount++;
                targetDiv.scrollTop += scrollInt;
                if (intCount >= scrollDiff) {
                    clearInterval(interval);
                    self.adjustScrollButtons();
                }
            }, 5);
        },

        adjustVisibility: function(newZoomLevel) {
            if (newZoomLevel < 17) {
                domClass.add(this.domNode, 'hide');
            } else {
                domClass.remove(this.domNode, 'hide');
                this.scrollHighlightedIntoView();
            }

        },

        constructUI: function() {
            var self = this;

            // clear existing picker
            domConstruct.empty(this.floorsDiv);

            if (this.locModel.availFloors.length > 5) {
                domClass.remove(this.scrollUp, 'hide disabled');
                domClass.remove(this.scrollDown, 'hide disabled');
                domClass.add(this.domNode, 'set-height');
            } else {
                domClass.add(this.scrollUp, 'hide');
                domClass.add(this.scrollDown, 'hide');
                domClass.remove(this.domNode, 'set-height');
            }

            // sort the available floors. they're just in the query return order.
            this.locModel.availFloors.sort(function(a, b) {
                var intA = parseInt(a, 10);
                var intB = parseInt(b, 10);

                // regular string compare if they're both not numbers,
                // or if they're both the same number.
                if ((isNaN(intA) && isNaN(intB)) || (intA === intB)) {
                    return (a < b) ? -1 : (a > b) ? 1 : 0;
                }
                // if only one is not a number, put that sooner in the array.
                // if they're both numbers, subtract.
                return (isNaN(intA)) ? -1 : isNaN(intB) ? 1 : (intA - intB);
            });

            // construct button for each floor
            _.each(this.locModel.availFloors, function(floorNum) {
                domConstruct.create('div', {
                    'class': 'btn',
                    'innerHTML': floorNum,
                    'data-floornum': floorNum,
                    'click': lang.hitch(self, self.floorButtonClick, floorNum)
                }, self.floorsDiv, 'first');
            });

            // can't rely on updateHighlightedFloor to be called after constructUI --
            // it often happens before or simulataneously -- so just call it again ourselves.
            this.updateHighlightedFloor();
        },

        updateHighlightedFloor: function() {
            var self = this;
            var theseButtons = dojoQuery('.btn', this.floorsDiv);
            // i hate you, dojoQuery. theseButtons.toggleClass doesn't work with a function so it won't toggle
            // classes separately on each btn, and domClass.toggle doesn't work with the results of a dojoQuery.
            _.each(theseButtons, function(btn) {
                domClass.toggle(btn, 'highlight', domAttr.get(btn, 'data-floornum') === self.locModel.floor);
            });
            this.scrollHighlightedIntoView();

        },

        scrollHighlightedIntoView: function() {
            if (this.locModel.availFloors.length <= 5) {
                return;
            }
            var highlightedFloorBtn = dojoQuery('.highlight', this.domNode)[0];
            if (highlightedFloorBtn) {
                if (highlightedFloorBtn.scrollIntoViewIfNeeded) {
                    highlightedFloorBtn.scrollIntoViewIfNeeded();
                } else if (highlightedFloorBtn.scrollIntoView) {
                    highlightedFloorBtn.scrollIntoView();
                } else {
                    console.warn('new highlighted floor not visible, but scrollintoview not available. do something!');
                }
            }
            this.adjustScrollButtons();
        },

        floorButtonClick: function(floorNum, evt) {
            /* jshint unused: false */
            if (floorNum === this.locModel.floor) {
                return;
            }
            this.locModel.set('floor', floorNum);
        }
    });
});
},
// Source: js/widgets/legend/LegendController.js
'widgets/legend/LegendController': function() {
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
},
// Source: js/widgets/loader/LoadIndicator.js
'widgets/loader/LoadIndicator': function() {
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
},
// Source: js/widgets/newlayersearch/NewLayerSearch.js
'widgets/newlayersearch/NewLayerSearch': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/promise/all',
    'dojo/topic',

    'esri/tasks/QueryTask',
    'app/util/queryUtil',

    './NewLayerSearchView'],

function(declare, lang, dojoAll, topic,
    QT, queryUtil,
    LSView) {

    return declare([], {

        locModel: null,
        viewElement: null, // can be id string or actual node

        constructor: function(options, viewElement) {
            this.inherited(arguments);
            this.postCreate(options, viewElement);
        },

        // this does not happen automatically.
        postCreate: function(options, viewElement) {
            this.inherited(arguments);
            this.lsView = new LSView({
                id: options.id,
                viewWidget: options.viewWidget,
                searchDelay: 400
            }, viewElement);
            this.setUpClassProperties(options);
            this.lsView.startup();
        },

        startup: function() {
            this.inherited(arguments);
            this.attachEventListeners();
        },

        setUpClassProperties: function(options) {
            this.mapServiceUrl = options.dataConfig.mapServiceUrl;
            this.roomLyrInfo = options.dataConfig.roomLayerInfo;
            this.personLyrInfo = options.dataConfig.personQueryLayerInfo;
            this.roomQ = queryUtil.createQuery({
                outFields: _.union(this.roomLyrInfo.queryFields, this.roomLyrInfo.queryLabelFields, [this.roomLyrInfo.oidField]),
                returnGeometry: false
            });
            this.personQ = queryUtil.createQuery({
                outFields: _.union(this.personLyrInfo.queryFields, this.personLyrInfo.queryLabelFields, [this.personLyrInfo.oidField]),
                returnGeometry: false
            });
        },

        attachEventListeners: function() {
            this.lsView.on('input-change', lang.hitch(this, this.handleSearchStr));
            this.lsView.on('select-oid', lang.hitch(this, this.handleResultSelection));
        },

        handleSearchStr: function(str) {
            console.debug('handleSearchStr', str);
            if (!this.lsView.inputValue || this.lsView.inputValue !== str) {
                console.debug('why bother querying?', this.lsView.inputValue, str);
                return;
            }
            this.roomQ.where = this.constructWhere(this.roomLyrInfo.queryFields, str);
            this.personQ.where = this.constructWhere(this.personLyrInfo.queryFields, str);

            var roomQT = new QT(this.roomLyrInfo.url || this.mapServiceUrl + '/' + this.roomLyrInfo.layerNum);
            var personQT = new QT(this.personLyrInfo.url || this.mapServiceUrl + '/' + this.personLyrInfo.layerNum);

            dojoAll({room: roomQT.execute(this.roomQ), person: personQT.execute(this.personQ)})
                .then(lang.hitch(this, this.handleQueryResults), queryUtil.genericErrback);

        },

        constructWhere: function(fieldArr, valueStr) {
            var upperStr = valueStr.toUpperCase().replace(/'/g, '\'\'');
            var whereArr = _.map(fieldArr, function(field) {
                return 'UPPER(' + field + ') LIKE \'%' + upperStr + '%\'';
            });
            var whereStr = whereArr.join(' OR ');

            // server bug 10.1
            var dirtyStr = queryUtil.getDirtyStr();
            if (dirtyStr) {
                whereStr = '(' + whereStr +  ') AND ' + dirtyStr;
            }

            return whereStr;
        },

        handleQueryResults: function(responsesObj) {
            console.debug('handleQueryResults', responsesObj);

            var self = this;
            var unifiedResults = [];
            _.each(responsesObj, function(response, lyrKey) {
                if (!queryUtil.checkResponseSuccess(response) || !queryUtil.checkFeatureExistence(response)) {
                    return;
                }
                var formattedResults = _.map(response.features, function(feat) {
                    var lyrInfoStr = lyrKey + 'LyrInfo';
                    return {
                        oid: feat.attributes[self[lyrInfoStr].oidField],
                        label: self[lyrInfoStr].queryLabelFunction(feat.attributes),
                        layer: lyrKey,
                        iconClass: self[lyrInfoStr].queryIconClass
                    };
                });

                unifiedResults = unifiedResults.concat(formattedResults);

            });

            this.lsView.handleFormattedResults(unifiedResults);
        },

        handleResultSelection: function(resultObj) {
            console.debug('handleResultSelection', resultObj);
            topic.publish('search-select-oid', _.omit(resultObj, 'target'));
            topic.publish('function-finished');
        }


    });
});
},
// Source: js/widgets/newlayersearch/NewLayerSearchView.js
'widgets/newlayersearch/NewLayerSearchView': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/topic',
    'dojo/query',
    'dojo/keys',
    'dojo/on',
    'dojo/NodeList-dom',
    'dojo/NodeList-traverse',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',
    'dijit/focus',

    'dojo/text!./NewLayerSearchView.html'],

function(declare, dojoEvent, lang, domConstruct, domStyle, domClass, domAttr, topic, dojoQuery, dojoKeys, dojoOn, nld, nlm,
    _EventedWidget, _TemplatedMixin, focusUtil,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {

        templateString: template,
        locModel: null,
        id: 'layerSearch',
        inputTimeout: setTimeout(function() {}, 100),
        inputValue: '',
        minChars: 3,

        constructor: function() {
            this.inherited(arguments);
        },

        postCreate: function() {
            this.inherited(arguments);
        },

        startup: function() {
            this.inherited(arguments);
            this.addEventListeners();
        },

        addEventListeners: function() {
            // dojoOn(document, 'click', lang.hitch(this, this.clearResults));

            topic.subscribe('map-resize', lang.hitch(this, this.onMapResize));
            dojoOn(this.viewWidget, 'mappanel-show', lang.hitch(this, this.focus));

            dojoOn(this.inputNode, 'keyup', lang.hitch(this, this.onInputKeyUp));
            dojoOn(this.inputNode, 'keydown', lang.hitch(this, this.onInputKeyDown));

            dojoOn(this.submitNode, 'click', lang.hitch(this, this.onInputKeyUp));
            dojoOn(this.clearNode, 'click', lang.hitch(this, this.clear));

            dojoOn(this.resultsNode, 'click', lang.hitch(this, this.resultClickHandler));
            dojoOn(this.resultsNode, 'keydown', lang.hitch(this, this.resultKeydownHandler));

        },

        // public methods
        focus: function() {
            focusUtil.focus(this.inputNode);
            // this added delay allows for the map cover to slide up, possibly pushing the
            // input node out of view on iOS. we need to scroll back to it. the .focus event
            // WILL NOT BE TRIGGERED IN iOS FROM A SETTIMEOUT! (which is why it's not in the setTimeout)
            var self = this;
            setTimeout(function() {
                if (self.inputNode.scrollIntoViewIfNeeded) {
                    self.inputNode.scrollIntoViewIfNeeded();
                } else if (self.inputNode.scrollIntoView) {
                    self.inputNode.scrollIntoView();
                } else {
                    console.warn('input node not visible, but scrollintoview not available. do something!');
                }
            }, 500);
        },

        blur: function() {
            console.debug('blur');
            this.inputNode.blur();
            this.clearResults();
        },

        clear: function() {
            console.debug('clear');
            domAttr.set(this.inputNode, 'value', '');
            this.inputValue = '';
            domClass.remove(this.containerNode, 'has-input');
            domClass.remove(this.domNode, 'search-error');
            this.clearResults();
            this.focus();
            this.emit('clear');
        },

        clearResults: function() {
            domConstruct.empty(this.resultsNode);
            this.clearSearchError();
        },

        hideResultsNode: function() {
            domClass.add(this.resultsNode, 'hide');
        },

        onInputKeyUp: function(evt) {
            if (!evt || evt.ctrlKey || evt.metaKey || evt.altKey || evt.keyCode === dojoKeys.copyKey || evt.keyCode === dojoKeys.ALT || evt.keyCode === dojoKeys.CTRL || evt.keyCode === dojoKeys.META || evt.keyCode === dojoKeys.SHIFT || evt.keyCode === dojoKeys.UP_ARROW || evt.keyCode === dojoKeys.DOWN_ARROW || evt.keyCode === dojoKeys.LEFT_ARROW || evt.keyCode === dojoKeys.RIGHT_ARROW) {
                return;
            }

            this.clearInputTimeout();

            this.inputValue = this.inputNode.value || '';

            // TODO: handle enter and escape on inputNode
            if (this.inputValue === '') {
                console.debug('no string here');
                domClass.remove(this.containerNode, 'has-input');
                this.clearResults();
                return;
            // } else if (evt.keyCode === dojoKeys.ENTER) {
            //     this.clearResults();
            //     this.emit('search-immediate', this.inputValue);
            } else if (evt.keyCode === dojoKeys.ESCAPE || evt.keyCode === dojoKeys.TAB) {
                this.clearResults();
                this.emit('search-cancel');
            } else if (this.inputValue.length < this.minChars && evt.keyCode && evt.keyCode !== dojoKeys.ENTER) {
                this.clearResults();
                domClass.add(this.containerNode, 'has-input');
                console.debug('input too short', this.inputValue);
                return;
            } else {
                this.inputTimeout = setTimeout(lang.hitch(this, this.handleInput), this.searchDelay);
            }
        },

        handleInput: function() {
            domClass.add(this.containerNode, 'loading has-input');
            this.emit('input-change', this.inputValue);
        },

        // capture keydown for tab and arrow navigation.
        // for all other key events, wait 'til key up.
        onInputKeyDown: function(evt) {
            if (!evt) {
                return;
            }

            var resultList = dojoQuery('.LSResult', this.resultsNode);
            if (!resultList.length) {
                return;
            }

            switch (evt.keyCode) {
                case dojoKeys.TAB:
                    // TODO
                    console.debug('tab pressed. cancelled deferreds, hide menus.');
                    break;

                case (dojoKeys.UP_ARROW):
                    dojoEvent.stop(evt);
                    resultList[resultList.length - 1].focus();
                    break;

                case (dojoKeys.DOWN_ARROW):
                    dojoEvent.stop(evt);
                    resultList[0].focus();
                    break;
            }
        },

        resultClickHandler: function(evt) {
            this.selectFeatureFromResult(evt.target);
        },

        resultKeydownHandler: function(evt) {
            if (evt.keyCode === dojoKeys.ENTER) {
                this.selectFeatureFromResult(evt.target);
                return;
            }
            if (evt.keyCode === dojoKeys.DOWN_ARROW || evt.keyCode === dojoKeys.UP_ARROW) {
                dojoEvent.stop(evt);
                this.adjustResultFocus(evt.keyCode, evt.target);
            }

        },

        adjustResultFocus: function(keyCode, resultEl) {
            var resultList = dojoQuery('.LSResult');
            var currentIndex = parseInt(domAttr.get(resultEl, 'data-idx'), 10);

            if ((keyCode === dojoKeys.DOWN_ARROW && currentIndex + 1 === resultList.length) || (keyCode === dojoKeys.UP_ARROW && currentIndex === 0)) {
                this.inputNode.focus();
            } else {
                var newIndex = keyCode === dojoKeys.DOWN_ARROW ? currentIndex + 1 : currentIndex - 1;
                resultList[newIndex].focus();
            }

        },

        selectFeatureFromResult: function(target) {
            var li = dojoQuery(target).closest('li')[0];
            console.debug('li: ', domAttr.get(li, 'data-oid'), domAttr.get(li, 'data-lyr'));
            var labelText = li.innerText || li.textContent;
            if (!labelText) {
                console.warn('aw crap, need to find li text some other way');
                labelText = 'Browser error!';
            }
            labelText = labelText.trim ? labelText.trim() : labelText.replace(/^\s+|\s+$/g, '');

            domAttr.set(this.inputNode, 'value', labelText);
            this.clearResults();

            this.emit('select-oid', {
                oid: domAttr.get(li, 'data-oid'),
                lyr: domAttr.get(li, 'data-lyr')
            });
        },


        clearInputTimeout: function() {
            clearTimeout(this.inputTimeout);
        },

        handleFormattedResults: function(results) {
            domClass.remove(this.containerNode, 'loading');
            domClass.add(this.containerNode, 'has-input');
            if (!results.length) {
                this.handleNoResults();
                return;
            }

            this.clearSearchError();

            var regex = new RegExp('(' + this.inputValue + ')', 'gi');

            var resultsUL = domConstruct.create('ul', {
                'class': 'resultsList'
            });

            _.each(results, function(resultObj, idx) {
                var formattedLabel = resultObj.label.replace(regex, '<strong>$1</strong>');

                domConstruct.create('li', {
                    'class': 'LSResult',
                    'data-oid': resultObj.oid,
                    'data-lyr': resultObj.layer,
                    'data-idx': idx,
                    'tabindex': '0',
                    innerHTML:  '<span class="search-results-icon ' + resultObj.iconClass + '"></span> ' + formattedLabel + '</li>'

                }, resultsUL);
            });

            // TODO: figure out why the phantom resultsNode is being left behind
            // domStyle.set(this.resultsNode, 'maxHeight', 'none');
            domConstruct.empty(this.resultsNode);
            domConstruct.place(resultsUL, this.resultsNode);
            // domStyle.set(this.resultsNode, 'maxHeight', this.searchResultsHeight + 'px');
        },

        clearSearchError: function() {
            domClass.remove(this.domNode, 'search-error');
        },

        handleNoResults: function() {
            domConstruct.empty(this.resultsNode);
            domClass.add(this.domNode, 'search-error');
        },

        onMapResize: function(newMapDimensions) {
            this.searchResultsHeight = _.min([newMapDimensions.h * 0.8 - 50, 450]);
            domStyle.set(this.resultsNode, 'maxHeight', this.searchResultsHeight + 'px');
        }

    });
});
},
// Source: js/widgets/overviewmap/OverviewMap.js
'widgets/overviewmap/OverviewMap': function() {
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/on',

    'esri/dijit/OverviewMap',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ArcGISDynamicMapServiceLayer'],

function(declare, lang, topic, dojoOn,
    OverviewMap, TileLayer, DynamicLayer) {

    return declare([], {

        constructor: function(options) {
            this.mapServiceUrl = options.mapServiceUrl;
            this.config = options.config;
            this.overviewMapDijit = new OverviewMap({
                id: 'ovm', // avoiding verbose default widget id
                map: options.map,
                attachTo: 'bottom-left',
                visible: options.config.openOnLoad,
                expandFactor: 3,
                baseLayer: new TileLayer(options.config.basemapUrl),
                opacity: 1 // this is for IE8, which seems to ignore !important on my hijacking of this css
            });

        },

        startup: function() {
            this.overviewMapDijit.startup();
            if (this.mapServiceUrl) {
                this.setupDataLayer();
                this.addDataLayer();
            }
            this.attachEventListeners();
        },

        attachEventListeners: function() {
            topic.subscribe('map-resize', lang.hitch(this, this.onMapResize));
        },

        setupDataLayer: function() {
            this.dataLayer = new DynamicLayer(this.mapServiceUrl);
            topic.subscribe('dynamiclayer-defexpr-update', lang.hitch(this, this.setDefExprs));
        },

        onMapResize: function(mapDimensions) {
            var self = this;
            if (!this.overviewMapDijit.visible) {
                dojoOn.once(this.overviewMapDijit.domNode, 'click', function() {
                    self.setResizeInterval(mapDimensions);
                });
                return;
            }
            if (this.overviewMapDijit.map && this.overviewMapDijit.overviewMap && this.overviewMapDijit.overviewMap.loaded) {
                this.resizeOverviewMap(mapDimensions);
            } else {
                this.setResizeInterval(mapDimensions);
            }
        },

        // adjust overviewMap size to 1/4 of the main map's dimensions (within a range of 100-250px)
        // there are checks before this function is called to ensure the overviewmapdijit has a hold of the main map,
        // and the overviewmap exists and is loaded.
        resizeOverviewMap: function(mapDimensions) {
                var mapHeight = mapDimensions && mapDimensions.h ? mapDimensions.h : this.overviewMapDijit.map.height;
                var mapWidth = mapDimensions && mapDimensions.w ? mapDimensions.w : this.overviewMapDijit.map.width;
                var ovHeight = Math.min(Math.max((mapHeight / 4), 100), 250);
                var ovWidth = Math.min(Math.max((mapWidth / 4), 100), 250);
                // resize overviewMap
                this.overviewMapDijit.resize({h: ovHeight, w: ovWidth});
        },

        setResizeInterval: function(mapDimensions) {
            var self = this;
            var count = 0;
            var resizeInterval = setInterval(function() {
                if (self.overviewMapDijit.overviewMap && self.overviewMapDijit.overviewMap.loaded) {
                    console.debug('resizing the overviewmap after ' + count + ' tries');
                    clearInterval(resizeInterval);
                    self.resizeOverviewMap(mapDimensions);
                } else if (count > 10) {
                    // give up after 10 seconds
                    console.warn('overview map data layer load fail');
                    clearInterval(resizeInterval);
                } else {
                    count++;
                }
            }, 1000);
        },

        addDataLayer: function() {
            this.dataLayer.setVisibleLayers(this.config.visibleLayers);
            var self = this;
            // in the future, if overviewMapDijit is closed on load...
            if (!this.overviewMapDijit.visible) {
                dojoOn.once(this.overviewMapDijit.domNode, 'click', function() {
                    self.setDefExprsAndAdd();
                });
            } else {
                // there seemed to be no events to hook into on this widget,
                // and overviewMapDijit.overviewMap isn't immediately available, and
                // if we're automatically opening the map we can't listen for 'click',
                // so the only other real option is trying on an interval. bleh.
                // btw, 'show' is not a real event on this widget. onshow is just a function, not an emitter.
                var count = 0;
                var overviewInterval = setInterval(function() {
                    if (self.overviewMapDijit.overviewMap && self.overviewMapDijit.overviewMap.loaded) {
                        console.debug('adding data layer to overview map after ' + count + ' tries');
                        clearInterval(overviewInterval);
                        self.setDefExprsAndAdd();
                    } else if (count > 30) {
                        // give up after 30 seconds
                        console.warn('overview map data layer load fail');
                        clearInterval(overviewInterval);
                    } else {
                        count++;
                    }
                }, 1000);
            }
        },

        setDefExprsAndAdd: function() {
            if (!this.dataLayer.layerDefinitions || !this.dataLayer.layerDefinitions.length) {
                var mapDataLayer = this.overviewMapDijit.map.getLayer('dataLayer');
                if (mapDataLayer) {
                    this.setDefExprs({layerDefArr: mapDataLayer.layerDefinitions});
                }
            }
            this.overviewMapDijit.overviewMap.addLayer(this.dataLayer);
        },

        setDefExprs: function(pubArgs) {
            this.dataLayer.setLayerDefinitions(pubArgs.layerDefArr);
        }
    });
});
},
// Source: js/app/views/templates/LayoutView.html
'url:app/views/templates/LayoutView.html': '<div><div id="header" class="bottom-shadow" data-dojo-attach-point="header"><img id="header-icon" data-dojo-attach-point="headerIcon"></img><div id="header-title" data-dojo-attach-point="headerTitle"></div></div><div id="map-container"><div id="map-buttons-horizontal"></div><div id="map-panels-horizontal" class="outline-shadow"></div><div id="popupWrapper" class="map-panel hide outline-shadow"></div></div></div>',
// Source: js/app/views/templates/MapButtonView.html
'url:app/views/templates/MapButtonView.html': '<div id="{id}" class="map-toggle btn"><i class="fa {iconClass}" data-dojo-attach-point="icon-div" title="{buttonTitle}"></i></div>',
// Source: js/app/views/templates/MapCoverView.html
'url:app/views/templates/MapCoverView.html': '<div class="push-down hide"></div>',
// Source: js/app/views/templates/MapPanelView.html
'url:app/views/templates/MapPanelView.html': '<div class="map-panel hide panel-wrapper"><div data-dojo-attach-point="replaceDiv"></div></div>',
// Source: js/app/views/templates/PopupView.html
'url:app/views/templates/PopupView.html': '<div class="pane-header"><div class="btn close" title="Close"><i class="fa fa-close"></i></div></div><div class="popup" id="popup-pane"></div>',
// Source: js/widgets/bookmarks/BookmarksView.html
'url:widgets/bookmarks/BookmarksView.html': '<div id="bookmarks"><select data-dojo-attach-point="buildingDropdown"><option value="" label="Choose a building">Choose a building</option></select></div>',
// Source: js/widgets/buildingbutton/buildingButtonView.html
'url:widgets/buildingbutton/buildingButtonView.html': '<div class="btn" title="Zoom to Full Building"><i class="fa fa-building-o"></i></div>',
// Source: js/widgets/floorpicker/FloorPickerView.html
'url:widgets/floorpicker/FloorPickerView.html': '<div><div class="full-dim picker-wrapper"><div data-dojo-attach-point="scrollUp" class="btn hide scroll-btn" title="Scroll Up"><i class="fa fa-chevron-up"></i></div><div data-dojo-attach-point="floorsDiv" class="floors-div" title="Change Floors"></div><div data-dojo-attach-point="scrollDown" class="btn hide scroll-btn" title="Scroll Down"><i class="fa fa-chevron-down"></i></div></div></div>',
// Source: js/widgets/loader/LoadIndicatorView.html
'url:widgets/loader/LoadIndicatorView.html': '<div id="load-indicator"><i class="fa fa-spinner fa-spin"></i></div>',
// Source: js/widgets/newlayersearch/NewLayerSearchView.html
'url:widgets/newlayersearch/NewLayerSearchView.html': '<div class="simpleLS"><div class="LayerSearcher" data-dojo-attach-point="containerNode"><div title="Search" tabindex="0" class="LSSearch LSIcon" data-dojo-attach-point="submitNode"><i class="fa fa-search"></i></div><div class="input-wrapper"><input id="${id}-input" tabindex="0" placeholder="Search for rooms and people" value="${inputValue}" autocomplete="off" type="text" data-dojo-attach-point="inputNode"></div><div tabindex="0" class="LSReset LSIcon" data-dojo-attach-point="clearNode"><i class="fa fa-close"></i></div><div tabindex="0" class="LSLoading LSIcon"><i class="fa fa-spin fa-spinner"></i></div></div><div class="LSResults" data-dojo-attach-point="resultsNode"></div></div>'
}});