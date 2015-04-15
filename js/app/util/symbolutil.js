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
});