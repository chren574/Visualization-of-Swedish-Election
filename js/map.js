function map(data) {

    // Global varibale
    CURRMUN = "Upplands Väsby";

    var scaleDiv = 0.80;

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 8])
        .on("zoom", move);

    var mapDiv = $("#map");

    var margin = { top: 20, right: 20, bottom: 20, left: 20 },
        width = mapDiv.width() - margin.right - margin.left,
        height = mapDiv.height() - margin.top - margin.bottom;

    //initialize tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var projection = d3.geo.mercator()
        .center([40, 62])
        .scale(850);

    var svg = d3.select("#map").append("svg")
        .attr("width", width*scaleDiv)
        .attr("height", height*scaleDiv)
        //.attr("style", "outline: thin dotted black;")
        .style("border", "1px solid black")
        .call(zoom);

    var path = d3.geo.path()
        .projection(projection);

    g = svg.append("g");

    // load data and draw the map
    d3.json("data/sweden_mun.topojson", function(error, sweden) {

        var mun = topojson.feature(sweden, sweden.objects.swe_mun).features;

        draw(mun, data);

    });

    function draw(mun, electionData) {

        self.electionData = electionData;
        var year = document.getElementById("year").value;

        var mun = g.selectAll(".swe_mun").data(mun);
        var colorOfParty = partyColor(electionData, year);


        mun.enter().insert("path")
            .attr("class", "mun")
            .attr("d", path)
            .attr("title", function(d) {
                return d.properties.name;
            })
            .style("fill", function(d, i) {
                var index = 0;
                for (var l = 0; l < colorOfParty.length; ++l) {
                    // Compare region-name
                    if (d.properties.name == colorOfParty[l].reg) {
                        index = l;
                        break;
                    }

                };
                return color.get(colorOfParty[index].par);
            })
            .attr("stroke-width", 0.1)
            .attr("stroke", "black")

        /*          // Fungerar inte, css krånglar
                    //tooltip
                    .on("mousemove", function(d) {
                        tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    })
                    .on("mouseout", function(d) {
                        tooltip.transition()
                        .duration(200)
                        .style("opacity", 0); 
                    }) 
        */
        .on("click", function(d) {

            //console.log($('#map').click());
/*
            d3.selectAll(".mun")
                .style("stroke", "black")

            d3.select(this)
                .style("stroke", "white")
*/
            selectedMun(d.properties.name);

        })

        .on('mouseover', function(d) {
                d3.select(this)
                    .style('stroke-width', .5);
            })
            .on('mouseout', function(d) {
                d3.selectAll('path')
                    .style('stroke-width', 0.1);
            });

    }

    this.colorByYear = function(electionYear) {

        //var year = document.getElementById("year").value;
        //console.log(electionYear);
        year = electionYear;

        donut1.drawMun(currentMun(CURRMUN), electionYear);

        var colorOfParty = partyColor(electionData, year);

        g.selectAll(".mun").each(function(p) {

            var point = d3.select(this);
            point.style("fill-opacity", 1)

            point.style("fill", function(d) {

                var index = NaN;
                for (var l = 0; l < colorOfParty.length; ++l) {
                    // Compare region-name
                    if (d.properties.name == colorOfParty[l].reg) {
                        index = l;
                        break;
                    }
                };
                //console.log(index)
                if (!isNaN(index)) {
                    return color.get(colorOfParty[index].par);
                } else {
                    return color.get("Odefinierad");
                }

            });

        });
    }

    this.colorByParty = function(electionYear, party) {

        year = electionYear;

        // TEMP
        if (!party) {
            var party = CURRMUN
        };

        var nested_data = d3.nest()
            .key(function(d) {
                return d.parti;
            })
            .sortValues(function(a, b) {
                return b[year] - a[year];
            })
            .entries(electionData);

        nested_data = nested_data.filter(function(d) {
            return d.key == party;
        })

        var len = nested_data[0].values.length;

        var max, min;
        max = parseFloat(nested_data[0].values[0][year]);
        min = parseFloat(nested_data[0].values[len - 1][year]);

        g.selectAll(".mun").each(function(p) {

            var point = d3.select(this);

            point.style("fill", function(d) {
                for (var i = 0; i < len; ++i) {

                    var region = nested_data[0].values[i];

                    if (d.properties.name == region.region) {

                        return !(isNaN(region[year])) ? color.get(party) : "white";

                    }
                };
            })

            point.style("fill-opacity", function(d) {

                var opac = 0;
                for (var i = 0; i < len; ++i) {

                    var region = nested_data[0].values[i];
                    // Compare region-name
                    if (d.properties.name == region.region) {

                        opac = (parseFloat(region[year]) - min) / (max - min);
                        break;
                    }
                };

                return opac;
            });
        });

    }

    function currentMun(mun) {

        if (mun) {
            CURRMUN = mun;
            return CURRMUN;
        } else {
            return CURRMUN;
        }

    }

    function partyColor(electionData, year) {

        var nested_data = d3.nest()
            .key(function(d) {
                return d.region;
            })
            .sortValues(function(a, b) {
                return b[year] - a[year];
            })
            .entries(electionData);

        var colorOfParty = [];

        nested_data.forEach(function(d) {

            d.values.sort(compare);

            colorOfParty.push({ reg: d.values[0].region, par: d.values[0].parti });
        });
        return colorOfParty;
    }

    function compare(a, b) {
        var year = document.getElementById("year").value;
        //var year = $('#year').slider('getValue')

        if (isNaN(a[year]) && isNaN(b[year]))
            return 0;
        else if (isNaN(a[year]) && !(isNaN(b[year])))
            return 1;
        else if (!(isNaN(a[year])) && isNaN(b[year]))
            return -1;
        else if (a[year] < b[year])
            return 1;
        else if (a[year] > b[year])
            return -1;
        else
            return 0;
    }

    function getYear(year) {
        return year;
    }

    //zoom and panning method
    function move() {

        var t = d3.event.translate;
        var s = d3.event.scale;

        zoom.translate(t);
        g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

    }

    // Sends the name of the mun to other .js-files
    function selectedMun(mun) {

        var electionYear = $('#year').slider('getValue');

        donut1.drawMun(currentMun(mun), electionYear);



    }
}