var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

var StackedBarChart = (function (index) {
    var jsonData = {};
    var currentOperator = 0;
    var svg;
    var g;
    var id = index || "";
    var x;
    var y;
    var z = d3.scaleOrdinal()
        .range(
    //["#a0e3b7", "#710c9e", "#37b51f", "#ae2a51", "#a3c541", "#323d96", "#7ebef8", "#1c5872", "#21f0b6", "#6f3631", "#f3a4a8", "#166d2a", "#fd6ca0", "#d95e13", "#f2d174"]
    ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"]
        );
    var keys = [];
    var stacked;
    var margin = {
            top: 40,
            right: 20,
            bottom: 40,
            left: 50
        };
    var minutes, barCounts;
    var bandWidth;

    var initStackedBarChart = function(json) {
        jsonData = json;
        keys = json.taskName;
        barCounts = json.utilization[0][0][0].length;
        minutes = barCounts * 10;
        console.log(minutes, barCounts);
        svg = d3.select("#modalSVG" + id);
        width = +svg.attr("width") - margin.left - margin.right;
        height = +svg.attr("height") - margin.top - margin.bottom;
        bandWidth = Math.floor((width - 150) / (barCounts + 1));

        x = d3.scaleLinear().rangeRound([0, width-150]);
        y = d3.scaleLinear()
            .rangeRound([height, 0]);

        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        //console.log(keys, width, height);
        // text label for the x axis
        svg.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.bottom + margin.top) + ")")
            .style("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text("Time (min)");

        // text label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0) // - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text("Utilization (%)");

        // reset slider to 1
        var slider = document.getElementById("replicationSlider" + id);
        var output = document.getElementById("replicationTB" + id);

        slider.value = 1;
        slider.setAttribute("max", json.utilization[0].length);
        output.innerHTML = slider.value;

        slider.oninput = function () {
            output.innerHTML = this.value;
            console.log(jsonData, currentOperator, this.value);
            drawStackedBarChart(jsonData, currentOperator, this.value - 1);
        }

        // define domains
        x.domain([0, minutes]); // data.map(function(d) { return d.x; }));
        y.domain([0, 1]); //.nice()
        z.domain(keys);

        var ticks = [];
        for(var j=30; j<= minutes;j+=30) {
            ticks.push(j);
        }
        // set ticks
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues(ticks));

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, 's').tickFormat(function (d) {
                return d * 100;
            }))
            .append("text")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start");

        // set legends
        var legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(0," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", width - 5)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.append("text")
            .attr("x", width - 10)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function (d) {
                return d;
            });

        stacked = d3.stack().keys(keys); //(data);
    };

    var minsInTime = function(mins) {
        var hh = Math.floor(mins / 60);
        var mm = mins % 60;
        //hh = hh < 10 ? '0' + hh : hh;
        mm = mm < 10 ? '0' + mm : mm;
        return hh + ":" + mm;
    }

    var drawStackedBarChart = function(json, operator, replication) {
        // convert json data into d3 stack preferred form
        currentOperator = operator;
        var data = [];
        for (var i = 0, j = 0; i <= minutes; i += 10, j++) {
            data.push({
                x: i,
                total: 0
            });
        }

        for (var i = 0; i < keys.length; i++) {
            for (var j = 0; j < barCounts; j++) {
                data[j][keys[i]] = json.utilization[operator][replication][i][j];
                data[j]["total"] += json.utilization[operator][replication][i][j];
            }
            data[j][keys[i]] = 0; // prevent error for the last column 480
        }

        // draw stacked bar charts
        // each data column (a.k.a "key" or "series") needs to be iterated over
        // the variable alphabet represents the unique keys of the stacks
        keys.forEach(function (key, key_index) {

            var keyClassName = key.replace(/[ ()]/g, '_');
            console.log(key, keyClassName, key_index);
            var bar = g.selectAll(".bar-" + keyClassName)
                .data(stacked(data)[key_index], function (d) {
                    return d.data.x + "-" + keyClassName;
                });

            bar
                .transition()
                .attr("x", function (d) {
                    return x(d.data.x) + 1;
                })
                .attr("y", function (d) {
                    return y(d[1]);
                })
                .attr("height", function (d) {
                    return y(d[0]) - y(d[1]);
                });

            bar.enter().append("rect")
                .attr("class", function (d) {
                    return "bar bar-" + keyClassName;
                })
                .attr("x", function (d) {
                    return x(d.data.x) + 1;
                })
                .attr("y", function (d) {
                    return y(d[1]);
                })
                .attr("height", function (d) {
                    return y(d[0]) - y(d[1]);
                })
                .attr("width", bandWidth + 1) // x.bandwidth())
                .attr("fill", function (d) {
                    return z(key);
                })
        });

        d3.select("#stackedBCTitle" + id).text(json.operatorName[operator] + " Workload");
        // mouseover tips
        svg.selectAll(".bar")
            .on("mouseover", function (d, i) {
                //console.log(d, i, i/49, data[i%49]);
                var minutes = i % (barCounts + 1) * 10;

                d3.select(this).attr("stroke", "blue").attr("stroke-width", 0.8);
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                //HH:MM-HH:MM, Busy for XX.XX minutes with Y tasks, Total Utilization: 100%
                div.html("<table><tr><td>Time: " + minsInTime(minutes) + " to " + minsInTime(minutes+10) + "</td></tr><tr><td>Busy for " + ((d[1] - d[0]) * 10).toFixed(2) + " minutes</td></tr><tr><td>with " + keys[parseInt(i / (barCounts + 1))] + " task</td></tr><tr><td>Total Utilization: " + (data[i % (barCounts +1)]["total"] * 100).toFixed(2) + "%</td></tr></table>")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                //.style("left", (window.pageXOffset + matrix.e + 15) + "px")
                //.style("top", (window.pageYOffset + matrix.f - 30) + "px");;
            })
            .on("mouseout", function (d) {
                d3.select(this).attr("stroke", "pink").attr("stroke-width", 0.2);
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    };

    return {
        initStackedBarChart : initStackedBarChart,
        drawStackedBarChart : drawStackedBarChart
    };
});

var BoxPlot = (function() {
    var width = 960;
    var height = 450;
    var barWidth = 30;
    var margin = {
            top: 40,
            right: 20,
            bottom: 40,
            left: 50
        };
    var width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    var totalWidth = width + margin.left + margin.right;
    var totalheight = height + margin.top + margin.bottom;

    var boxQuartiles = function(d) {
            return [
                d3.quantile(d, .25),
                d3.quantile(d, .5),
                d3.quantile(d, .75)
            ];
    };

    // Perform a numeric sort on an array
    var sortNumber = function(a, b) {
            return a - b;
    };
    var stackedBC = [];
    var visualize = function(url, element, index) {
        d3.json(url).then(function (json) {
            // save the json into jsonData for later use of stacked bar charts

            stackedBC[index] = new StackedBarChart(index);
            stackedBC[index].initStackedBarChart(json);

            // parse json file into groupCounts
            var groupCounts = {};
            var globalCounts = [];
            for (var i = 0; i < json.averageUtilization.length; i++) {
                var key = json.operatorName[i];
                groupCounts[key] = json.averageUtilization[i];
                globalCounts = globalCounts.concat(json.averageUtilization[i]);
            }
            console.log("GroupCounts ", groupCounts);
            console.log("GlobalCounts ", globalCounts);

            // Sort group counts so quantile methods work
            for (var key in groupCounts) {
                var groupCount = groupCounts[key];
                groupCounts[key] = groupCount.sort(sortNumber);
            }

            // Setup a color scale for filling each box
            var colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                .domain(Object.keys(groupCounts));

            // Prepare the data for the box plots
            var boxPlotData = [];
            for (var [key, groupCount] of Object.entries(groupCounts)) {

                var record = {};
                var localMin = d3.min(groupCount);
                var localMax = d3.max(groupCount);

                record["key"] = key;
                record["counts"] = groupCount;
                record["quartile"] = boxQuartiles(groupCount);
                record["whiskers"] = [localMin, localMax];
                record["color"] = colorScale(key);

                boxPlotData.push(record);
            }

            // Compute an ordinal xScale for the keys in boxPlotData
            var xScale = d3.scalePoint()
                .domain(Object.keys(groupCounts))
                .rangeRound([20, width])
                .padding([0.5]);

            // Compute a global y scale based on the global counts
            var min = d3.min(globalCounts);
            var max = d3.max(globalCounts);
            var yScale = d3.scaleLinear()
                .domain([0, 1])
                //.domain([min - 0.0001, max])
                .range ([height, 20]);

            // Setup the svg and group we will draw the box plot in
            var svg = d3.select(element);
            svg.selectAll("*").remove();

            svg.attr("width", totalWidth)
               .attr("height", totalheight)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Move the left axis over 55 pixels, and the top axis over 35 pixels
            var axisG = svg.append("g").attr("transform", "translate(55,0)");
            var axisBG = svg.append("g").attr("transform", "translate(35," +        (height) + ")");

            // Setup the group the box plot elements will render in
            var g = svg.append("g")
                .attr("transform", "translate(20,5)");

            // Draw the box plot vertical lines
            var verticalLines = g.selectAll(".verticalLines")
                .data(boxPlotData)
                .enter()
                .append("line")
                .attr("x1", function (datum) {
                    return xScale(datum.key) + barWidth / 2;
                })
                .attr("y1", function (datum) {
                    var whisker = datum.whiskers[0];
                    return yScale(whisker);
                })
                .attr("x2", function (datum) {
                    return xScale(datum.key) + barWidth / 2;
                })
                .attr("y2", function (datum) {
                    var whisker = datum.whiskers[1];
                    return yScale(whisker);
                })
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("fill", "none");

            // Draw the boxes of the box plot, filled in white and on top of vertical lines
            var rects = g.selectAll("rect")
                .data(boxPlotData)
                .enter()
                .append("rect")
                .attr("width", barWidth)
                .attr("height", function (datum) {
                    var quartiles = datum.quartile;
                    var height = yScale(quartiles[0]) - yScale(quartiles[2]);
                    return height;
                })
                .attr("x", function (datum) {
                    return xScale(datum.key);
                })
                .attr("y", function (datum) {
                    return yScale(datum.quartile[2]);
                })
                .attr("fill", function (datum) {
                    return datum.color;
                })
                .attr("stroke", "#000")
                .attr("stroke-width", 1);

            g.selectAll("rect")
                .on("mouseover", function (d, i) {
                    //console.log(d, i);
                    d3.select(this).attr("stroke", "blue").attr("stroke-width", 0.8);
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);

                    div.html("<table><tr><td>Group:</td><td>" + d.key +
                            "</td></tr><tr><td>Max:</td><td align='right'>" + (d.whiskers[1] * 100).toFixed(2) +
                            "%</td></tr><tr><td>Q3:</td><td align='right'>" + (d.quartile[2] * 100).toFixed(2) +
                            "%</td></tr><tr><td>Median:</td><td align='right'>" + (d.quartile[1] * 100).toFixed(2) +
                            "%</td></tr><tr><td>Q1:</td><td align='right'>" + (d.quartile[0] * 100).toFixed(2) +
                            "%</td></tr><tr><td>Min:</td><td align='right'>" + (d.whiskers[0] * 100).toFixed(2) +
                            "%</td></tr></table>")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    //.style("left", (window.pageXOffset + matrix.e + 15) + "px")
                    //.style("top", (window.pageYOffset + matrix.f - 30) + "px");;
                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("stroke", "pink").attr("stroke-width", 0.2);
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", function (d, i) {
                    //console.log("open Modal");
                    stackedBC[index].drawStackedBarChart(json, i,
                        d3.select("#replicationSlider" + index).property("value") - 1);
                    $("#stackedBC" + index).modal();
                });

            // Now render all the horizontal lines at once - the whiskers and the median
            var horizontalLineConfigs = [
            // Top whisker
                {
                    x1: function (datum) {
                        return xScale(datum.key)
                    },
                    y1: function (datum) {
                        return yScale(datum.whiskers[0])
                    },
                    x2: function (datum) {
                        return xScale(datum.key) + barWidth
                    },
                    y2: function (datum) {
                        return yScale(datum.whiskers[0])
                    }
                },
            // Median line
                {
                    x1: function (datum) {
                        return xScale(datum.key)
                    },
                    y1: function (datum) {
                        return yScale(datum.quartile[1])
                    },
                    x2: function (datum) {
                        return xScale(datum.key) + barWidth
                    },
                    y2: function (datum) {
                        return yScale(datum.quartile[1])
                    }
                },
            // Bottom whisker
                {
                    x1: function (datum) {
                        return xScale(datum.key)
                    },
                    y1: function (datum) {
                        return yScale(datum.whiskers[1])
                    },
                    x2: function (datum) {
                        return xScale(datum.key) + barWidth
                    },
                    y2: function (datum) {
                        return yScale(datum.whiskers[1])
                    }
                }
            ];

            for (var i = 0; i < horizontalLineConfigs.length; i++) {
                var lineConfig = horizontalLineConfigs[i];

                // Draw the whiskers at the min for this series
                var horizontalLine = g.selectAll(".whiskers")
                    .data(boxPlotData)
                    .enter()
                    .append("line")
                    .attr("x1", lineConfig.x1)
                    .attr("y1", lineConfig.y1)
                    .attr("x2", lineConfig.x2)
                    .attr("y2", lineConfig.y2)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1)
                    .attr("fill", "none");
            }

            // Setup a scale on the left
            var axisLeft = d3.axisLeft(yScale);
            axisG.append("g")
                .call(axisLeft.ticks(null, 's').tickFormat(function (d) {
                return d3.format(".0f")(d * 100);
            }));
            // Setup a series axis on the bottom
            var axisBottom = d3.axisBottom(xScale);
            axisBG.append("g")
                .call(axisBottom);

            // text label for the x axis
            svg.append("text")
                .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height + margin.bottom) + ")")
                .style("text-anchor", "middle")
                .attr("font-weight", "bold")
                .text("Operator Name");

            // text label for the y axis
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0) // - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .attr("font-weight", "bold")
                .text("Average Utilization (%)");

        });
    };

    return {
        visualize : visualize
    };
})();
