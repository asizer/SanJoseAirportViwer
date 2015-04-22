/*jslint ihateyou */
define(function() {

    return {
        // authentication is optional. If authentication is not needed, comment out
        // either the entire authentication object or at least the appId line.
        authentication: {
            // appId: 'tptyeLpF1ztdKhHD',
            // If appId is present and portalUrl is omitted, this authenticates against
            // *any* arcgisonline account, which is probably not what you want.
            portalUrl: '//dbsne.maps.arcgis.com',
        },
        layout: {
            // large header needs to be < 70px high
            headerIconLarge: 'assets/images/logo.jpg',
            headerIconLargeWidth: 65,
            headerIconSmall: 'assets/images/logo.jpg',
            // small header needs to be < 30px high
            headerIconSmallWidth: 30,
            headerTitle: 'San Jose Airport Campus Viewer'
        },
        mapSetup: {

            /*  the extent/fitExtent or center/zoom will be used on map startup
             *  before a building is loaded or chosen.
             *  Specify either extent/fitExtent or center/zoom. Comment the other one out.
             *  campus extent. use either extent/fitExtent or center/zoom.
             */

            /*  -----  extent/fitExtent  -----  */
            // extent: {
            //     spatialReference: {
            //         latestWkid: 3857,
            //         wkid: 102100
            //     },
            //     xmin: -13046549.206481133,
            //     ymin: 4036266.52053701,
            //     xmax: -13045818.275569271,
            //     ymax: 4036685.730912931
            // },
            // fitExtent: true, // if true, forces map to always show entire specified extent. if false, map might cut edges off extent.

            /*  -----  center/zoom  -----  */
            // center: [-117.196, 34.057], // lng, lat. redlands.
            center: [-121.926, 37.362],
            zoom: 15, // zoom level for initial extent (before zoom to building)

            basemap: 'Color Campus',
            // the user shouldn't change these lods, but could remove unneeded levels --
            // for instance, if the user's campus is a single site, there's no need for levels 0-13.
            // just be careful to end every object except the last with a comma.
            lods: [
                { 'level': 0,  'resolution': 156543.033928,    'scale': 591657527.591555 },
                { 'level': 1,  'resolution': 78271.5169639999, 'scale': 295828763.795777 },
                { 'level': 2,  'resolution': 39135.7584820001, 'scale': 147914381.897889 },
                { 'level': 3,  'resolution': 19567.8792409999, 'scale': 73957190.948944 },
                { 'level': 4,  'resolution': 9783.93962049996, 'scale': 36978595.474472 },
                { 'level': 5,  'resolution': 4891.96981024998, 'scale': 18489297.737236 },
                { 'level': 6,  'resolution': 2445.98490512499, 'scale': 9244648.868618 },
                { 'level': 7,  'resolution': 1222.99245256249, 'scale': 4622324.434309 },
                { 'level': 8,  'resolution': 611.49622628138,  'scale': 2311162.217155 },
                { 'level': 9,  'resolution': 305.748113140558, 'scale': 1155581.108577 },
                { 'level': 10, 'resolution': 152.874056570411, 'scale': 577790.554289 },
                { 'level': 11, 'resolution': 76.4370282850732, 'scale': 288895.277144 },
                { 'level': 12, 'resolution': 38.2185141425366, 'scale': 144447.638572 },
                { 'level': 13, 'resolution': 19.1092570712683, 'scale': 72223.819286 },
                { 'level': 14, 'resolution': 9.55462853563415, 'scale': 36111.909643 },
                { 'level': 15, 'resolution': 4.77731426794937, 'scale': 18055.954822 },
                { 'level': 16, 'resolution': 2.38865713397468, 'scale': 9027.977411 },
                { 'level': 17, 'resolution': 1.19432856685505, 'scale': 4513.988705 },
                { 'level': 18, 'resolution': 0.59716428355982, 'scale': 2256.994353 },
                { 'level': 19, 'resolution': 0.29858214164762, 'scale': 1128.497176 },
                // these last four levels are zoomed in beyond any publicly available basemaps.
                // They need to match the tiling schema of the custom basemaps
                { 'level': 20, 'resolution': 0.14929144441622216, 'scale': 564.25 },
                { 'level': 21, 'resolution': 0.074644399288798582, 'scale': 282.12 },
                { 'level': 22, 'resolution': 0.037322199644399291, 'scale': 141.06 },
                { 'level': 23, 'resolution': 0.018661099822199646,  'scale': 70.53 }
            ]
        },
        // the starting building/floor when none is given in the parameters.
        defaultLocation: {
            // building: 'O',
            // floor: '3'
        },
        // for room selection on click or search.
        selectionSymbol: {
            fillColor: [0, 0, 0, 64], // rgb or rgba array
            lineColor: [255, 139, 0], // rgb or rgba array
            lineWidth: 2 // px
        },
        /*
         * the overview map will show the data layer IF there is a mapServiceUrl specified under the dataLayer below.
         * this overview map data layer will be run through the same definition expression as the data layer on the main map.
         * the basemap of this overviewMap must be specified as a URL of a tile layer.
         */
        overviewMap: {
            visibleLayers: [0, 1, 2, 3], // this is room lines, rooms, floors, building footprints
            openOnLoad: true, // start open
            basemapUrl: 'http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'
        },
        /*
         * These are the names of the currently available ArcGISOnline basemaps. The user can specify which
         * basemaps to include in the gallery, which is particularly helpful for a facilities management app
         * as not all basemaps are available down to zoom level 19.
         * Just comment out the ones you don't want in the gallery, making sure there's no comma on the last one.
         */
        basemapGallery: {
            portalUrl: null,
            basemapTitles: [
                'Imagery',
                // 'Imagery with Labels',
                'Streets',
                'Topographic',
                // 'Dark Gray Canvas',
                // 'Light Gray Canvas',
                // 'National Geographic',
                // 'Oceans',
                // 'Terrain with Labels',
                'OpenStreetMap'
                // 'USA Topo Maps',
                // 'USGS National Map'
            ],

            customBasemaps: [],


            // customBasemaps: [{
            //     // title for BasemapGallery
            //     'title': 'Grey Campus',
            //     // path to thumbnail. Starts in root directory of app (relative from index.html)
            //     'thumbnailUrl': 'assets/images/Campus_Basemap_Grey_Thumb.png',
            //     // Can include multiple layers here. In this one, the default topo map is combined
            //     // with a custom campus map so that there's a fallback basemap in areas that the campus map doesn't cover.
            //     'baseMapLayers': [{
            //         url: '//services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'
            //     }, {
            //         url: '//pros00004:6080/arcgis/rest/services/Esri_Campus_Basemaps/Campus_Basemap_Grey/MapServer'
            //     }]
            // }, {
            //     'title': 'Color Campus',
            //     'thumbnailUrl': 'assets/images/Campus_Basemap_Color_Thumb.png',
            //     'baseMapLayers': [{
            //         url: '//services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'
            //     }, {
            //         url: '//pros00004:6080/arcgis/rest/services/Esri_Campus_Basemaps/Campus_Basemap_Color/MapServer'
            //     }]
            // }]
        },
        dataLayer: {
            // mapServiceUrl: '//pros00004.esri.com:6080/arcgis/rest/services/EsriCampusViewer/CampusViewer/MapServer',
            mapServiceUrl:'http://pros00004:6080/arcgis/rest/services/SJC/SJC_CampusViewer_v1/MapServer',
            legendTitle: 'Building Interior',
            hideLegendSubtitles: true,

            /* ----- layer infos ----- */
            /*  The following layerInfo keys should not change:
             *  buildingLayerInfo, floorLayerInfo, roomLayerInfo, personQueryLayerInfo.
             *  The other layerInfo keys don't matter, and you can add more if you want.
             *
             *  At the moment, if your building/floor/room data is in a MapServiceLayer, you can
             *  add other sublayers from that same MapServiceLayer here. And if your building/floor/room data
             *  is all in separate FeatureLayers, you can add other FeatureLayers here.
             *
             *  Coming soon: add other MapServiceLayers and FeatureLayers from different sources,
             *  and mix types (for instance, add auxilliary FeatureLayers when your building/floor/room data
             *  is a MapServiceLayer, and vice versa).
             */

             buildingLayerInfo: {
                 url: null, // if null, use mapServiceUrl above.
                 layerNum: 3, // required, even if using individual url.
                 buildingField: 'BLDG_NAME',
                 labelField: 'BLDG_NAME',
                 addToMap: true,
                 showInLegend: false,
                 floorFilter: false // if false, all features of this layer will be shown, all the time.
             },



            // buildingLayerInfo: {
            //     url: null, // if null, use mapServiceUrl above.
            //     layerNum: 6, // required, even if using individual url.
            //     buildingField: 'BUILDINGID',
            //     labelField: 'LONGNAME',
            //     addToMap: true,
            //     showInLegend: false,
            //     floorFilter: false // if false, all features of this layer will be shown, all the time.
            // },

            floorLayerInfo: {
                // url: null,
                // layerNum: 2,
                // buildingField: 'BLDG_NAME',
                // floorField: 'FLOOR_NUM',
                // addToMap: true,
                // showInLegend: false,
                // floorFilter: true // if true, only a single building/floor of this layer will be shown at a time.
            },
            // floorLayerInfo: {
            //     url: null,
            //     layerNum: 5,
            //     buildingField: 'BUILDINGKEY',
            //     floorField: 'FLOOR',
            //     addToMap: true,
            //     showInLegend: false,
            //     floorFilter: true // if true, only a single building/floor of this layer will be shown at a time.
            // },
            roomLayerInfo: {
                url: null,
                layerNum: 2,
                oidField: 'OBJECTID',
                relationshipId: 0, // this is a related table to the room layer
                buildingField: 'BLDG_NAME',
                floorField: 'FLOOR_NUM',
                roomField: 'SPACE_NUM', // this must be a UNIQUE KEY for the room layer.
                addToMap: true,
                showInLegend: true,
                floorFilter: true,
                popupFields: [
                    {fieldName: 'SPACE_NUM', label: 'Space Number'},
                    {fieldName: 'OCCUPIED_BY', label: 'Occupant'},
                    {fieldName: 'DESCRIPTION', label: 'Description'},
                    {fieldName: 'SPACE_TYPE', label: 'Space Type'}
                ],
                // the *first* one of these fields to be encountered will be used in the popup title
                popupTitleField: ['SPACE_NUM', 'DESCRIPTION'],
                popupTitlePriority: false,
                // queryFields: ['SHORTNAME', 'LOCATION'],
                // queryLabelFields: ['SHORTNAME', 'LOCATION', 'BUILDING'],
                // queryLabelFunction: function(attrs) {
                //     // 'this' = roomLyrInfo
                //     var roomNameStr = attrs.SHORTNAME ? attrs.SHORTNAME + ', ' : '';
                //     return roomNameStr + attrs.LOCATION + ' (Building ' + attrs.BUILDING + ')';
                // },
                // queryIconClass: 'fa fa-map-marker'
            },
            lineLayerInfo: {
                url: null,
                layerNum: 0,
                buildingField: 'BLDG_NAME',
                floorField: 'FLOOR_NUM',
                addToMap: true,
                showInLegend: false,
                floorFilter: true
            },
            /* add more layers here. the key doesn't matter. if you want them
             * filtered by floor, make sure you have a buildingField and floorField
             * specified, and a floorFilter = true
             */
             lineLayerInfo_additional: {
                 url: null,
                 layerNum: 1,
                 buildingField: 'BLDG_NAME',
                 floorField: 'FLOOR_NUM',
                 addToMap: true,
                 showInLegend: false,
                 floorFilter: true
             },
            // labelLayerInfo: {
            //     layerNum: 7, // this is the number after MapServer/ in the rest endpoint url
            //     buildingField: 'building',
            //     floorField: 'floor',
            //     addToMap: true,
            //     showInLegend: false,
            //     floorFilter: true // if true, will filter using buildingField and floorField
            // },
            // fireExtinguishersLayerInfo: {
            //     layerNum: 0, // this is the number after MapServer/ in the rest endpoint url
            //     buildingField: 'BUILDING',
            //     floorField: 'FLOOR',
            //     addToMap: false,
            //     showInLegend: false,
            //     floorFilter: false // if false, will always display, no matter which building.
            // },
            // firstAidLayerInfo: {
            //     layerNum: 1, // this is the number after MapServer/ in the rest endpoint url
            //     buildingField: 'BUILDING',
            //     floorField: 'FLOOR',
            //     addToMap: false,
            //     showInLegend: false,
            //     floorFilter: false // if false, will always display, no matter which building.
            // },
            // smokingAreaLayerInfo: {
            //     layerNum: 2, // this is the number after MapServer/ in the rest endpoint url
            //     buildingField: 'BUILDING',
            //     floorField: 'FLOOR',
            //     addToMap: true,
            //     showInLegend: false,
            //     floorFilter: false // if false, will always display, no matter which building.
            // },
            personQueryLayerInfo: {
                url: null,
                layerNum: 8,
                addToMap: false,
                oidField: 'OBJECTID',
                relationshipId: 0, // this is a related table to the room layer
                // it's important the fieldnames here are different from the fieldnames in the roomlayer's popup
                popupFields: [
                    {fieldName: 'KNOWN_AS_N', label: 'Employee Name'},
                    {fieldName: 'EMAIL', label: 'Email',
                        formatter: function(val) {
                            return '<a href="mailto:' + val + '">' + val + '</a>';
                        }
                    },
                    {fieldName: 'EXTENSION', label: 'Extension'},
                    {fieldName: 'COST_CTR_N', label: 'Group'},
                    {fieldName: 'COST_CTR', label: 'Cost Center'}
                ],
                // the *first* one of these fields to be encountered will be used in the popup title
                popupTitleField: ['KNOWN_AS_N'],
                popupTitlePriority: true, // popup will look for any fields above before it will look at the room layer
                queryFields: ['KNOWN_AS_N', 'LOCATION'],
                queryLabelFields: ['KNOWN_AS_N', 'LOCATION'],
                queryLabelFunction: function(attrs) {
                    // 'this' = personQueryLayerInfo
                    var locStr = attrs.LOCATION && attrs.LOCATION.trim() ? attrs.LOCATION : 'Room Not Found';
                    return attrs.KNOWN_AS_N + ' (' + locStr + ')';
                },
                queryIconClass: 'fa fa-user'
            }

        }
    };
});
