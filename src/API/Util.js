const  FACrange = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parameters').getRange('_SWC_FACTIONS_SHORT');

/**
 * return an string with replaced placeholders
 * @param {string} stringWithPlaceholders string containing place holders to be processed. Each place holder should be enclosed within {}
 * @param {object} replacements Object containing strings to replace place holders. The name of each object property should matach one of the place holders
 * @return {object} object information
 */
function stringReplace(stringWithPlaceholders,replacements) {
  const replacedString =  stringWithPlaceholders.replace(/{(\w+)}/g,(placeholderWithDelimiters, placeholderWithoutDelimiters) => replacements.hasOwnProperty(placeholderWithoutDelimiters) ? replacements[placeholderWithoutDelimiters] : placeholderWithDelimiters);
  Logger.log(replacedString);
  return replacedString
}

/**
 * Convert a string to Proper case.
 
 * @param {string} str The string value to be converted.
 * @return The string value in Proper case.
 * @customfunction
*/
function PROPER_CASE(str) {
  if (typeof str != "string")
    throw `Expected string but got a ${typeof str} value.`;
  
  str = str.toLowerCase();

  var arr = str.split(/.-:?—/ );
  
  return arr.reduce(function(val, current) {
    return val += (current.charAt(0).toUpperCase() + current.slice(1));
  }, "");
}

/**
 * Search for a value in a range, return corresponding value in different column
 * @param {string} key the search term
 * @param {range} range to search in
 * @param {column} integer the number of the column to return the value of
 * @param {searchcolumn} integer the number of the column to search for the key in, defaults to 1
 * @returns contents of the corresponding cell, or false when no match found 
 */
function findinDB (key, range, column, searchcolumn=1) {
  var data=range.getValues();
  for (nn=0;nn<data.length;nn++) {
    if (data[nn][searchcolumn-1]==key) {
      return data[nn][column-1];
    }
  }
  return false;
}

/** A function to get the first empty row in a column
 * @param {sheet} sheet to check
 * @param {string} column letter of the column to check
 * @returns a row number
 */
function getFirstEmptyRowByColumn(sheet, column) {
  var column = sheet.getRange(column+':'+column); //get the specified column as a range
  var values = column.getValues(); //get all values in the column range
  var ct = 0;
  while (values[ct]&&values[ct][0]!="") {
    ct++;
  }
  return (ct+1);
}

/** Check if a named range exists
 * @param {string} rangeName
 * @returns true or false
 */
function rangeExists(rangeName){
  var ss = SpreadsheetApp.getActive();
  var rangeList = ss.getNamedRanges();
  for (i=0;i<rangeList.length;i++)
  {
    var listName = rangeList[i].getName()
    //Logger.log(i + ":"+ listName)
    if (rangeName == listName) {return true}
  }
  return false
}

/** Delete a named range and remove associated rows
* @sheetName string, name of the sheet where the range resides 
* @rangeName string, name of the range
* TO DO: we can probably get sheetName through rangeName
 */
function deleteRange(sheetName, rangeName) {
  if (rangeExists(rangeName)) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
    try {
      var oldRange = SpreadsheetApp.getActiveSheet().getRange(rangeName);
      var oldStartingRow = oldRange.getRow();
      var oldLastRow = oldRange.getLastRow();
      var oldLength = oldLastRow - oldStartingRow +1;
      sheet.deleteRows(oldStartingRow,oldLength)} catch(e) {Logger.log('Range exists but with no rows or columns attached: '+e)}
    SpreadsheetApp.getActiveSpreadsheet().removeNamedRange(rangeName);
    return true
  } else {return false}
}

/** Update the dashboard with a timestamp for update run
 * @FAC string, shorthand for the faction
 * @resource string, choice of (material, production)
 */
function updateDashboard (FAC='XXX',resource='material') { //You can set default shorthand for the faction here
  var resource = PROPER_CASE(resource);
  var range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('_SWC_DASHBOARD');
  var values = range.getValues();
  for (var c=0;c<range.getWidth();c++) {
    if (values[0][c]==resource){
      var colNumber = c+1;
      break;
    }
  }
  for (var r=0;r < values.length;r++ ) {
    if (values[r][0]==FAC) {
      var rowNumber = r+1;
      break;
    }
  }
  var cell = range.getCell(rowNumber,colNumber)
  //Get current date + time
  var time = Utilities.formatDate(new Date(),"GMT+1","dd/MM/yyy HH:mm")
  var SWCtime = getSWCTime()
  var SWCTimeString = stringifyCGT(SWCtime);
  cell.setValue(time +' ('+SWCTimeString+')');
}

/** Gets the shorthand code for a faction from the parameters */
function getFAC(faction) {
  var FAC = findinDB(faction,FACrange,2);
  return FAC;
}

/** Removes rows from sheet where there is a duplicate value in column. Assumes the column has no data after the first blank
 * @sheet a sheet object
 * @column a column number or letter
 * @offset integer allows for skipping of a number of header rows
 */
function removeDuplicates(sheet,column,offset = 1) {
  var endRow = getFirstEmptyRowByColumn(sheet,column)-1; //last useful row is row before first empty
  var data = sheet.getRange(column+':'+column).getValues();
  var newData = [];
  for (i=0+offset;i<endRow;i++) { 
    var ID = data[i];
    for (j=i+1;j<endRow;j++) {
      var ID2=data[j]
      if (ID.join()==ID2.join()) {
        newData.push(i+1) //datapoint 0 is row 1
        break;
        }
    }
  }
  
  for (d=newData.length-1;d>=0;d--) {
    var rem = newData[d];
    sheet.deleteRows(rem,1);
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
  var cgtDay = cgtObject.Day||cgtObject.days;
  while (cgtDay.length<=3) {
    cgtDay = '0'+cgtDay;
  } 
  var cgtHour = cgtObject.Hour||cgtObject.hours;
  if (cgtHour.length == 1) {cgtHour = '0'+cgtHour}
  var cgtMinute = cgtObject.Minute||cgtObject.mins;
  if (cgtMinute.length == 1) {cgtMinute = '0'+cgtMinute}

  cgtString = 'Y'+cgtYear+'D'+cgtDay+' '+cgtHour+':'+cgtMinute;
  return cgtString
}

/**
 * Build a new array containing each unique value from original array
 * @param {array} array array to de-duplicate
 * @returns new array containe each original unique value once
 */
function removeDuplicatesArray(array){
  var newArray = []
  for (i=0;i<array.length;i++) {
    var check = array[i][0];
    var checkresult = newArray.includes(check);
    if (checkresult == false) {
      newArray.push(check)
    }
  }
  return newArray;
}
