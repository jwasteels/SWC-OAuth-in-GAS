/** convert cgt to timestamp or timestamp to CGT
   * if both are blank, return current CGT
   * @cgt string, Accepts Y##D### and Year ## Day ###(, ##:##(:##)) formats. If both are provided, this takes precedence
   * @time integer, real timestamp to convert
   */
function getSWCTime(cgt='',time='') {
  var api = 'https://www.swcombine.com/ws/v2.0/api/time/'
  var param = {}
  if (cgt!='') {
    param = {
      'cgt':cgt
    }  
  } else if (time!='') {
    param = {
      'time':time
    }  
  }
  var options = {
    'method':'post',
    'payload':param
  }
  var result = retrieveJSON(api,options);
  if (cgt!=='') {
    return result.swcapi.timestamp;
    
  } else {
    var SWCTime = {}
    SWCTime.Year = result.swcapi.years
    SWCTime.Day = result.swcapi.days
    SWCTime.Hour = result.swcapi.hours
    SWCTime.Minute = result.swcapi.mins
    SWCTime.Second = result.swcapi.secs
    return SWCTime
  } 
}

/**
 * Turn CGT object into a formatted string
 * @param {object} cgtObject 
 * @returns string with fixed format for CGT
 */
function stringifyCGT(cgtObject) {
  var cgtString;
  var cgtYear = cgtObject.Year||cgtObject.years;
  var cgtDay = cgtObject.Day||cgtObject.days||'0';
  while (cgtDay.toString().length<3) {
    cgtDay = '0'+cgtDay;
  } 
  var cgtHour = cgtObject.Hour||cgtObject.hours||'0';
  if (cgtHour.toString().length < 2) {cgtHour = '0'+cgtHour}
  var cgtMinute = cgtObject.Minute||cgtObject.mins||'0';
  if (cgtMinute.toString().length < 2) {cgtMinute = '0'+cgtMinute}

  cgtString = 'Y'+cgtYear+'D'+cgtDay+' '+cgtHour+':'+cgtMinute;
  return cgtString
}