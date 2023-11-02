import cronstrue from 'cronstrue';
import SumoSelect from 'sumoselect';
import 'cron-parser';

$(function() {

  $('.monthSelect').SumoSelect({
    placeholder: 'Every Month',
    triggerChangeCombined: true,
    clearAll: true,
    csvDispCount:0,
  });
  $('.daySelect').SumoSelect({
    placeholder: 'Every Day of Month',
    triggerChangeCombined: true,
    clearAll: true,
    csvDispCount:0,
  });
  $('.weekSelect').SumoSelect({
    placeholder: 'Every Day of Week',
    triggerChangeCombined: true,
    clearAll: true,
    csvDispCount:0,
  });
  $('.hourSelect').SumoSelect({
    placeholder: 'Every Day of Week',
    triggerChangeCombined: true,
    clearAll: true,
    csvDispCount:0,
  });
  $('.minuteSelect').SumoSelect({
    placeholder: 'Every Day of Week',
    triggerChangeCombined: true,
    clearAll: true,
    csvDispCount:0,
  });

  $('ul.tabs li').on("click", function(){
      var tab_id = $(this).attr('data-tab');
  
      $('ul.tabs li').removeClass('current');
      $('.tab-content').removeClass('current');
  
      $(this).addClass('current');
      $("#"+tab_id).addClass('current');
    });

  $('.cronselecter').on("change", function(){
    var cron = [
      $('#minuteSelect').val(),
      $('#hourSelect').val(),
      $('#daySelect').val(), 
      $('#monthSelect').val(),
      $('#weekSelect').val(),
    ]
    const cronText = cron.map(innerArr => innerArr.length > 0 ? innerArr.join(',') : '*').join(' ');
    console.log(cronText)
    cronInput(cronText)
    cronPredict(cronText)
    
    });
  

});


function cronInput(cronText){
  $('#userCron').val(cronText)
  $("#output").text(cronstrue.toString($("#userCron").val(), {locale:"ko"}))
}

function cronPredict(cronText){
  try {
    var parser = require('cron-parser');
    var interval = parser.parseExpression(cronText);
    $(".outputPredict1").text(interval.next().toString())
    $(".outputPredict2").text(interval.next().toString())
    $(".outputPredict3").text(interval.next().toString())
  } catch (err) {
    $(".outputPredict1").text("ERROR")
    $(".outputPredict2").text("")
    $(".outputPredict3").text("")
  }
}