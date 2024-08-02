function exampleAuthorization() {
  var scope = []
  scope.push('CHARACTER_READ');
  scope.push('PERSONAL_INV_OVERVIEW');
  scope.push('PERSONAL_INV_SHIPS_READ');
  scope.push('PERSONAL_INV_SHIPS_RENAME');

  getAuthorization(scope);
}

function exampleReadShip() {
  var ship = getShip(-1);
  try {
    var shipObject ={}
    shipObject.uid = ship.uid;
    shipObject.name = ship.name;
    shipObject.typeName = ship.type.value;
    shipObject.image = ship.images.small;
    shipObject.ownerName = ship.owner.value;
    var html = `
    A random ship from ` + shipObject.ownerName + `'s inventory
    <p>The ` + shipObject.name + `, a ` + shipObject.typeName + ` with UID ` + shipObject.uid + `.
    <br/>Image:
    <br/><img src="` + shipObject.image + `">`;
    var htmlOutput = HtmlService
    .createHtmlOutput(html)
    .setWidth(350)
    .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Output popup'); 

  } catch(e) {
    SpreadsheetApp.getUi().alert('Error getting ship: ' + e)
  }

}

function exampleWriteShip() {
  //Generate a random number to use twice
  var random = Math.floor(Math.random() * 50) + 1;
  Logger.log('Random number: ' + random);
  var newName = 'SWC WS with OAuth in GAS is fun';
  var reason = 'testing Google Apps Script';
  //get current Gooel user's access token
  var userEmail = Session.getActiveUser().getEmail();
  var tokenObject = getTokenFromGlobalByMail(userEmail);
  var accessToken = getAccessTokenByToken(tokenObject);

  //Get random ship
  var ship = getShip(random);
  var oldName = ship.name;
  //build url:
  var url = 'https://www.swcombine.com/ws/v2.0/inventory/ships/' + ship.uid + '/name/';
  
  //build parameters
  var params = {};
  params.new_value = newName;
  params.reason = reason;
  var headers = {
    Authorization: 'OAuth ' + accessToken
  };
  var options = {
    "headers" : headers,
    "method" : "POST",
    "payload":params,
    "muteHttpExceptions": true
  };
  
  //Execute API
  var result = retrieveJSON(url,options);
 
  //Process results
  if (result == false) {
    SpreadsheetApp.getUi().alert('Something went wrong, check the log for API response');
  } else {
    ship = getShip(random);
    try {
      var shipObject ={}
      shipObject.uid = ship.uid;
      shipObject.name = ship.name;
      shipObject.typeName = ship.type.value;
      shipObject.image = ship.images.small;
      shipObject.ownerName = ship.owner.value;
      var html = `
      The ship ` + oldName + ` from ` + shipObject.ownerName + `'s inventory was renamed to: 
      <p>The ` + shipObject.name + `, a ` + shipObject.typeName + ` with UID ` + shipObject.uid + `.
      <br/>Image:
      <br/><img src="` + shipObject.image + `">`;
      var htmlOutput = HtmlService
      .createHtmlOutput(html)
      .setWidth(350)
      .setHeight(300);

      SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Output popup'); 

    } catch(e) {
      SpreadsheetApp.getUi().alert('Error getting ship: ' + e)
    }
  }
  
}

function getShip(order) {
  if (order == -1) {
    order = Math.floor(Math.random() * 50) + 1;
    Logger.log('Random number: ' + order);
  }
  var userEmail = Session.getActiveUser().getEmail();
  var tokenObject = getTokenFromGlobalByMail(userEmail);
  var uid = tokenObject.UID;
  var accessToken = getAccessTokenByToken(tokenObject)
  //var profile = getSWCProfile();
  //var uid = profile.UID;
  var api = 'https://www.swcombine.com/ws/v2.0/inventory/' + uid + '/ships/owner/';
  //var accessToken = getAccessTokenByUID(uid);
  var headers = {
    Authorization: 'OAuth ' + accessToken
  };
  var options = {
    "headers": headers,
    "method" : "GET",
    "muteHttpExceptions": true
  };
  var response = retrieveJSON(api,options);
  var result = response.swcapi.entities.entity[order].value;
  return result;
}
