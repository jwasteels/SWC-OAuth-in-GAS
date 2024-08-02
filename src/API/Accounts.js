//Constants
const accountSheetName = 'Accounts';
const accountRange = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(accountSheetName).getRange('A:I');

function updateAccounts(tokenObject) {
    //build row to write
    var accountObject = {}
    accountObject.faction=tokenObject.faction;
    accountObject.factionUID=tokenObject.factionUID;
    accountObject.handle=tokenObject.handle;
    accountObject.UID=tokenObject.UID;
    //the next 2 lines are a possible security risk, but are useful for easy debugging when setting up
    accountObject.refreshToken=tokenObject.refreshToken;
    accountObject.accessToken=tokenObject.accessToken;
    accountObject.expiresAt=tokenObject.expiresAt;
    var cgtExpire = getSWCTime('',accountObject.expiresAt)
    accountObject.expiresAtCGT = stringifyCGT(cgtExpire);
    accountObject.email = tokenObject.email;
    var accountValues = []
    accountValues.push(accountObject)
    var writeValues=[]
    writeValues[0] = Object.values(accountValues[0]);
    //Write to first empty row
    var requiredColumns = Object.keys(accountValues[0]).length;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(accountSheetName);
    SpreadsheetApp.setActiveSheet(sheet);
    var row = getFirstEmptyRowByColumn(sheet,'C');
    var writeRange = sheet.getRange(row,1,1,requiredColumns)
    writeRange.setValues(writeValues);
    //Delete duplicates
    removeDuplicates(sheet,'C');
}
