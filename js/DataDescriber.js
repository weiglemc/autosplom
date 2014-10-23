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
  var uniqueCol = {};
  
  outputText += "numItems: " + numRows + "\n";
  outputText += "numDim: " + numColumns + "\n";

  for (var j=0; j < numColumns; j++) {
    // look at each dimension  
    uniqueCol[j] = true;
    var rowInd = 0;
    while (uniqueCol[j] == true && rowInd < (numRows-1)) {
      // look at each item
      for (var i=rowInd+1; i<numRows; i++) {
        if (dataGrid[rowInd][j] == dataGrid[i][j]) {
          uniqueCol[j] = false; 
          break;
        }
      }
      rowInd++;
    }
  }
  
  outputText += "\n";
  for (var j=0; j < numColumns; j++) {
    outputText += headerNames[j] + " : " + headerTypes[j];
    if (headerTypes[j] == "string") { 
      outputText += " - categorical";
    } else if (headerTypes[j] == "float") { 
      outputText += " - quantitative";
    } else if (headerTypes[j] == "int") { 
      outputText += " - ordinal";
    }
    
    if (uniqueCol[j]) {
      outputText += " - UNIQUE";
      if (headerTypes[j] == "string") {
        outputText += " - KEY";
      }
    }
    
    outputText += "\n";
  }

  // need to get the info about UNIQUE and KEY into the dataGrid or another data structure

  return outputText;
}
