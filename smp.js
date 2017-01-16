(function (ns) {

    function setPlatformURL() {
    	(window.location.host == window.parent.location.host) ? wif.PlatformURL = window.parent.location : wif.PlatformURL = document.referrer;
    }

    function generateUUID() {
        var d = new Date().getTime();
        var uuid = wfxConfig.correlationId.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        wif.correlationId = uuid;
        console.log("Correlation id for current session: " + wif.correlationId);
    }

    function initAnalytics() {
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments)
            }, i[r].l = 1 * new Date();
            a = s.createElement(o), m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m)
        })(window, document, 'script',
            wfxConfig.analyticsObj.gaUrl, 'ga');
        ga('create', wfxConfig.analyticsObj.gaAccId, 'auto');
        ga(wfxConfig.analyticsObj.gaSend, 'pageview', { 'sessionControl': 'start' });
        console.log("Google analytics initialised");
    }

    function initEventListeners() {
        for (var custEvent in wfxConfig.custEvents) {
            document.addEventListener(wfxConfig.custEvents[custEvent], function (event) { wif.eventListeners.setEventData(event) });
        }
    }

    //Coorelation id for new session.
    var correlationId = wfxConfig.correlationId;

    //Platform URL.
    var PlatformURL = null;

    //Initialize client logger, google analytics, event listeners  and generate correlation ID on load of wif(framework).
    ns.init = function () {
    	
    	//Init log object
        wifLog.init();
        
        //Set init values like correlation id, platform information and user info  
        setPlatformURL();
        generateUUID();
        //TODO: Init user data
        
        //Init Analytics service and custom event listeners
        initAnalytics();
        initEventListeners();
    }

    ns.eventListeners = {
        setEventData: function (event) {
            var eventData = {
                "eventDetails": event.detail,
                "eventType": event.type
            }
            console.log(eventData.eventType + " event listener. With correlation Id " + wif.correlationId);
            analyticsService.postData(eventData);
        },
    };

    var analyticsService = {
        postData: function (eventData) {
            this.sendData(eventData);
            //TODO: Log errors or info.
            //wifLog.error('error level..');
        },
        sendData: function (eventData) {
            if (eventData.eventType == wfxConfig.custEvents.init) {
                platformData.setPlatformData(wif.PlatformURL);
                this.setDimension();
            }
            //TODO: customize data according to requirements.
            var eventCategory = JSON.parse(eventData.eventDetails).title;
            var eventAction = eventData.eventType;
            var eventLabel = JSON.parse(eventData.eventDetails);
            var eventValue = null;
            if (eventData.eventType == wfxConfig.custEvents.submit) {
                eventValue = JSON.parse(eventData.eventDetails).score;
            }
            ga(wfxConfig.analyticsObj.gaSend, wfxConfig.analyticsObj.gaEvent, eventCategory, eventAction, eventLabel, eventValue);
            console.log("data sent to google analytics..");
        },
        setDimension: function () {
            var dimensionData = this.getDimensionData();
            for (var dimension in dimensionData) {
                ga(wfxConfig.analyticsObj.gaSet, dimension, dimensionData[dimension]);
            }
            console.log("dimention data set to google analytics..");
        },
        getDimensionData: function () {
            //TODO: Get PI session id.
            var dimensionValue1 = 'TEST_USER';
            //TODO: Get revel platform.
            var dimensionValue2 = 'REVEL';
            var dimensionValue3 = courseData.title;
            var dimensionValue4 = courseData.chapter;
            var dimensionValue5 = wif.correlationId;
            var dimensionDataObj = {
                'dimension1': dimensionValue1,
                'dimension2': dimensionValue2,
                'dimension3': dimensionValue3,
                'dimension4': dimensionValue4,
                'dimension5': dimensionValue5
            }
            return dimensionDataObj;
        },
    };

    var platformData = {
        setPlatformData: function (url) {
            // (url.pathname.length > 0) ? this.parse(url.pathname, 'pn') : null;
            (url.search.length > 0) ? this.parse(decodeURIComponent(url.search), 's') : null;
            (url.hash.length > 0) ? this.parse(decodeURIComponent(url.hash), 'h') : null;
        },
        parse: function (urlAttrib, type) {
            switch (type) {
                // case 'pn':
                //     break;
                case 's':
                    urlAttrib = urlAttrib.replace('?', '').split('&');
                    for (var i in urlAttrib) {
                        urlAttrib[i] = urlAttrib[i].split("=")[1];
                    }
                    break;
                case 'h':
                    urlAttrib = urlAttrib.replace('#', '').split('/');
                    for (var k in urlAttrib) {
                        if (urlAttrib[k].length === 0) {
                            urlAttrib.splice(k, 1);
                        }
                    }
                    break;
            }
            courseData.title = urlAttrib[0];
            courseData.chapter = urlAttrib[1];
        }
    };

    var courseData = {
        title: null,
        chapter: null
    };

})(window.wif = window.wif || {});
