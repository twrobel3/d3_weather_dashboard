function makeScale(dMin,dMax,rMin,rMax){
    return d3.scale.linear().domain([dMin,dMax]).range([rMin,rMax]);
}

function tempBarGraph(svg, x, y, w, h, weatherData){
    var hours = weatherData.hourly_forecast;
    var temps = [];
    var feelslike = [];
    var humidity = [];
    var dates = [];
    //console.log(hours[0].temp.english);
    for(var i = 0; i<hours.length; i++){
        temps[i] = parseInt(hours[i].temp.english);
        feelslike[i] = parseInt(hours[i].feelslike.english);
        humidity[i] = parseInt(hours[i].humidity);
        dates[i] = hours[i].FCTTIME.pretty;
        //console.log(feelslike[i] + " at " + hours[i].humidity + "\% humidity");
        // console.log(feelslike[i]);
        //console.log(temps[i]);
    }

    var barPadding = 0;

    var dMin = d3.min(temps, function(d) { return d; })-1;
    dMin = Math.min(dMin, d3.min(feelslike, function(d) { return d; })-1);
    var dMax = d3.max(temps, function(d) { return d; })+1;
    dMax = Math.max(dMax, d3.max(feelslike, function(d) { return d; })+1);

    var yScale = makeScale(dMin,dMax,0,y);

    svg.on("mousemove", function(){
        // save selection of infobox so that we can later change it's position
        var infobox = d3.select(".infobox");
        // this returns x,y coordinates of the mouse in relation to our svg canvas
        var coord = d3.svg.mouse(this);
        // now we just position the infobox roughly where our mouse is
        infobox.style("left", coord[0] + - (250 * coord[0]/w)  + "px" );
        infobox.style("top", coord[1] + "px");
    });
        
    var area = d3.svg.area()
        .x(function(d,i){
            //console.log(i);
            return i * (w/feelslike.length) + x;
        })
        .y0(function(d){
            if(d > 0){
                return (y-yScale(d));
            }
            else{
                return y;
            }
        })
        .y1(y)
        .interpolate("basis");

    var curve = d3.svg.line()
        .x(function(d,i){
            //console.log(i);
            return i * (w/feelslike.length) + x;
        })
        .y(function(d){
            if(d > 0){
                return (y-yScale(d));
            }
            else{
                return y;
            }
        })
        .interpolate("basis");

    var gradient = svg.append("svg:defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#F00")
        .attr("stop-opacity", 0.5);   

    gradient.append("svg:stop")
        .attr("offset", "25%")
        .attr("stop-color", "#FF0")
        .attr("stop-opacity", 0.45);

    gradient.append("svg:stop")
        .attr("offset", "50%")
        .attr("stop-color", "#0F0")
        .attr("stop-opacity", 0.4);

    gradient.append("svg:stop")
        .attr("offset", "75%")
        .attr("stop-color", "#0FF")
        .attr("stop-opacity", 0.45);

    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#00F")
        .attr("stop-opacity", 0.5);

    svg.append("svg:path")
        .attr("d",area(feelslike))
        .attr("stroke-width", "0")
        .attr("stroke", "rgba(0,0,0,0.5)")
        .attr("fill", "url(#gradient)");

    var humidColor = d3.interpolateRgb("#eed0a0","#305179");
    //var humidColor = d3.interpolateRgb("#000000","#ffffff");
    var humidScale = makeScale(d3.min(humidity), d3.max(humidity), 0, 1);

    var graph = svg.selectAll("rect")
        .data(temps)
        .enter()
        .append("rect")
        .attr("x", function(d,i){
            return i * (w/temps.length) + x;
        })
        .attr("y", function(d){
            return y-yScale(d);
        })
        .attr("width", ((i+1) * (w/temps.length)) - (i * (w/temps.length)) - barPadding)
        .attr("height", function(d){
            return yScale(d);
        })
        .attr("fill", function(d,i){
            return humidColor(humidScale(humidity[i]));
        })
        .attr("opacity", "1.0")
        .on("mouseover", function(){
            var bar = d3.select(this);
            bar.attr("opacity", "1.0");
            bar.attr("stroke", "black");
            bar.attr("stroke-width", "2");

            var box = d3.select(".infobox");
            //We know this is the lazy way, and we should scale, but this is the easy way, and we need this done soon.
            var index = parseInt((bar.attr("x") - x) * feelslike.length / w);

        document.getElementById("info").innerHTML = "" + dates[index] + "<br />" +
                "Temperature: "+  temps[index] + " degrees<br />" +
                "Feels Like: " + feelslike[index] + " degrees<br />" +
                "Humidity: " + humidity[index] + "%";
            //d3.select("p").text();
            d3.select(".infobox").style("display", "block");
        })
        .on("mouseout", function(){
            var bar = d3.select(this);
            bar.attr("opacity", "1.0")
            .attr("stroke", "none");

            d3.select(".infobox").style("display", "none");  
        });

        svg.append("svg:path")
        .attr("d",curve(feelslike))
        .attr("stroke-width", "3")
        .attr("stroke", "rgba(0,0,0,0.5)")
        .attr("fill", "none");

    draw_axis(svg, x, y, w, h, "Time(Hours)", "Temp", "", "", d3.min(temps), d3.max(temps));
}

function tide_graph(svg, x, y, w, h, tide){
    var hig = h;
    var wid = w;
    var barPadding = 1;
    var tide_heights = [];
    var next_tide = 0;

    for(i = 0; i < tide.tideSummary.length; i++){
        var tide_height = tide.tideSummary[i].data.height;
        if(tide_height === ""){
            //do nothing
        }else{
            // should have to use: parseFloat(tideH.slice(0,tideH.indexOf(' '))) but magic
            tide_heights[next_tide] = parseFloat(tide_height);
            next_tide = next_tide + 1;
            //console.log(tide_height);
        }
    }
    //console.log(tide_heights);

    svg.data(tide_heights);
    var tide_scale_circle = makeScale(d3.min(tide_heights), d3.max(tide_heights), hig/10, hig/2);
    var tide_unscale_circle = makeScale(hig/10, hig/2, d3.min(tide_heights), d3.max(tide_heights));
    var tide_scale_x = makeScale(0, tide_heights.length+1, x, wid);

    svg.on("mousemove", function(){
        // save selection of infobox so that we can later change it's position
        var infobox = d3.select(".infobox");
        // this returns x,y coordinates of the mouse in relation to our svg canvas
        var coord = d3.svg.mouse(this);
        // now we just position the infobox roughly where our mouse is
        infobox.style("left", coord[0] + - (250 * coord[0]/w)  + "px" );
        infobox.style("top", coord[1] + "px");
    });

    console.log(tide_heights);
    svg.selectAll("circle")
        .data(tide_heights)
        .enter()
        .append("circle")
        .attr("cx", function(d,i){
            return tide_scale_x(i+1);
        })
        .attr("cy", function(d){
            return hig/2;
        })
        .attr("r", function(d){
            return tide_scale_circle(d);
        })
        .attr("fill", "blue")
        .attr("opacity", "0.5")
        .on("mouseover", function(){
            var circle_sel = d3.select(this);
            circle_sel.attr("fill","0");
            circle_sel.attr("opacity", "1.0");

            var box = d3.select(".infobox");
            //We know this is the lazy way, and we should scale, but this is the easy way, and we need this done soon.
            var height = tide_unscale_circle(circle_sel.attr("r")).toFixed(2);
            document.getElementById("info").innerHTML = "Tide Height: " + height  + " ft";
            d3.select(".infobox").style("display", "block").style("margin-top", "100px");
        })
        .on("mouseout", function(){
            var circle_sel = d3.select(this);
            circle_sel.attr("fill","blue");
            circle_sel.attr("opacity", "0.5");
            d3.select(".infobox").style("display", "none");
        });


    var y_min = d3.min(tide_heights);
    var y_max = d3.max(tide_heights);
    draw_axis(svg, x, y, w, h, "Time", "Height", "", "", y_min, y_max);
}

function draw_axis(svg, x, y, width, height, x_label, y_label, x_min, x_max, y_min, y_max){

    //x axis
    svg.append("svg:line")
        .attr("x1",x)
        .attr("y1",y)
        .attr("x2",x + width)
        .attr("y2",y)
        .attr("stroke", "black");

    //tic marks on x
    var tic_jump = 10;
    var tic_height = 10;
    for(var i = x; i<(x+width); i = i + tic_jump){
        svg.append("svg:line")
            .attr("x1", i)
            .attr("y1",y - tic_height/2)
            .attr("x2", i)
            .attr("y2", y + tic_height/2)
            .attr("stroke", "black");
    }

    //y axis ends
    svg.append("svg:line")
        .attr("x1",x)
        .attr("y1",y)
        .attr("x2",x)
        .attr("y2",y-height)
        .attr("stroke", "black");

    //xlabel
    svg.append("svg:text")
        .attr("x", x + width/2)
        .attr("y", y+15)
        .text(x_label)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px");

    //x_min label
    svg.append("svg:text")
        .attr("x", x)
        .attr("y", y+15)
        .text(x_min)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px");

    //x_max label
    svg.append("svg:text")
        .attr("x", width - 10)
        .attr("y", y+15)
        .text(x_max)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px");


    //ylabel
    svg.append("svg:text")
        .attr("x", x-5)
        .attr("y", y - height/2)
        .text(y_label)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px");

    //y_min label
    svg.append("svg:text")
        .attr("x", x-5)
        .attr("y", y)
        .text(y_min)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px");

    //y_max label
    svg.append("svg:text")
        .attr("x", x-5)
        .attr("y", y - 9*height/10)
        .text(y_max)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px");
}

function showTideData(w, h, url){
    $.ajax({
        url: url,
        dataType: "jsonp",
        success: function(tideData) {
            var svg = d3.select("#graph")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
            var x = 60;
            var y = h/2;
            tide_graph(svg, x, y, w, h/2, tideData.tide);
        }
    });
}

function showTempData(w, h, url){
    $.ajax({
        url: url,
        dataType: "jsonp",
        success: function(weatherData) {
            var svg = d3.select("body")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
            var x = 40;
            var y = h - 20;
            tempBarGraph(svg, x, y, w, h, weatherData);
        }
    });

}
