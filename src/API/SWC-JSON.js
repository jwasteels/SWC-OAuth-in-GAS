/*************************************************************************/
/* Basic JSON fetching and parsing to be used to access the SWC API       */
/*************************************************************************/

//function to retrieve JSON file from a given url and return the document object
function retrieveJSON (url,options={}){
  var document
  var headers = {
    'Accept':'application/json'
  }
  options.muteHttpExceptions=true;
  options.headers=headers
  var response = UrlFetchApp.fetch(url, options)
  Logger.log(response)
  if(response.getResponseCode() == 200){
    var doc = response.getContentText();
    var object = JSON.parse(doc);
    return object
  } else {
    Logger.log('Did not expect response code: '+ response.getResponseCode());
    Logger.log(response);
    return false;
  }  
}

function getJSONDocumentProperties(JSONObject){
  //Return generic properties that are commonly used with SWCombine Web APP
  //Arguments of the element that are of interest are
  //count - number of items returned
  //total - the total number of items of this entity type in the SWCombine database
  //start - the index against the above total for the first item returned in this response
    var documentProperties = {}
    try {
      var subkeys = Object.keys(JSONObject.swcapi)
      for (i=0;i<subkeys.length;i++) {
        if (subkeys[i] !='filter') {var content = subkeys[i]}
      }
    } catch(e) {
      return null
    }
    try{
      documentProperties.count = JSONObject.swcapi[content].attributes.count
    }catch(e){
      return null
    }
    try{
      documentProperties.total = JSONObject.swcapi[content].attributes.total
    }catch(e){
      return null
    }
    try{
    documentProperties.start = JSONObject.swcapi[content].attributes.start
    }catch(e){
      return null
    }
    return documentProperties
  }

//Function that accepts a JSON object (should be the result from the API turned object) and validates that it is the correct type for further parsing
function validateJSON(JSONObject,validationData) {
  //simple validation is getting a list of attributes that the root object should have, and their values
  var validationResult =true
  for (var n = 0; n<validationData.length;n++){
    //First check that the attribute exists
    if (JSONObject[validationData[n].name] !== null){
      //attribute was not null thus exists, now compare the expected value
      var attribValue = JSONObject[validationData[n].name];
      if (attribValue!=validationData[n].value){
        validationResult = false;
        break;
      }
    }else {
      validationResult = false;
      break;
    }
  };
  return validationResult
}

  /** retrieves the variable entitytype (lowercase multiple) inventory of variable faction (name UID), granted by token
 * @start_index integer, default 1, to pull larger result in pieces
 * @item_count integer, default 200, same
 * @faction string, full faction name
 * @token string, active token for WS API access
 * @entitytype string lowercase, tested with "materials" and "stations"
 * @param string, filter to be applied on the search
 * @assign_type string, choice of "owner", "commander" or "pilot"
 * */
function retrieveFactionInventoryJSON(start_index = 1,item_count=200, faction=FACTION, token=TOKEN, entitytype, param='', assign_type = 'owner'){
  
  const inventoryAPIUrl = 'https://www.swcombine.com/ws/v2.0/inventory/{faction}/{entitytype}/{assign_type}?access_token={token}{param}&start_index={start_index}&item_count={item_count}'
  const inventoryValidationList = [{name:'version',value:'2.0'},{name:'resource',value:'inventory_entities'}]
  const replacements = {start_index: start_index, item_count:item_count, faction:faction, token:token, entitytype:entitytype, param:param, assign_type:assign_type}
  let inventoryJSON =   retrieveJSON(stringReplace(inventoryAPIUrl,replacements))
  let validationResult = validateJSON(inventoryJSON,inventoryValidationList)
  
  //if JSON is valid continue
  if (!validationResult){
    materialsinventoryJSON = null
  }
  return materialsinventoryJSON
}

