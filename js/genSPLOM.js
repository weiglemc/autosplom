function genSPLOM(data, dims, grouping, key)
{
    /*
     *  data - just the key:value pairs for the data points
     *   [ {header1: row1/1, header2: row1/2},
     *    {header1: row2/1, header2: row2/2} ... ]
     *  dims - array of key names to be plotted
     *  grouping - column header to group by color
     *  key - column header for the key
     *  p[d.x] - x data value for this circle - inside plot()
     */

console.log("genSPLOM>");
//console.log("data:");
//console.dir(data);

console.log("key: " + key);
console.log("grouping: " + grouping);

    // clear old graph first
    d3.select("#splom").selectAll("svg").remove();

    // Set up SPLOM grid
    var size = 150,
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

    var n = dims.length;

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

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

    var cell = svg.selectAll(".cell")
      .data(cross(dims, dims))
      .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) {
    return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

    // titles for the diagonal
    cell.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

    function plot(p) {
  var tooltip = d3.select("body")
        .append("div")
        .style("font-size", "10pt")
        .style("background-color", "white")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

  console.log(domainByDim);
  x.domain(domainByDim[p.x]);
  y.domain(domainByDim[p.y]);

  var cell = d3.select(this);

  cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

  // special styling for diagonal
  cell.selectAll("rect").filter(function(d) {return d.i === d.j;})
      .style("fill", "#ddd")
      .style("fill-opacity", 0.3);

  if (p.x !== p.y) {
    cell.selectAll("circle")
              .data(data)
        .enter().append("circle")
              .attr("cx", function(d) { return x(d[p.x]); })
              .attr("cy", function(d) { return y(d[p.y]); })
              .attr("r", 3)
              .style("fill", function(d) { return color(d[grouping]); })
        .on ("mouseover", function () {return tooltip.style("visibility", "visible");})
        .on ("mousemove", function (d,i) {
      var keyLabel = (key === "item")? "item " + i : d[key];
      var tip = "[" + keyLabel + "] " + p.x + ": " + d[p.x] + " " + p.y +
        ": " + d[p.y];
      return tooltip.style("top", (d3.event.pageY-10)+"px")
        .style("left", (d3.event.pageX+10)+"px")
        .text(tip);
      })
      .on ("mouseout", function () {return tooltip.style("visibility", "hidden");});
    }
    else {
      var dataSet, uniqueDataSet, result;
      dataSet = [];
      result = [];
      for (var i = data.length - 1; i >= 0; i--) {
        dataSet.push(data[i][p.x]);
      };
      uniqueDataSet = dataSet.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
      range = domainByDim[p.x];
      rangeDiff = range[1] - range[0];
      unitRange = rangeDiff/data.length;
      if (uniqueDataSet.length > 5) {
        min = range[0];
        for (var i = data.length - 1; i >= 0; i--) {
          max = min + unitRange;
          count = dataSet.filter(function(value){
                          return value >= min && value < max;
                      }).length;
          curRange = range[0] + (count)*unitRange;
          result.push({
            'key': (min+max)/2,
            'position': curRange,
            'count': count,
            'range':[min, max]
          })
          min = max;
        };
      } else {
        for (var i = uniqueDataSet.length - 1; i >= 0; i--) {
          count = dataSet.filter(function(value){
                          return value === uniqueDataSet[i];
                      }).length;
          curRange = range[0] + (count)*unitRange;
          result.push({
            'key': uniqueDataSet[i],
            'position': curRange,
            'count': count
          })
        };

      }

      cell.selectAll("circle")
              .data(result)
        .enter().append("circle")
              .attr("cx", function(d) { return x(d['key']); })
              .attr("cy", function(d) { return y(d['position']); })
              .attr("r", 3)
              .style("fill", function(d) { return color(d[grouping]); })
        .on ("mouseover", function () {return tooltip.style("visibility", "visible");})
        .on ("mousemove", function (d,i) {
      if (!d['range']) {
        var tip = "[" + p.x + "] value " + d['key'] + " occurs " + d['count'] + " times";
      }
      else {
        var tip = "[" + p.x + "] value in range " + d['range'][0].toPrecision(4) + '-' + d['range'][1].toPrecision(4) + " occurs " + d['count'] + " times";
      }
      return tooltip.style("top", (d3.event.pageY-10)+"px")
        .style("left", (d3.event.pageX+10)+"px")
        .text(tip);
      })
      .on ("mouseout", function () {return tooltip.style("visibility", "hidden");});
    }
  }

    function cross(a, b) {
  var c = [], n = a.length, m = b.length, i, j;
  for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
  return c;
    }

    d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");

}

