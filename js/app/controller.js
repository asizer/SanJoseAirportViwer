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

    'dojo/dom',

    "dijit/form/Button",
    'esri/dijit/Print',
    'esri/map',
    'esri/basemaps',
    'esri/geometry/Extent'],

function(config,
    Layout, LocationModel, MapController, QueryController,
    BuildingButton, FloorPicker, OverviewMap, LoadIndicator, CustomBMG, Bookmarks, LayerSearch,
    CustomLegend,
    MapButtonPanelView, MapCoverView,
    dom,
    Button, Print, Map, esriBasemaps, Extent) {

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
            this.initPrint(mapCoverView);
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

        initPrint: function(mobileView) {
            var printView = new MapButtonPanelView({
                config: config.layout,
                buttonTitle: 'Print Maps',
                iconClass: 'fa-print',
                id: 'printView',
                toggleDiv: 'map-buttons-horizontal',
                panelDiv: 'map-panels-horizontal',
                mobileView: mobileView
            });
            printView.startup();

            var print = new Print({
              templates: [{
                  label: "San Jose Airport Campus Viewer",
                  format: "PDF",
                  layout: "Letter ANSI A Landscape",
                  layoutOptions:{

                  },
                  showAttribution:false
                  // exportOptions: {
                  //   width: 500,
                  //   height: 400,
                  //   dpi: 96
                  // }
                }],
                map: this.map,
                url:'http://pros00004:6080/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'
            }, printView.replaceDiv);

            print.startup();


            // var printButton = new Button({
            //     label: "Click me!"
            // }, printView.replaceDiv).startup();
            //
            // this.own(on(printButton, "click", lang.hitch(this, function(evt){
            //     var print_url = "http://ngmc.esri.com:6080/arcgis/rest/services/NRCS_POD/WatershedExport/GPServer/WatershedExport";
            //     printer = new esri.tasks.PrintTask(print_url);
            //     var params = new esri.tasks.PrintParameters();
            //     params.map = this.map;
            //     params.extraParameters = {
            //         //Web_Map_as_JSON : mapjson,
            //         //Format: "",
            //         Layout_Template : "A_size_landscape",
            //         Title: "exported map"
            //         };
            //     printer.execute(params, printResult);
            //     //document.getElementById("printURL").innerHTML = "Printing...";
            //     function printResult(result) {
            //         window.open(result, "_blank");
            //             }
            // })));

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
