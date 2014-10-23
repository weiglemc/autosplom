//
//  converter.js
//  Mr-Data-Converter
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

  this.outputDataType         = "json";

  this.columnDelimiter        = "\t";
  this.rowDelimiter           = "\n";

  this.inputTextArea          = {};
  this.descripTextArea        = {};

  this.inputHeader            = {};
  this.descripHeader          = {};
  this.dataSelect             = {};

  this.inputText              = "";
  this.descripText            = "";

  this.newLine                = "\n";
  this.indent                 = "  ";

  this.commentLine            = "//";
  this.commentLineEnd         = "";

  this.useUnderscores         = true;
  this.headersProvided        = true;
  this.downcaseHeaders        = true;
  this.upcaseHeaders          = false;
  this.includeWhiteSpace      = true;
  this.useTabsForIndent       = false;

}

//---------------------------------------
// PUBLIC METHODS
//---------------------------------------

DataConverter.prototype.create = function(w,h) {
  var self = this;

  // build HTML for description output
  var descripHeaderText = '<br/><p class="settings">Data Description</p>';
  this.descripHeader = $(descripHeaderText);
  this.descrip.append(this.descripHeader);

  this.descripTextArea = $('<textarea class="textInputs" id="datadescrip"></textarea>');
  this.descrip.append(this.descripTextArea);
  this.descripTextArea.click(function(evt){this.select();});
 
  //build HTML for converter
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

  $("#dataInput").keyup(function() {self.convert()});
  $("#dataInput").change(function() {
    self.convert();
    _gaq.push(['_trackEvent', 'DataType',self.outputDataType]);
  });

  $("#dataSelector").bind('change',function(evt){
       self.outputDataType = $(this).val();
       self.convert();
     });

  this.resize(w,h);
}

DataConverter.prototype.resize = function(w,h) {

  var paneWidth = w;
  var paneHeight = (h-90)/2-20;

  this.node.css({width:paneWidth});
  this.inputTextArea.css({width:paneWidth-20,height:paneHeight});
}

DataConverter.prototype.convert = function() {

  this.inputText = this.inputTextArea.val();
  this.descripText = "";

  //make sure there is input data before converting...
  if (this.inputText.length > 0) {

    if (this.includeWhiteSpace) {
      this.newLine = "\n";
      // console.log("yes")
    } else {
      this.indent = "";
      this.newLine = "";
      // console.log("no")
    }

    CSVParser.resetLog();
    var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);

    var dataGrid = parseOutput.dataGrid;
    var headerNames = parseOutput.headerNames;
    var headerTypes = parseOutput.headerTypes;
    var errors = parseOutput.errors;

    this.descripText = DataDescriber(dataGrid, headerNames, headerTypes);
    this.descripTextArea.val(errors + this.descripText);

      // splom-d3 will need the dataGrid, headerNames, headerTypes, and other info

  }; //end test for existence of input text
}


DataConverter.prototype.insertSampleData = function() {
//  this.inputTextArea.val("NAME\tVALUE\tCOLOR\tDATE\nAlan\t12\tblue\tSep. 25, 2009\nShan\t13\t\"green\tblue\"\tSep. 27, 2009\nJohn\t45\torange\tSep. 29, 2009\nMinna\t27\tteal\tSep. 30, 2009");
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
}


