// 
//  DataDescriber.js
//  Based on DataGridRenderer.js, part of Mr-Data-Converter
//  
//  Created by Shan Carter on 2010-10-18.
//  Modified by Michele Weigle on 2014-09-19.
// 

function DataDescriber (dataGrid, headerNames, headerTypes) {
  //inits...
    var outputText = "";
    var numRows = dataGrid.length;
    var numColumns = headerNames.length;
    var keyRow = [];
    var data = [];

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

/*    
console.log("dataGrid");
console.dir(dataGrid);
console.log("headerNames");
console.dir(headerNames);
console.log("headerTypes");
console.dir(headerTypes);
console.log("keyRow");
console.dir(keyRow);
*/

    // convert the dataGrid array to JSON-like format
    // INPUT: headerNames = [header names]
    //        dataGrid = data
    //        headerTypes = [header types]
    //        keyRow = [key, unique info]
    // OUTPUT: data = [ {header1: row1/1, header2: row1/2}, 
    //           {header1: row2/1, header2: row2/2}
    for (var i=0; i<dataGrid.length; i++) {
	// rows
	var tempRow = {};
	for (var j=0; j<numColumns; j++) {
	    // columns
	    var header = headerNames[j];
	    if ((headerTypes[j] === "ordinal" || 
		 headerTypes[j] === "quantitative") && i<j) {
		// make sure numbers are saved as numbers
		tempRow[header] = +dataGrid[i][j];
	    } else {
		tempRow[header] = dataGrid[i][j];
	    }
	}
	data.push(tempRow);
    }
    // add in metadata
    var tempRow1 = {}, tempRow2 = {};
    for (var j=0; j<numColumns; j++) {
	var header = headerNames[j];
	tempRow1[header] = headerTypes[j];
	tempRow2[header] = keyRow[j];
    }
    data.push(tempRow1);
    data.push(tempRow2);
 
//console.log("data");
//console.dir(data);

    return data;
}
