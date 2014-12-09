var _gaq = _gaq || [];
var d;

function convert() {
    d.convert();
}

$(document).ready(function(){
  var widthOffset = 355;
  var heightOffset = 35;

  d = new DataConverter('converter', 'datadescrip');

  var sidebar = $('#header');

  var win = $(window);
  var w = win.width() - widthOffset;
  var h = win.height() - heightOffset;

  d.create(w,h);

  $(window).bind('resize',function() {  
      w = win.width() - widthOffset;
      h = win.height() - heightOffset;
      d.resize(w,h);
      sidebar.height(h);
    });

  $(".settingsElement").change(updateSettings);

  function updateSettings (evt) {
    
    if (evt) {
      _gaq.push(['_trackEvent', 'Settings',evt.currentTarget.id ]);
    };

console.log ("updateSettings>");
    d.headersProvided = $('#headersProvidedCB').attr('checked');

    if (d.headersProvided) {
      $("input[name=headerModifications]").removeAttr("disabled");

      var hm = $('input[name=headerModifications]:checked').val();
      if (hm === "downcase") {
        d.downcaseHeaders = true;
        d.upcaseHeaders = false;
      } else if (hm === "upcase") {
        d.downcaseHeaders = false;
        d.upcaseHeaders = true;
      } else if (hm === "none") {
        d.downcaseHeaders = false;
        d.upcaseHeaders = false;
      }
    } else {
      $("input[name=headerModifications]").attr("disabled", "disabled");
    }
    
    d.delimiter = $('input[name=delimiter]:checked').val();
    d.decimal = $('input[name=decimal]:checked').val();
    
    d.useUnderscores = true;
    
    d.convert();  // convert will also call d.draw()
  };


  updateSettings();
  
});

