//  DataConverter.js
//  based on converter.js from Mr-Data-Converter
//
//  Created by Shan Carter on 2010-09-01.
//
//  Edited by Michele Weigle on 2014-09-24
//  to fit into the Auto SPLOM framework

function DataConverter(nodeId, descripId) {

  //---------------------------------------
  // PUBLIC PROPERTIES
  //---------------------------------------

  this.nodeId                 = nodeId;
  this.node                   = $("#"+nodeId);

  this.descripId              = descripId;
  this.descrip                = $("#"+descripId);

  this.columnDelimiter        = "\t";
  this.rowDelimiter           = "\n";

  this.inputTextArea          = {};

  this.inputHeader            = {};
  this.dataSelect             = {};

  this.inputText              = "";

  this.headersProvided        = true;
  this.downcaseHeaders        = true;
  this.upcaseHeaders          = false;

  this.data = [];
  this.dims = [];
  this.headerNames = [];
  this.key = "item";
  this.grouping = "none";

}

//---------------------------------------
// PUBLIC METHODS
//---------------------------------------

DataConverter.prototype.create = function(w,h) {
  var self = this;

  // build HTML for converter
  this.inputHeader = $('<div class="groupHeader" id="inputHeader"><p class="groupHeadline">Input CSV or tab-delimited data. <span class="subhead"> Using Excel? Simply copy and paste. No data on hand? <a href="#" id="insertSample">Use sample</a></span></p></div>');
  this.inputTextArea = $('<textarea class="textInputs" id="dataInput"></textarea>');

  this.node.append(this.inputHeader);
  this.node.append(this.inputTextArea);

  $("#insertSample").bind('click',function(evt){
    evt.preventDefault();
    self.insertSampleData();
    self.convert();
    _gaq.push(['_trackEvent', 'SampleData','InsertGeneric']);
  });

  $("#dataInput").keyup(function() {self.convert();});
  $("#dataInput").change(function() {self.convert();});

  this.resize(w,h);
};


DataConverter.prototype.resize = function(w,h) {
    var paneWidth = w;
    var paneHeight = ((h-90)/3)-20;

    this.node.css({width:paneWidth});
    this.inputTextArea.css({width:paneWidth-20,height:paneHeight});

    $("#splom").css({top: paneHeight+75});
};


DataConverter.prototype.convert = function() {

    this.inputText = this.inputTextArea.val();

    //make sure there is input data before converting...
    if (this.inputText.length <= 0) {
	return;
    }

    CSVParser.resetLog();
    var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);

    var dataGrid = parseOutput.dataGrid;
    var headerTypes = parseOutput.headerTypes;
    this.headerNames = parseOutput.headerNames;

    var numRows = dataGrid.length;
    var numColumns = this.headerNames.length;
    var keyRow = [];

    for (var j=0; j < numColumns; j++) {
      // look at each dimension  
      keyRow[j] = "unique";
      var rowInd = 0;
      while (keyRow[j] === "unique" && rowInd < (numRows-1)) {
	  // look at each item
	  for (var i=rowInd+1; i<numRows; i++) {
              if (dataGrid[rowInd][j] == dataGrid[i][j]) {
		  keyRow[j] = "no"; 
		  break;
              }
	  }
	  rowInd++;
      }
   
      // look at each int dimension (binary or not)
      if (headerTypes[j] === "int") {
	  var binary = true;
	  for (var i=rowInd+1; i<numRows; i++) {
	      if (dataGrid[i][j] != 0 && dataGrid[i][j] != 1) {
		  binary = false;
	      }
	  }
	  if (binary && keyRow[j] !== "unique") {
	      headerTypes[j] = "binary";
	  }
      }
    }

    for (var j=0; j < numColumns; j++) {
      if (keyRow[j] === "unique" && headerTypes[j] === "string") {
	  keyRow[j] = "key";
      }

      // replace (int, float, string) type with (categorical, quantitative, ordinal, binary)
      if (headerTypes[j] === "string") {
	  headerTypes[j] = "categorical";
      } else if (headerTypes[j] === "float") {
	  headerTypes[j] = "quantitative";
      } else if (headerTypes[j] === "int") {
	  headerTypes[j] = "ordinal";
      }
    }

    // convert the dataGrid array to JSON-like format
    // INPUT: headerNames = [header names]
    //        dataGrid = data
    //        headerTypes = [header types]
    //        keyRow = [key, unique info]
    // OUTPUT: data = [ {header1: row1/1, header2: row1/2}, 
    //           {header1: row2/1, header2: row2/2}
    this.data = [];
    for (var i=0; i<dataGrid.length; i++) {
	// rows
	var tempRow = {};
	for (var j=0; j<numColumns; j++) {
	    // columns
	    var header = this.headerNames[j];
	    if ((headerTypes[j] === "ordinal" || 
		 headerTypes[j] === "quantitative") && i<j) {
		// make sure numbers are saved as numbers
		tempRow[header] = +dataGrid[i][j];
	    } else {
		tempRow[header] = dataGrid[i][j];
	    }
	}
	this.data.push(tempRow);
    }
    // add in metadata
    var tempRow1 = {}, tempRow2 = {};
    for (var j=0; j<numColumns; j++) {
	var header = this.headerNames[j];
	tempRow1[header] = headerTypes[j];
	tempRow2[header] = keyRow[j];
    }
    this.data.push(tempRow1);
    this.data.push(tempRow2);

    // remove datatype description rows from data
    //    metadata[0] - key:value pairs for the data type (categorical, ...)
    //    metadata[1] - key:value pairs for the uniqueness (unique, key, no)
    var metadata = this.data.splice(-2,2);

//console.log("DataConverter> data:");
//console.dir(this.data);

//console.log("DataConverter> metadata:");
//console.dir(metadata);

    // find key: key in metadata[1]
    // find grouping column: categorical in metadata[0] and !key in metadata[1]
    for (var prop in metadata[0]) {
	if (metadata[1][prop] === "key") {
	    this.key = prop;
	} else if (metadata[0][prop] === "categorical") {
	    this.grouping = prop;
	    metadata[1][prop] = "grouping";
	}
    }

console.log ("grouping: " + this.grouping);
console.log ("key: " + this.key);

    // Determine which dims to display
    var maxDims = 5,  // default max number of dimensions
	numDims = 0;
    this.dims = [];
    for (var prop in metadata[0]) {
	if (metadata[0][prop] === "ordinal" || 
	    metadata[0][prop] === "quantitative") {
	    this.dims.push(prop);
	    numDims++;
	    if (numDims == maxDims) { break; }
	}
    }

console.log ("dims: " + this.dims);

    // Create form for selecting dims
    var maxStrLen = 25;
    var dimText = "<h3 id='dims'>Dimensions</h3>" + 
	    "<p style='font-size:9pt; margin-left:8px;'>Columns: " + numColumns +
	    "&nbsp; &nbsp;Rows: " + numRows;
    var formText = dimText + "<form id='dimsForm'>";
    for (var i=0; i<numColumns; i++) {
	var header = this.headerNames[i];
	var id = "dim" + i;
	var checked = (this.dims.indexOf(header) != -1)?"checked":"";
	formText += "<p>&nbsp; <label><input class='dimsElement' " + 
	    "type='checkbox' id='" + id + "' " + 
	    checked + "/> " + 
	    header.substr(0,maxStrLen) + 
	    ((header.length>maxStrLen)?"...":"") + "</label>";
	formText += "<span style='font-size:9pt;'> - " + 
	    metadata[0][header] + "</span></p>";
    }

    // add drop-down selector for key
    formText += "<p>&nbsp; </p><p><label>Key: <select class='dimsElement' id='key'>";
    for (var i=0; i<numColumns; i++) {
	var header = this.headerNames[i];
	var id = "key"+i;
	formText += "<option value='" + id + "' id='" + id + "' " +
	    ((metadata[1][header]==="key")?"selected":"") + ">"+ 
	    header + "</option>";
    }
    formText += "</select></label></p>";

    // add drop-down selector for grouping
    formText += "<p><label>Color: <select class='dimsElement' id='grouping'>";
    for (var i=0; i<numColumns; i++) {
	var header = this.headerNames[i];
	var id = "group"+i;
	formText += "<option value='" + id + "' id='" + id + "' " + 
	    ((metadata[1][header]==="grouping")?"selected":"") + ">" + 
	    header + "</option>";
    }
    formText += "</select></label></p></form>";

    this.descrip.html(formText);

    $(".dimsElement").change(this, function(evt) {
	// sends 'this' to the function as evt.data
	if (evt) {
	    _gaq.push(['_trackEvent', 'Dims',evt.currentTarget.id ]);
	};
	updateDims(evt.data, evt.currentTarget.id);
    });

    this.draw();   // make sure the plot gets drawn
};


function updateDims (d, id) {    
//console.log ("updateDims> " + id);


    if (id == "key") {
	// check key drop-down
	var option = $('#key').val();   // returns key1, key2, ...
	var ind = option.substring(3);  // strip off "key"
	d.key = d.headerNames[ind];
    } else if (id == "grouping") {
	// check grouping drop-down
	var option = $('#grouping').val(); // returns group1, group2, ...
	var ind = option.substring(5);     // strip off "group"
	d.grouping = d.headerNames[ind];
    } else {
	// check checkboxes
	var numColumns = d.headerNames.length;
	d.dims = [];
	for (var i=0; i<numColumns; i++) {
	    var id = "dim" + i;
	    if ($('#'+id).attr('checked')) {
		var header = d.headerNames[i];
		d.dims.push(header);
	    }
	}
    }	

    d.draw();
};


DataConverter.prototype.draw = function() {
//console.log ("draw>");
    genSPLOM (this.data, this.dims, this.grouping, this.key);
};


DataConverter.prototype.insertSampleData = function() {
  val = "Manufacturer,Vehicle Name,Small/Sporty/Compact/Large Sedan,Sports Car,SUV,Wagon,Minivan,Pickup,AWD,RWD,Retail Price,Dealer Cost,Engine Size (l),Cyl,HP,City MPG,Hwy MPG,Weight,Wheel Base,Len,Width\n";
  val += "Acura,Acura 3.5 RL 4dr,1,0,0,0,0,0,0,0,43755,39014,3.5,6,225,18,24,3880,115,197,72\n";
  val += "Acura,Acura 3.5 RL w/Navigation 4dr,1,0,0,0,0,0,0,0,46100,41100,3.5,6,225,18,24,3893,115,197,72\n";
  val += "Acura,Acura MDX,0,0,1,0,0,0,1,0,36945,33337,3.5,6,265,17,23,4451,106,189,77\n";
  val += "Audi,Audi A4 1.8T 4dr,1,0,0,0,0,0,0,0,25940,23508,1.8,4,170,22,31,3252,104,179,70\n";
  val += "Audi,Audi A6 3.0 4dr,1,0,0,0,0,0,0,0,36640,33129,3,6,220,20,27,3561,109,192,71\n";
  val += "BMW,BMW 325Ci 2dr,1,0,0,0,0,0,0,1,30795,28245,2.5,6,184,20,29,3197,107,177,69\n";
  val += "BMW,BMW 530i 4dr,1,0,0,0,0,0,0,1,44995,41170,3,6,225,20,30,3472,114,191,73\n";
  val += "Buick,Buick Rainier,0,0,1,0,0,0,1,0,37895,34357,4.2,6,275,15,21,4600,113,193,75\n";
  val += "Buick,Buick LeSabre Custom 4dr,1,0,0,0,0,0,0,0,26470,24282,3.8,6,205,20,29,3567,112,200,74\n";
  val += "Cadillac,Cadillac Seville SLS 4dr,1,0,0,0,0,0,0,0,47955,43841,4.6,8,275,18,26,3992,112,201,75\n";
 this.inputTextArea.val (val);
};


