function onOpen() {
  var ui = SpreadsheetApp.getUi();
  //SpreadsheetApp.getUi()
      ui.createMenu('🚀SWC API')
      .addSubMenu(ui.createMenu('New users')
      .addItem('New User Authentication','getAuthorization')
      
          )
      .addSeparator()
      .addSubMenu(ui.createMenu('Single user operations')
        .addItem('Popup active user','popupActiveUser')
        .addItem('Display active user profile', 'loadActiveProfile')
        .addItem('Clear active user profile', 'clearActiveProfile')
          )
      .addSeparator()
      .addSubMenu(ui.createMenu('Examples')
        .addItem('New User Authentication With Extra Scope','exampleAuthorization')
        .addItem('Show a ship from your inventory', 'exampleReadShip')
        .addItem('Rename a ship from your inventory', 'exampleWriteShip')
          )
      .addToUi();
}
