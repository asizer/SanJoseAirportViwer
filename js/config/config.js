define(function() {

    return {
        layout: {
            // large header needs to be < 70px high
            headerIconLarge: 'assets/images/logo65-whiteontrans.png',
            headerIconLargeWidth: 65,
            headerIconSmall: 'assets/images/logo30-whiteontrans.png',
            // small header needs to be < 30px high
            headerIconSmallWidth: 30,
            headerTitle: 'Esri Campus PlaceFinder'
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
            center: [-117.196, 34.057], // longitude / latitude
            zoom: 17, // zoom level for initial extent (before zoom to building)

            // can specify built-in arcgisonline basemaps like
            // "streets", "satellite", "hybrid", "terrain", "topo", "gray", "dark-gray", "oceans", "national-geographic", "osm",
            // or any of the custom basemaps in the basemapGallery.customBasemaps config option below (use the title).
            basemap: 'Campus',
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
                { 'level': 20, 'resolution': 0.14929144441622, 'scale': 564.25 },
                { 'level': 21, 'resolution': 0.07464439928880, 'scale': 282.12 },
                { 'level': 22, 'resolution': 0.03747036660734, 'scale': 141.62 },
                { 'level': 23, 'resolution': 0.0187351833037,  'scale': 70.8 }
            ]
        },
        // the starting building/floor when none is given in the parameters.
        defaultLocation: {
            // building: 'M',
            // floor: '2'
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
            basemapUrl: '//server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer'
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
            customBasemaps: [{
                // title for BasemapGallery
                'title': 'Campus',
                // path to thumbnail. Starts in root directory of app (relative from index.html)
                'thumbnailUrl': 'assets/images/TopoCampus.png',
                // Can include multiple layers here. In this one, the default topo map is combined
                // with a custom campus map so that there's a fallback basemap in areas that the campus map doesn't cover.
                'baseMapLayers': [{
                    url: '//services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'
                }, {
                    url: '//arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/Campus/MapServer'
                // need a third layer for a basemap? just uncomment the next two lines:
                // }, {
                //     url: '//your-awesome-basemap.com/arcgis/rest/services/AnotherMap/MapServer'
                }]
            }, {
                'title': 'Campus2',
                'thumbnailUrl': 'assets/images/TopoCampus.png',
                'baseMapLayers': [{
                    url: '//services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'
                }, {
                    url: '//arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/Campus/MapServer'
                }]
            // need a third basemap toggle? uncomment these lines:
            // }, {
            //     'title': 'Campus3',
            //     'thumbnailUrl': 'assets/images/TopoCampus.png',
            //     'layers': [{
            //         url: '//services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'
            //     }, {
            //         url: '//arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/Campus/MapServer'
            //     }]
            }]
        },
        dataLayer: {
            mapServiceUrl: '//arcgis-localgov-61933129.us-west-1.elb.amazonaws.com/arcgis/rest/services/CampusPlaceFinder/BuildingInterior/MapServer',
            legendTitle: 'Campus',
            hideLegendSubtitles: true,
            buildingLayerInfo: {
                url: null, // if null, use mapServiceUrl above.
                layerNum: 3, // required, even if using individual url.
                buildingField: 'BUILDINGID',
                labelField: 'LONGNAME',
                addToMap: true,
                showInLegend: false,
                floorFilter: false // if false, all features of this layer will be shown, all the time.
            },
            floorLayerInfo: {
                url: null,
                layerNum: 2,
                buildingField: 'BUILDINGKEY',
                floorField: 'FLOOR',
                addToMap: true,
                showInLegend: false,
                floorFilter: true // if true, only a single building/floor of this layer will be shown at a time.
            },
            roomLayerInfo: {
                url: null,
                layerNum: 1,
                oidField: 'OBJECTID',
                relationshipId: 0, // this is a related table to the room layer
                buildingField: 'BUILDING',
                floorField: 'FLOOR',
                roomField: 'SPACEID', // this must be a UNIQUE KEY for the room layer.
                addToMap: true,
                showInLegend: true,
                titleForLegend: 'Rooms', // will be hidden if hideLegendSubtitles above is true
                floorFilter: true,
                popupFields: [
                    {fieldName: 'SPACEID', label: 'Room Number'},
                    {fieldName: 'SHORTNAME', label: 'Room Name'},
                    {fieldName: 'DESCRIP', label: 'Description'},
                    {fieldName: 'CAPACITY', label: 'Capacity'}
                ],
                // the *first* one of these fields to be encountered will be used in the popup title
                popupTitleField: ['LONGNAME', 'SPACEID'],
                popupTitlePriority: false,
                queryFields: ['SHORTNAME', 'SPACEID'],
                queryLabelFields: ['SHORTNAME', 'SPACEID', 'BUILDING'],
                queryLabelFunction: function(attrs) {
                    // 'this' = roomLyrInfo
                    var roomNameStr = attrs.SHORTNAME ? attrs.SHORTNAME + ', ' : '';
                    return roomNameStr + attrs.SPACEID + ' (Building ' + attrs.BUILDING + ')';
                },
                queryIconClass: 'fa fa-map-marker'
            },
            lineLayerInfo: {
                url: null,
                layerNum: 0,
                buildingField: 'BUILDINGKEY',
                floorField: 'FLOOR',
                addToMap: true,
                showInLegend: false,
                floorFilter: true
            },
            personQueryLayerInfo: {
                url: null,
                layerNum: 4,
                addToMap: false,
                oidField: 'OBJECTID',
                relationshipId: 0, // this is a related table to the room layer
                // it's important the fieldnames here are different from the fieldnames in the roomlayer's popup
                popupFields: [
                    {fieldName: 'KNOWNAS', label: 'Employee Name'},
                    {fieldName: 'EMAIL', label: 'Email',
                        formatter: function(val) {
                            return '<a href="mailto:' + val + '">' + val + '</a>';
                        }
                    },
                    {fieldName: 'EXTENSION', label: 'Extension'},
                    {fieldName: 'COSTCTRN', label: 'Cost Center'}
                ],
                // the *first* one of these fields to be encountered will be used in the popup title
                popupTitleField: ['KNOWNAS'],
                popupTitlePriority: true, // popup will look for any fields above before it will look at the room layer
                queryFields: ['KNOWNAS', 'LOCATION'],
                queryLabelFields: ['KNOWNAS', 'LOCATION'],
                queryLabelFunction: function(attrs) {
                    // 'this' = personQueryLayerInfo
                    return attrs.KNOWNAS + ' (' + attrs.LOCATION + ')';
                },
                queryIconClass: 'fa fa-user'
            }

        }
    };
});
