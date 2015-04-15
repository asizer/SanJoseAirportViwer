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
