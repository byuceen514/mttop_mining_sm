/*jslint
 browser
 */
/*global
 console, require, $, esri
 */
/*property
 AREA, Draw, MiningArea, POLYGON, Point, RASTERVALU, STYLE_SOLID, SUM,
 Where_clause, activate, add, addClass, addLayers, attributes, basemap,
 byId, center, clear, deactivate, error, execute, features, geometry,
 getResultData, getResultImageLayer, graphics, hideZoomSlider, jobId,
 jobStatus, log, map, mapPoint, on, parse, push, remove, removeClass,
 setColor, setOpacity, setOutline, setOutputSpatialReference, setSize, show,
 showZoomSlider, submitJob, text, toolbar, toolbars, val, value, wkid, zoom
 // */

var app;

//The environment settings and functions that are necessary for the various functions.
require(["dojo/dom",
        "esri/Color",
        "esri/domUtils",
        "esri/map",
        "dojo/parser",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/graphic",
        "esri/tasks/Geoprocessor",
        "esri/tasks/FeatureSet",
        "esri/toolbars/draw",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/tasks/LinearUnit",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/layers/KMLLayer"
    ],
    function (dom, Color, domUtils, Map, parser, ArcGISDynamicMapServiceLayer, Graphic, Geoprocessor, FeatureSet, Draw, SimpleLineSymbol, SimpleFillSymbol, LinearUnit, SimpleMarkerSymbol, KMLLayer) {
        'use strict';

//The global variables to be used in the functions.
        var map = null,
            gp,
            toolbar = null,
            MineAreaPolygon,
            elevation,
            alreadyClicked = false,
            LoadingPicture = $("#div-loading"),
            mapClickEvent;


        app = {
            "map": map,
            "toolbar": toolbar
        };

        /*Initialize map, GP & image params*/
        app.map = map = new Map("map", {
            basemap: "streets",
            center: [-112.994, 39.9057],
            zoom: 8
        });

        var baseMapLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://geoserver.byu.edu/arcgis/rest/services/MariahShawn/JuabTooele/MapServer");
        map.addLayer(baseMapLayer);
        //
        //parser.parse();
        //
        //var kmlUrl = "/static/mttop_mining/data/JuabToole.kml";
        //var kml = new KMLLayer(kmlUrl);
        //map.addLayers([kml]);
        //kml.on("load", function() {
        //domStyle.set("loading", "display", "none");
        //});
        function gpJobComplete(jobinfo) {
            //get the result map service layer and add to map
            gp.getResultImageLayer(jobinfo.jobId, "TopCut", null, function (layer) {
                layer.setOpacity(0.7);
                map.addLayers([layer]);
            });
            //Run the main Geoprocessing to calculate the volume of material to be removed from the mountain top.
            gp.getResultData(jobinfo.jobId, "MineVolume", function (data) {
                //The loading animation displays only while the process is running.
                LoadingPicture.addClass("hidden");
                var MineVolume = data.value.features[0].attributes.SUM;
                var MineArea = data.value.features[0].attributes.AREA;
                //The mine volume and area are given the variables MineVolume and MineArea, respectively, which will be used later to print the results to the screen.
                $("#VolumeValue").text("Volume above elevation (cubic meters): " + Math.floor(MineVolume));
                $("#AreaValue").text("Area within mine selection above elevation (square meters): " + Math.floor(MineArea));
            }, null);
        }

//Function to give the status of the job.
        function gpJobStatus(jobinfo) {
            //domUtils.show(dom.byId('status'));
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

        function ComputeVolume() {
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
// The function for drawing the study area polygon.
            app.toolbar = toolbar = new Draw(evtObj.map);
            // The trigger for drawing the polygon is clicking on the button called btn_drawpolygon
            $("#btn_drawpolygon").on("click", function(){
                //The specific shape is a Polygon, which means that the user clicks for each vertex, which keeps the request shorter and more manageable.
                app.toolbar.activate(esri.toolbars.Draw.POLYGON);                // another option of polygon is FREEHAND_POLYGON);
                app.map.hideZoomSlider();
            });

//The trigger for starting the function to select a point for the minimum elevation is to click the button called btn_clickpoint.
            $("#btn_clickpoint").on("click", function(){
                if (!alreadyClicked) {
                    mapClickEvent = map.on("click", DrawPoint);
                    alreadyClicked = true;
                }
            });

//The polygon is added to the map.
            toolbar.on("draw-end", addPolygontoMap);

//The ComputeVolume function is started by clicking the button called btn_initiatecalc.
            $("#btn_initiatecalc").on("click", ComputeVolume);
        }
        //The symbology for the polygon and other map layout specifications.
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

//The specifications for drawing the point.
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

            mapClickEvent.remove();
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

//This function retrieves the elevation from the point that is selected.
        function GetElevationfromPoint(results) {
            LoadingPicture.addClass("hidden");
            elevation = results[0].value.features[0].attributes.RASTERVALU;
            $("#MinimumElevation").val(Math.floor(elevation));
        }


        //Run the gp task when the app loads to display default incidents
        map.on("load", initTools);
    });
