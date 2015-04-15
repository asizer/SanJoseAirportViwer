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
