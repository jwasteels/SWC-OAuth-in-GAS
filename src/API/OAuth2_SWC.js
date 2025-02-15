
 const expirationDelay = 60; //This is what is used by the SWC code
 const authorizationBaseUrl = 'https://www.swcombine.com/ws/oauth2/auth/'
 const tokenBaseUrl = 'https://www.swcombine.com/ws/oauth2/token/'



/**
 * Performs the initial authentication of the user with the required scope: builds the authorization url and opens it
 */
function getAuthorization(scope=['CHARACTER_READ']) {
  var response_type = 'code';
  var state = ScriptApp.newStateToken()
    .withMethod('handleAuthorization')
    .withTimeout(3600);
    var stateToken=state.createToken();
    //Logger.log(stateToken);
  var access_type = 'offline'; //set to 'offline' if you want the script to act on its own, like for automated updates
  //var renew = '&renew_previously_granted=yes'; //uncomment this if needed
  var renew= '';
  scope = scope.join(' ');
 
  var url = authorizationBaseUrl + '?scope='+ scope + '&state='+stateToken + '&response_type='+response_type+'&redirect_uri='+redirect_uri+'&access_type='+access_type+'&client_id='+CLIENT_ID+renew;
  Logger.log('Full authorization url: '+url);
  openUrl(url);

}

/**
 * Handle the response of getAuthorization() by using the code response to fetch an access_token and refresh_token. 
 * Stores the result in storage.
 * @param {*} request response delivered by the SWC OAuth service 
 */
function handleAuthorization(request) {
  Logger.log ('Incoming request: '+ request);
  var code = null; //set code as null
  // get code from request if available
  try {
    code = request.parameter.code
    Logger.log('Initial authorization code: '+ code);
  } catch(e) {
    try {e = request.paramter.error} catch(error) {}
    Logger.log('No code in request: '+e)
  }
  //use code to get tokens if available
  if (code !== null) {
    var param = {
      "code":code, //authorization code from initial getAuthorization request
      "client_id":CLIENT_ID, //see above
      "client_secret":CLIENT_SECRET, //see above
      "redirect_uri": redirect_uri, 
      'grant_type':'authorization_code',
      'access_type':'offline' //'offline' to receive a refresh_token as well in the response
    }
    
    var options = {
      "method" : "POST",
      "payload":param,
      "muteHttpExceptions": true
    };
    tokenJSON = retrieveJSON(tokenBaseUrl, options)
    Logger.log('Token response: '+ tokenJSON);
    var tokenObject = buildObjectFromTokenJSON(tokenJSON);
    //Enrich the token with profile information
    var profile = getSWCProfileByToken(tokenObject);
    tokenObject.handle = profile.handle;
    tokenObject.UID = profile.UID;
    tokenObject.faction = profile.faction;
    tokenObject.factionUID  = profile.factionUID;
    tokenObject.email = Session.getActiveUser().getEmail();
    //Store or update the token object in global storage
    Logger.log('Token object: '+tokenObject);
    var storeResult = saveTokenToGlobal(tokenObject);
    Logger.log('Result of the save action: ' + storeResult);
    return HtmlService.createHtmlOutput('Success! You can close this tab.<br>');
    } else {
      return HtmlService.createHtmlOutput('Denied. You can close this tab');
    }
}

/**
 * Returns the redirect URI that will be used for a given script. Often this URI
 * needs to be entered into a configuration screen of your OAuth provider.
 * @param {string=} optScriptId The script ID of your script, which can be
 *     found in the Script Editor UI under "File > Project properties". Defaults
 *     to the script ID of the script being executed.
 * @return {string} The redirect URI.
 */
 function getRedirectUri(optScriptId) {
  var scriptId = optScriptId || ScriptApp.getScriptId();
  Logger.log('https://script.google.com/macros/d/' + encodeURIComponent(scriptId) +
  '/usercallback')
  return 'https://script.google.com/macros/d/' + encodeURIComponent(scriptId) +
    '/usercallback';
   
}


/**
 * Retrieve access token from storage, test its expiration, and fetch new access token if needed
 * @param {string} name Name of the character or faction
 * @param {integer} type 1=character (default), 2=faction 
 * @return {string} a valid access token
 */
function getAccessTokenByName(name = default_user, type=1) { //You can set a default character here
  //If faction: fetch appropriate character
  if (type==2) {
    name = findinDB(name,accountRange, 3);
    uid = findinDB(name,accountRange, 4, 3);
    if (uid == false) {
      Logger.log('No user found for faction ' + name);
      return false
    }
  } else {
    //Retrieve token object from storage
    var uid = getUID(name);
  }
  var tokenObject = getTokenFromGlobal(uid)
  if (tokenObject == false) {
    Logger.log('No token stored for ' + name);
    return false;
  }
  var accessToken = getAccessTokenByToken(tokenObject);
  Logger.log('Access token for %s: %s',name,accessToken);
  return accessToken;
}


/**
 * Retrieve access token from storage, test its expiration, and fetch new access token if needed
 * @param {string} uid uid of the character
 * @return {string} a valid access token
 */
function getAccessTokenByUID(uid='') {
  if (uid == '') {
    return false;
  }
  var tokenObject = getTokenFromGlobal(uid)
  var accessToken = getAccessTokenByToken(tokenObject);
  Logger.log('Access token for %s: %s',uid,accessToken);
  return accessToken
}

/**
 * Retrieve access token from storage, test its expiration, and fetch new access token if needed
 * @param {object} tokenObject object containing an access token, expiration data and refresh token
 * @return {string} a valid access token
 */
 function getAccessTokenByToken(tokenObject) {
  var accessToken = tokenObject.accessToken;
  //Test expiration
  var expiresAt = Number(tokenObject.expiresAt);
  var now = Math.floor(Date.now()/1000);
  if (now<expiresAt+expirationDelay) {
    //Not expired: return token
    return accessToken;
  } else {
    //Expired: get new token
    var newTokenObject = useRefreshToken(tokenObject);
    if (newTokenObject != false) {
      var newAccessToken = newTokenObject.accessToken;
      return newAccessToken;
    }
    return false;
  }
  //return accessToken;
}

/**
 * Use a refresh token to obtain a new access token, update existing token
 * @param {object} tokenObject the object containing an expired access token and a refresh token
 * @return {object} the updated token object
 */
function useRefreshToken(tokenObject) {
  var refreshToken = tokenObject.refreshToken;  
  var param = {
      "refresh_token":refreshToken, 
      "client_id":CLIENT_ID, //see above
      "client_secret":CLIENT_SECRET, //see above
      "redirect_uri": redirect_uri, 
      'grant_type':'refresh_token',
      //'access_type':'offline' //'offline' to receive a refresh_token as well in the response
    }
    
    var options = {
      "method" : "POST",
      "payload":param,
      "muteHttpExceptions": true
    };
    //var response = UrlFetchApp.fetch(url, options);
    var tokenJSON = retrieveJSON(tokenBaseUrl, options)
    if (tokenJSON == false) {
      //Line below doesn't work, not sure why?
      SpreadsheetApp.getActiveSpreadsheet().toast("Did not receive the proper JSON response. If you are " + tokenObject.handle +" please perform new authentication.","⚠️ Error using the refresh token",30);
      Logger.log('Error getting the refresh token: did not receive JSON response code 200')
      return false;
    } else {
      tokenObject=buildObjectFromTokenJSON(tokenJSON,tokenObject);
      //Store or update the token object in global storage
      Logger.log('Token object: '+ tokenObject);
      var storeResult = saveTokenToGlobal(tokenObject);
      updateAccounts(tokenObject);
      Logger.log('Result of the save action: ' + storeResult);
      return tokenObject;
    }

  //On failure, go to getAuthorization();
}
/**
 * Process a JSON response to get updated token information to build/update a tokenObject
 * @param {JSON response} JSON the JSON response when getting tokens from the server
 * @param {object} tokenObject optional, when updating an existing token
 * @returns {object} tokenObject
 */
function buildObjectFromTokenJSON (JSON, tokenObject={}) {
  var token = JSON;
  try {tokenObject.accessToken = token.access_token;} catch(e) {Logger.log('No access token: '+e)}
  try {
    tokenObject.expiresIn = token.expires_in;
    tokenObject.expiresAt = Math.floor(Date.now()/1000) + Number(tokenObject.expiresIn);
  } catch(e) {Logger.log('No expiration: '+e)}
  try {tokenObject.scope = token.scope;} catch(e) {Logger.log('No scope: '+e)}
  try {tokenObject.refreshToken =  token.refresh_token;} catch(e) {Logger.log('No refresh token: '+e)}
  return tokenObject;
}
