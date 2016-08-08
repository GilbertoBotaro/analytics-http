var pref = new gadgets.Prefs();
var delay;
var chartData = [];
var options;
var plot;
var node = pref.getString("node") || undefined;
var start = gadgetUtil.timeFrom();
var end  = gadgetUtil.timeTo();
var appname = pref.getString("appname") ||undefined;
var statType = pref.getString("appStatType");

$(function () {
    fetchData();
});

$(window).load(function(){
    var parentWindow = window.parent.document,
        thisParentWrapper = $('#'+gadgets.rpc.RPC_ID, parentWindow).closest('.gadget-body');
    $(thisParentWrapper).closest('.ues-component-box').addClass('info-widget form-control-widget');
});

var drawChart = function (data, options) {

    plot = $.plot("#placeholder", data, options);

    var previousPoint = null;

     $("#placeholder").bind("plothover", function (event, pos, item) {

        if ($("#enablePosition:checked").length > 0) {
            var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
            $("#hoverdata").text(str);
        }

        if (item) {
            if (previousPoint != item.dataIndex) {

                previousPoint = item.dataIndex;

                $("#tooltip").remove();
                var x = item.datapoint[0],
                    y = item.datapoint[1];

//                showTooltip(item.pageX, item.pageY,y,item.series.data[item.dataIndex][2]);
                showTooltip(item.pageX, item.pageY,item.series.data[item.dataIndex][2]);
            }
        } else {
            $("#tooltip").remove();
            previousPoint = null;
        }
    });


};

function fetchData() {
    $('.panel-heading').addClass(statType);

    gadgetUtil.fetchData(CONTEXT, {
        start_time: start,
        end_time: end,
        node: gadgetUtil.node(),
        action: statType,
        appname: gadgetUtil.appName()
    }, onDataReceived, onError);
}

function onDataReceived(data) {
    try {
        if (data.message.length == 0) {
            $("#canvas2").hide();
            $("#canvas1").show();
            $("#canvas1").html(gadgetUtil.getEmptyRecordsText());

            return;
        }

        $("#canvas1").hide();
        $("#canvas2").show();

        data = data.message;
        $('.total-count').text(data.total != undefined ? data.total.toLocaleString() : '');
        $('.measure-label').text(data.measure_label);
        $('#max-count').text(data.max != undefined ? data.max.toLocaleString() : '');
        $('.avg-count').text(data.avg != undefined ? data.avg.toLocaleString() : '');
        $('#min-count').text(data.min != undefined ? data.min.toLocaleString() : '');
        $('.statistics-main').text(data.title);
        $('.error-percentage').text(data.percentage != undefined ? data.percentage.toLocaleString() : '');
        if (data.graph) {
            chartData = {
                "label": "count",
                "data": data.graph
            };
            options = {
                "legend": {
                    "show": false
                },
                "series": {
                    "shadowSize": 1,
                    "bars": {
                        "show": true,
                        lineWidth: 0, // in pixels
                        barWidth: 0.8, // in units of the x axis
                        fill: true,
                        fillColor: '#ffffff',
                        align: "center" // "left", "right", or "center"
                    }
                },
                "grid": {
                    "show": false,
                    hoverable: true,
                    clickable: true
                }
            };
            var chartOptions = options;
            var _chartData = [];
            //    addSeriesCheckboxes(chartData);
            $.each(chartData, function(key) {
                _chartData.push(chartData[key]);
            });
            //console.info(chartData);
            drawChart(_chartData, chartOptions);
            var seriesContainer = $("#optionsRight");
            seriesContainer.find(":checkbox").click(function() {
                filterSeries(chartData);
            });
        }
    } catch (e) {
        $("#canvas2").hide();
        $("#canvas1").show();
        $("#canvas1").html(gadgetUtil.getErrorText(e));
    }
}

function onError() {
    console.error("Error in fetching data for error count info box.");
}

function showTooltip(x, y, contents) {
    $("<div id='tooltip'>" + contents + "</div>").css({
        top: y + 10,
        left: x + 10
    }).appendTo("body").fadeIn(200);
}
function addSeriesCheckboxes(data) {
    // insert checkboxes
    var seriesContainer = $("#optionsRight").find(".series-toggle");
    seriesContainer.html("");
    var objCount = 0;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            objCount++;
        }
    }
    if (objCount > 1) {
        $.each(data, function (key, val) {
            seriesContainer.append("<li><input type='checkbox' name='" + key +
                "' checked='checked' id='id" + key + "'/>" +
                "<label for='id" + key + "' class='seriesLabel'>"
                + val.label + "</label></li>");
        });
    }
}
function filterSeries(data) {
    var filteredData = [];
    var seriesContainer = $("#optionsRight");
    seriesContainer.find("input:checked").each(function () {
        var key = $(this).attr("name");
        if (key && data[key]) {
            var pausebtn = $("button.pause");
            if (!pausebtn.hasClass('btn-warning')) {
                $(pausebtn).toggleClass('btn-warning');
            }
            togglePause(pausebtn);
            filteredData.push(data[key]);
        }
        drawChart(filteredData, options);

    });
}
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


gadgets.HubSettings.onConnect = function () {

    //gadgets.Hub.subscribe('wso2.gadgets.charts.timeRangeChange',
    //    function (topic, data, subscriberData) {
    //        start = data.start.format('YYYY-MM-DD HH:mm');
    //        end = data.end.format('YYYY-MM-DD HH:mm');
    //        fetchData();
    //    }
    //);
    //
    //gadgets.Hub.subscribe('wso2.gadgets.charts.ipChange',
    //    function (topic, data, subscriberData) {
    //        node = data;
    //        fetchData();
    //    }
    //);
    gadgets.Hub.subscribe('timeRangeChangeSubscriber',
        function (topic, data, subscriberData) {
            //alert("Subscriber just received dates " +data.start + " and " +data.end);
            start = data.start;
            end = data.end;
            fetchData();
        }
    );

};


