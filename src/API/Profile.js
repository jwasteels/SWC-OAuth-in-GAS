/**
 * Gets a user's SWC profile based on name, or currect user if known
 * @param {string} handle Name of the character to look up
 * @returns {object} profile containing name and UID of the character and their faction
 */
function getSWCProfile(handle='') {  
  if (handle == '') { //no handle provided, so check if active user is known
    var userEmail = Session.getActiveUser().getEmail();
    var tokenObject = getTokenFromGlobalByMail(userEmail);
    if (tokenObject != false) { //active user is known, get profile based on stored data
      var profileObject = getSWCProfileByToken(tokenObject);
    } else { //active user is new, require authorisation then retry
      getAuthorization();
      Utilities.sleep(1000);
      var result = SpreadsheetApp.getUi().alert('Waiting for authorization from user '+ userEmail + ', press OK to continue or cancel to stop. Please make sure you\'re not blocking popups.',SpreadsheetApp.getUi().ButtonSet.OK_CANCEL)
      if (result == SpreadsheetApp.getUi().Button.OK) {getSWCProfile()}
    }
  } else { //handle provided, get public profile info with default access token
    tokenObject = getTokenFromGlobalByName(default_user); //Default user goes here as defined as constant
    var profileObject = getSWCProfileByToken(tokenObject,handle);
  }  
  return profileObject;
  
}

/**
 * Gets a user's SWC profile based on a provided token object, name
 * @param {string} handle Name of the character to look up. Default to the tokenObject holder
 * @param {object} tokenObject object containing the token to use in the API call. 
 * @returns {object} profile containing name and UID of the character and their faction
 */
 function getSWCProfileByToken(tokenObject, name='') {
  var accessToken = getAccessTokenByToken(tokenObject);
  var api = 'https://www.swcombine.com/ws/v2.0/character/';
  if (name != '') {api += name + '/'}
  var headers = {
    Authorization: 'OAuth ' + accessToken
  };
  var options = {
    "headers": headers,
    "method" : "GET",
    "muteHttpExceptions": true
  };
  var response = retrieveJSON(api,options);
  var profileObject = {}
  profileObject.handle = profileJSON.name
  profileObject.UID = profileJSON.uid
  profileObject.faction = profileJSON.faction.value
  profileObject.factionUID = profileJSON.faction.attributes.uid
  
  return profileObject;
  
}
/**
 * Gets a character's UID from the Accounts table, if not available from Handlecheck API
 * @param {string} name handle of the character to lookup
 * @returns {string} UID in X:XXX format
 */
function getUID(name) {
  var UID = findinDB(name,accountRange,4,3);
  if (UID == false) {
    var api = 'https://www.swcombine.com/ws/v2.0/character/handlecheck/'+name+'/';
    var options = {
      "method" : "GET",
      "muteHttpExceptions": true
    };
    var response = retrieveJSON(api, options);
    var UID = response.character.uid;
  }
  return UID;
}

/**
 * Populate the 'last active profile' with profile data. Deprecated?
 */
function loadActiveProfile() {
  try {
    var profile = getSWCProfile();
    const ProfileSheetName = 'Dashboard'
    SpreadsheetApp.setActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ProfileSheetName))
    SpreadsheetApp.getActiveSheet().getRange('_SWC_CharName').setValue(profile.handle)
    SpreadsheetApp.getActiveSheet().getRange('_SWC_FactionName').setValue(profile.faction)
    SpreadsheetApp.getActiveSheet().getRange('_SWC_CharUID').setNumberFormat('@').setValue(profile.UID)
    SpreadsheetApp.getActiveSheet().getRange('_SWC_FactionUID').setNumberFormat('@').setValue(profile.factionUID)
    var SWCtime = getSWCTime()
    var SWCTimeString = stringifyCGT(SWCtime);
    SpreadsheetApp.getActiveSheet().getRange('_SWC_ProfileUpdate').setValue(SWCTimeString);
  } catch (e) {
    Utilities.sleep(1000);
    var result = SpreadsheetApp.getUi().alert('Waiting for authorization, press OK to continue or cancel to stop.',SpreadsheetApp.getUi().ButtonSet.OK_CANCEL)
    if (result == SpreadsheetApp.getUi().Button.OK) {loadActiveProfile()}
  }
}

/**
 * Just a quick little thing, also refreshed the token if needed
 */
function popupActiveUser() {
  var email = Session.getActiveUser().getEmail();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(accountSheetName);
  var range = sheet.getRange('A:Z');
  var uid = findinDB(email,range,4,9);
  if (uid != false) {
    var tokenObject = getTokenFromGlobal(uid);
  }

  try {
    SpreadsheetApp.getUi().alert(
      'Current user: '+ email +
      '\r\n Handle: ' + tokenObject.handle + ' (' + uid + ')' +
      '\r\n Faction: ' + tokenObject.faction + ' (' + tokenObject.factionUID + ')' +
      '\r\n access token: ' + getAccessTokenByToken(tokenObject) + 
      '\r\n expires at: ' + stringifyCGT(getSWCTime('',tokenObject.expiresAt)) + ' (it is now ' + stringifyCGT(getSWCTime()) + ')' +
      '\r\n refresh token: ' + tokenObject.refreshToken
    )
  } catch(e) {
    SpreadsheetApp.getUi().alert('Error getting user: ' + e)
  }
  
}
/**
 * Blanks the lines of the 'active profile'
 */
function clearActiveProfile() {
  const ProfileSheetName = 'Dashboard'
  SpreadsheetApp.setActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ProfileSheetName))
  SpreadsheetApp.getActiveSheet().getRange('_SWC_CharName').setValue('')
  SpreadsheetApp.getActiveSheet().getRange('_SWC_FactionName').setValue('')
  SpreadsheetApp.getActiveSheet().getRange('_SWC_CharUID').setValue('')
  SpreadsheetApp.getActiveSheet().getRange('_SWC_FactionUID').setValue('')
  SpreadsheetApp.getActiveSheet().getRange('_SWC_ProfileUpdate').setValue('');
  
}