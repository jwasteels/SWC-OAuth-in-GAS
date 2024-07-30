//Dependency: getUID() (in Profile.js)

const scriptStorage = PropertiesService.getScriptProperties();
const scriptCache = CacheService.getScriptCache();
const storePrefix = 'SWC_token_'
const cacheTime = 3600

/**
 * Fetches the token object of a specific user from storage by UID
 * @param {string} uid the uid in 1:* format by which the token is to be retrieved
 * @return {object} the token object
 */
function getTokenFromGlobal(uid) {
    var tokenName = storePrefix+uid
    var cachedToken = getTokenFromCache(uid);
    if (cachedToken != false) {
        return cachedToken;
    }
    try {
        var tokenString = scriptStorage.getProperty(tokenName);
        //Logger.log('token string: ' + tokenString);
        var tokenObject = JSON.parse(tokenString);
        //Logger.log(tokenObject);
        if (tokenObject == null ) {
            return false;
        } else {
        return tokenObject;
        }
    } catch(e) {
        Logger.log('Failed to get token for user ' + uid + ': ' +e)
        return false;
    }
}

function getAvailableTokens() {
    try {
        var data = scriptStorage.getProperties();
        for (var i in data) {
            Logger.log('Key: %s,Value: %s',i,data[i])
        }
    } catch(e) {
        Logger.log('Failed to get tokens: ' +e)
        return false;
    }
}

function saveTokenToGlobal(tokenObject) {
    var uid = tokenObject.UID;
    var handle = tokenObject.handle;
    Logger.log('attempting to save token for user '+ handle + '(' + uid + ')');
    var tokenObjectCache = getTokenFromCache(uid);
    if (tokenObject == tokenObjectCache) {
        Logger.log('Identical token already stored in cache for '+uid);
        return true;
    }
    var tokenObjectOld = getTokenFromGlobal(uid);
    if (tokenObject == tokenObjectOld) {
        Logger.log('No change in token detected trying to save token for '+uid);
        return true;
    } else {
        try {
            var tokenName = storePrefix+uid;
            var tokenString = JSON.stringify(tokenObject);
            scriptStorage.setProperty(tokenName,tokenString);
            updateAccounts(tokenObject);
            return true;
        } catch(e) {
            Logger.log('Could not save token: '+e);
            return false;
        }
    }
}

function removeTokenFromGlobal (uid='undefined'){
    var tokenName = storePrefix+uid;
    try {
        scriptStorage.deleteProperty(tokenName);
        removeAccount(uid);
        return true;
    } catch(e) {
        Logger.log('Failed to remove token for user ' + uid + ': ' + e);
        return false;
    }
}

/**
 * Fetches the token object of a specific user from storage by name
 * @param {string} name the handle of the characcter of whom the token is to be retrieved
 * @return {object} the token object
 */
 function getTokenFromGlobalByName(name) {
    var uid = getUID(name);
    var tokenObject = getTokenFromGlobal(uid);
    return tokenObject;
}

/**
 * Fetches the token object of a specific user from storage by name
 * @param {string} name the handle of the characcter of whom the token is to be retrieved
 * @return {object} the token object
 */
 function getTokenFromGlobalByMail(email) {
    try {
        var data = scriptStorage.getProperties();
        for (var i in data) {
            var tempOpbject = JSON.parse(data[i]);
            if (tempOpbject.email == email) {return tempOpbject}
        }
    } catch(e) {
        Logger.log('Failed to any tokens: ' +e)
        return false;
    }
}


//Cached functions start here


/**  Fetches the token object of a specific user from cache by UID
 * @param {string} uid the uid in 1:* format by which the token is to be retrieved
 * @return {object} the token object
 */
function getTokenFromCache(uid) {
    var tokenName = storePrefix+uid;
    try {
        var tokenString = scriptCache.get(tokenName);
        var tokenObject = JSON.parse(tokenString);
        if (tokenObject == null ) {
            return false;
        } else {
        return tokenObject;
        }
    } catch(e) {
        Logger.log('Could not retrieve token for ' + uid + ' from cache: ' +e);
        return false
    }
}


function saveTokenToCache(tokenObject) {
    var uid = tokenObject.UID;
    Logger.log('attempting to cache token for user '+ uid);
    try {
            var tokenName = storePrefix+uid;
            var tokenString = JSON.stringify(tokenObject);
            scriptCache.put(tokenName,tokenString,cacheTime);
            Logger.log('Token cached');
            return true;
        } catch(e) {
            Logger.log('Could not save token: '+e);
            return false;
        }
}