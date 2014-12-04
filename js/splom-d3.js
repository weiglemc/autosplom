function genSPLOM(data) 
{
    // input: [ {header1: row1/1, header2: row1/2}, 
    //          {header1: row2/1, header2: row2/2}

    console.log("genSPLOM> data");
    console.dir(data);

    // remove datatype description rows from data
    var metadata = data.splice(-2,2);

console.log("metadata:");
console.dir(metadata);

    /*
     * AFTER THIS POINT:
     *  data - just the key:value pairs for the data points
     *  metadata[0] - key:value pairs for the data type (categorical, quantitative, ...)
     *  metadata[1] - key:value pairs for the uniqueness (unique, key, no)
     *  dims - array of key names to be plotted
     *  p[d.x] - x data value for this circle - inside plot()
     */

    // Set up SPLOM grid
    var	size = 150,
	padding = 19.5;
    
    var x = d3.scale.linear()
	    .range([padding / 2, size - padding / 2]);
    
    var y = d3.scale.linear()
	    .range([size - padding / 2, padding / 2]);
    
    var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .ticks(5);
    
    var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(5); // Note: ticks(5) is just a suggestion, d3 figures this out
    
    var color = d3.scale.category10();


    // Determine dims to plot.  
    var maxDims = 5,  // maximum number of dimensions
	dims = [];

// TODO: Add selector to let user choose dims

/*	// hack for testing data
	dims = d3.keys(data[0]).filter(function (d) {
	    return (d === "Retail Price" || d === "Weight" || 
		    d === "City MPG" || d === "HP" || d === "Hwy MPG");});
*/
	var numDims = 0;
	for (var prop in metadata[0]) {
	    if (metadata[0][prop] === "ordinal" || metadata[0][prop] === "quantitative") {
		dims.push(prop);
		numDims++;
		if (numDims == maxDims) {
		    break;
		}
	    }
	}
    var n = dims.length;

console.log ("dims: " + dims);

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    // clear old graph first
    d3.select("#splom").selectAll("svg").remove();

    var svg = d3.select("#splom").append("svg")
	    .attr("width", size * n + padding)
	    .attr("height", size * n + padding)
	    .append("g")
	    .attr("transform", "translate(" + padding + "," + padding / 2 + ")");
 
    var domainByDim = {};
    dims.forEach(function(dim) {
	domainByDim[dim] = d3.extent(data, function (d) {return d[dim];});
console.log ("domainByDim[" + dim + "]: " + domainByDim[dim]);
    });

    svg.selectAll(".x.axis")
	.data(dims)
	.enter().append("g")
	.attr("class", "x axis")
	.attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
	.each(function(d) { x.domain(domainByDim[d]); d3.select(this).call(xAxis); });
    
    svg.selectAll(".y.axis")
	.data(dims)
	.enter().append("g")
	.attr("class", "y axis")
	.attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
	.each(function(d) { y.domain(domainByDim[d]); d3.select(this).call(yAxis); });
    
    // find grouping column - categorical in metadata[0] and !key in metadata[1]
    var categorical = d3.set();
    for (var prop in metadata[0]) {
	// add categorical types to set
	if (metadata[0][prop] === "categorical") {categorical.add(prop);}
    }
    for (var prop in metadata[1]) {
	// remove any that are listed as key
	if (categorical.has(prop) && metadata[1][prop] == "key") {categorical.remove(prop);}
    }
    var grouping = categorical.values()[0];   // grab the 1st one
    console.log ("grouping: " + grouping);

    // find key column - key in metadata[1]
    var key;
    for (var prop in metadata[1]) {
	if (metadata[1][prop] === "key") {
	    key = prop;
	    break;
	}
    }

    var cell = svg.selectAll(".cell")
	    .data(cross(dims, dims))
	    .enter().append("g")
	    .attr("class", "cell")
	    .attr("transform", function(d) { 
		return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
	    .each(plot);
    
    // Titles for the diagonal.
    cell.filter(function(d) { return d.i === d.j; }).append("text")
	.attr("x", padding)
	.attr("y", padding)
	.attr("dy", ".71em")
	.text(function(d) { return d.x; });

// TODO: generate histogram on the diagonal
    
    function plot(p) {
	var cell = d3.select(this);
	
	x.domain(domainByDim[p.x]);
	y.domain(domainByDim[p.y]);

	var tooltip = d3.select("body")
	      .append("div")
	      .style("font-size", "10pt")
	      .style("background-color", "white")
	      .style("position", "absolute")
              .style("z-index", "10")
              .style("visibility", "hidden");
	
	cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);
	
	cell.selectAll("circle")
            .data(data)
	    .enter().append("circle")
            .attr("cx", function(d) { return x(d[p.x]); })
            .attr("cy", function(d) { return y(d[p.y]); })
            .attr("r", 3)
            .style("fill", function(d) { return color(d[grouping]); })
	    .on ("mouseover", function () {return tooltip.style("visibility", "visible");})
	    .on ("mousemove", function (d) {
		var keyLabel = d[key];
		var tip = keyLabel + " " + p.x + ": " + d[p.x] + " " + p.y +
			": " + d[p.y];
		return tooltip.style("top", (d3.event.pageY-10)+"px")
		    .style("left", (d3.event.pageX+10)+"px")
		    .text(tip);
	    })
	    .on ("mouseout", function () {return tooltip.style("visibility", "hidden");});
    }

    function cross(a, b) {
	var c = [], n = a.length, m = b.length, i, j;
	for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
	return c;
    }
    
    d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

}

