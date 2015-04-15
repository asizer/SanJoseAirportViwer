/* global require */
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');
if (locationPath.slice(-1) !== '/') { locationPath += '/'; }

require({
    packages: [
        { name: 'app', location: locationPath + 'js/app'},
        { name: 'widgets',  location:  locationPath + 'js/widgets'},
        { name: 'config',  location:  locationPath + 'js/config'}
    ]
}, [
    'esri/arcgis/OAuthInfo',
    'esri/IdentityManager',
    'app/controller',
    'config/config-pros', // if you change this, change the one in controller.js too
    'dojo/domReady!'], function(OAuthInfo, esriID, Controller, config) {

        if (config.authentication && config.authentication.appId) {
            var info = new OAuthInfo({
                appId: config.authentication.appId,
                authNamespace: 'portal_oauth_inline',
                popup: false
            });
            if (config.portalUrl) {
                info.portalUrl = config.portalUrl;
            }
            esriID.registerOAuthInfos([info]);

            esriID.getCredential(info.portalUrl);

            esriID.checkSignInStatus(info.portalUrl).then(function() {
                Controller.startup();
            }).otherwise(function() {
                console.debug('login failed. otherwise.', arguments);
            });
        } else {
            Controller.startup();
        }

  }
);

