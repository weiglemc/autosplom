function genSPLOM(data) 
{
    // input: [ {header1: row1/1, header2: row1/2}, 
    //          {header1: row2/1, header2: row2/2}

    console.log("genSPLOM> data");
    console.dir(data);

    var width = 960,
	size = 150,
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
	    .ticks(5);

    var color = d3.scale.category10();

    var n = 4;   // set the number of dimensions statically for now

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    // clear old graph first
    d3.select("#splom").selectAll("svg").remove();

    var svg = d3.select("#splom").append("svg")
	    .attr("width", size * n + padding)
	    .attr("height", size * n + padding)
	    .append("g")
	    .attr("transform", "translate(" + padding + "," + padding / 2 + ")");
 
    var typeInd = data.length;
    var keyInd = data.length;

    var domainByDim = {}, 
//	dims = d3.keys(data[0]), 
// hack for testing data
	dims = d3.keys(data[0]).filter(function (d) {
	    return (d === "Retail Price" || d === "Weight" || 
		    d === "City MPG" || d === "HP");});
	n = dims.length;

console.log ("dims: " + dims);
console.log ("n: " + n);

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
    
    // remove datatype description rows from data
    var mydata = data.splice(-2,2);

console.log("mydata:");
console.dir(mydata);

// find grouping column - categorical in mydata[0] and !key in mydata[1]
// need to look at keys or something?

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
    
    function plot(p) {
	var cell = d3.select(this);
	
	x.domain(domainByDim[p.x]);
	y.domain(domainByDim[p.y]);
	
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
// ADD - on hover to show data
//            .style("fill", "black");
	// this is known, but we'll need to determine it dynamically
	// it's the categorical column that's not a key
            .style("fill", function(d) { return color(d.Manufacturer); });
    }

    function cross(a, b) {
	var c = [], n = a.length, m = b.length, i, j;
	for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
	return c;
    }
    
    d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

}

/*
d3.csv("flowers.csv", function(error, data) {
  var domainByTrait = {},
      traits = d3.keys(data[0]).filter(function(d) { return d !== "species"; }),
      n = traits.length;

  traits.forEach(function(trait) {
    domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
  });

  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);

    // clear old graph first
    d3.select("#splom").selectAll("svg").remove();

  var svg = d3.select("#splom").append("svg")
      .attr("width", size * n + padding)
      .attr("height", size * n + padding)
    .append("g")
      .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

  svg.selectAll(".x.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
      .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

  svg.selectAll(".y.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

  var cell = svg.selectAll(".cell")
      .data(cross(traits, traits))
    .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function plot(p) {
    var cell = d3.select(this);

    x.domain(domainByTrait[p.x]);
    y.domain(domainByTrait[p.y]);

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
        .style("fill", function(d) { return color(d.species); });
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }

  d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
});
}
*/
