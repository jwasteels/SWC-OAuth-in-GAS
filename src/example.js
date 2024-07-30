function exampleAuthorization {
  var scope = []
  scope.push('CHARACTER_READ');
  scope.push('PERSONAL_INV_OVERVIEW');
  scope.push('PERSONAL_INV_SHIPS_READ');
  scope.push('PERSONAL_INV_SHIPS_WRITE');

  getAuthorization(scope);
}

function exampleReadShip {

}

function exampleWriteShip {
  var newName = 'This ship was renamed through the SWC Oauth in GAS example script';
  


}
