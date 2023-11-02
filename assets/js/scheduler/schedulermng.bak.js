import cronstrue from 'cronstrue';

$(function() {
  


  $('ul.tabs li').click(function(){
      var tab_id = $(this).attr('data-tab');
  
      $('ul.tabs li').removeClass('current');
      $('.tab-content').removeClass('current');
  
      $(this).addClass('current');
      $("#"+tab_id).addClass('current');
    });
  
  var year = new Date().getFullYear();	
  $('#inputCrondatetime').attr('min', year+"-01-01T00:00"); 
  $('#inputCrondatetime').attr('max', year+"-12-31T11:59"); 

  $(".cron").on('click', function() {
    const timeDict = {
      "minute":0,
      "hour":1,
      "Day-month":2,
    };
    console.log($(this).val(), $(this).attr("class").split(" ")[1] ,timeDict[$(this).attr("class").split(" ")[1]])
    cron = $("#userCron").val().split(" ")
    cron[timeDict[$(this).attr("class").split(" ")[1]]] = "*/"+$(this).val()
    $("#userCron").val(cron.join(" "))
    $("#output").text(cronstrue.toString($("#userCron").val(), { locale: "ko" }));
  });

  $('.radio-value').on('click', function() {
    var valueCheck = $(this).val();
    if ( valueCheck.split(' ')[1] == 'Auto' ) {
        $('#'+valueCheck.split(' ')[0]).attr('disabled', true); 
        $('#'+valueCheck.split(' ')[0]).focus();
    } else {
        $('#'+valueCheck.split(' ')[0]).val('');
        $('#'+valueCheck.split(' ')[0]).attr('disabled', false);
    }
  });
  $('.inputCron').on('change', function() {
    var inputVal = $(this).val();



    $("#userCron").val(inputVal)
    $("#output").text(cronstrue.toString($("#userCron").val(), {locale:"ko"}));
  });

  $('.inputCrondatetime').on('change', function() {
    var inputVal = $(this).val();

    var MM = inputVal.split("T")[0].split("-")[1].replace(/(^0+)/, "")
    var DD = inputVal.split("T")[0].split("-")[2].replace(/(^0+)/, "")
    var HH = inputVal.split("T")[1].split(":")[0].replace(/(^0+)/, "")
    var mm = inputVal.split("T")[1].split(":")[1].replace(/(^0+)/, "")

    $("#userCron").val(''.concat(mm,' ',HH,' ',DD,' ',MM,' *'));
    $("#output").text(cronstrue.toString($("#userCron").val(), {locale:"ko"}));
  });

  $('input[type="radio"]').on('change', function() {
    c = $("input[name='minute']:checked").val()
    console.log($("input[name='minute']:checked").val())
    $('li[class=section-'+c+'] > *').not("input[type='radio']").attr('disabled', true).prop('disabled',true);
  });
     

});

