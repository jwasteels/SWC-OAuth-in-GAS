function exampleAuthorization() {
  var scope = []
  scope.push('CHARACTER_READ');
  scope.push('PERSONAL_INV_OVERVIEW');
  scope.push('PERSONAL_INV_SHIPS_READ');
  scope.push('PERSONAL_INV_SHIPS_WRITE');

  getAuthorization(scope);
}

function exampleReadShip() {
  var profile = getSWCProfile();
  var uid = profile.UID;
  var api = 'https://www.swcombine.com/ws/v2.0/inventory/' + uid + '/ships/owner/';
  var accessToken = getAccessTokenByUID(uid);
  var headers = {
    Authorization: 'OAuth ' + accessToken
  };
  var options = {
    "headers": headers,
    "method" : "GET",
    "muteHttpExceptions": true
  };
  var response = retrieveJSON(api,options);
  var shipObject ={}
  shipObject.uid = response.swcapi.entities.entity[1].uid;
  shipObject.name = response.swcapi.entities.entity[1].name;
  shipObject.typeName = response.swcapi.entities.entity[1].type.value;
  shipObject.image = response.swcapi.entities.entity[1].images.small;

  try {
    SpreadsheetApp.getUi().alert(
      'A random ship from this user\'s inventory' +
      '\r\n The ' + shipObject.name + ', a ' + shipObject.typeName + ' with UID ' + shipObject.uid + '.' +
      '\r\n Image: ' +
      '\r\n <img src="' + shipObject.image + '">'
    )
  } catch(e) {
    SpreadsheetApp.getUi().alert('Error getting ship: ' + e)
  }

}

function exampleWriteShip() {
  var newName = 'This ship was renamed through the SWC Oauth in GAS example script';
  


}
