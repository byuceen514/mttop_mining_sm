/*global
 console, require
 */
var app;

require(["dojo/dom",
        "esri/Color",
        "esri/domUtils",
        "esri/map",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/graphic",
        "esri/tasks/Geoprocessor",
        "esri/tasks/FeatureSet",
        "esri/toolbars/draw",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/tasks/LinearUnit",
        "esri/symbols/SimpleMarkerSymbol"
    ],
    function (dom, Color, domUtils, Map, ArcGISDynamicMapServiceLayer, Graphic, Geoprocessor, FeatureSet, Draw, SimpleLineSymbol, SimpleFillSymbol, LinearUnit, SimpleMarkerSymbol) {
        'use strict';

        var map = null,
            gp,
            toolbar = null,
            MineAreaPolygon,
            elevation,
            alreadyClicked = false,
            LoadingPicture = $("#Loading");


        app = {
            "map": map,
            "toolbar": toolbar
        };

        /*Initialize map, GP & image params*/
        app.map = map = new Map("map", {
            basemap: "streets",
            center: [-112.994, 39.9057],
            zoom: 9
        });
        function gpJobComplete(jobinfo) {
            //get the result map service layer and add to map
            gp.getResultImageLayer(jobinfo.jobId, "TopCut", null, function (layer) {
                layer.setOpacity(0.7);
                map.addLayers([layer]);
            });
            gp.getResultData(jobinfo.jobId, "MineVolume", function (data) {
                LoadingPicture.addClass("hidden");
                var MineVolume = data.value.features[0].attributes.SUM;
                var MineArea = data.value.features[0].attributes.AREA;
                $("#VolumeValue").text("Volume above elevation (cubic meters): " + MineVolume);
                $("#AreaValue").text("Area within mine selection above elevation (square meters): " + MineArea);
            }, null);
        }

        function gpJobStatus(jobinfo) {
            domUtils.show(dom.byId('status'));
            var jobstatus = '';
            switch (jobinfo.jobStatus) {
                case 'esriJobSubmitted':
                    jobstatus = 'Submitted...';
                    break;
                case 'esriJobExecuting':
                    jobstatus = 'Executing...';
                    break;
                case 'esriJobSucceeded':
                    break;
            }
            console.log(jobstatus);
        }
        function gpJobFailed(error) {
            console.error(error);
        }

        function ComputeVolume(evtObj) {
            LoadingPicture.removeClass("hidden");
            var gpServiceUrl = "http://geoserver.byu.edu/arcgis/rest/services/MariahShawn/MiningExtractionTool3/GPServer/MiningExtractionTool3";
            gp = new Geoprocessor(gpServiceUrl);

            var params = {
                "MiningArea": MineAreaPolygon,
                "Where_clause": '"Value" >= ' + elevation
            };
            gp.submitJob(params, gpJobComplete, gpJobStatus, gpJobFailed);
        }

        function initTools(evtObj) {

            app.toolbar = toolbar = new Draw(evtObj.map);
            $("#btn_drawpolygon").on("click", function(){
                app.toolbar.activate(esri.toolbars.Draw.POLYGON);                //FREEHAND_POLYGON);
                app.map.hideZoomSlider();
            });

            $("#btn_clickpoint").on("click", function(){
                if (!alreadyClicked) {
                    map.on("click", DrawPoint);
                    alreadyClicked = true;
                }
            });

            toolbar.on("draw-end", addPolygontoMap);

            $("#btn_initiatecalc").on("click", ComputeVolume);
        }
        function addPolygontoMap(evtObj){
            var symbol, graphic, geometry, features;

            geometry = evtObj.geometry;
            /*After user draws shape on map using the draw toolbar compute the zonal*/
            map.showZoomSlider();
            map.graphics.clear();


            symbol = new SimpleFillSymbol("none", new SimpleLineSymbol("dashdot", new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
            graphic = new Graphic(geometry, symbol);

            map.graphics.add(graphic);
            toolbar.deactivate();

            features = [];
            features.push(graphic);

            MineAreaPolygon = new FeatureSet();
            MineAreaPolygon.features = features;
        }


        function DrawPoint(evt) {
            LoadingPicture.removeClass("hidden");
            map.graphics.clear();
            var pointSymbol = new SimpleMarkerSymbol();
            pointSymbol.setSize(14);
            pointSymbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1));
            pointSymbol.setColor(new Color([0, 255, 0, 0.25]));

            var graphic = new Graphic(evt.mapPoint, pointSymbol);
            map.graphics.add(graphic);

            var features = [];
            features.push(graphic);
            var featureSet = new FeatureSet();
            featureSet.features = features;

            //map.off("click");
            alreadyClicked = false;

            var params = {
                "Point": featureSet
            };
            gp = new Geoprocessor("http://geoserver.byu.edu/arcgis/rest/services/MariahShawn/PointExtractionToolSM/GPServer/PointExtractionTool");
            gp.setOutputSpatialReference({
                wkid: 102100
            });
            gp.execute(params, GetElevationfromPoint);
        }

        function GetElevationfromPoint(results, messages) {
            LoadingPicture.addClass("hidden");
            elevation = results[0].value.features[0].attributes.RASTERVALU;
            $("#MinimumElevation").val(elevation);
            //map.setExtent(graphicsUtils.graphicsExtent(map.graphics.graphics), true);
        }






        //Run the gp task when the app loads to display default incidents
        map.on("load", initTools);
    });