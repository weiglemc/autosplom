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

/*  
console.log("dataGrid");
console.dir(dataGrid);
console.log("headerNames");
console.dir(headerNames);
console.log("headerTypes");
console.dir(headerTypes);
*/

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
    
    // assemble data
    data.push(headerNames);
    for (var j=0; j<numRows; j++) {
	data.push(dataGrid[j]);
    }
    data.push(headerTypes);
    data.push(keyRow);

console.log("DataDescriber> data:");
console.dir(data);

    return data;
}
