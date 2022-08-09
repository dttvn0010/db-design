export function getTableRoutes(targetTable, tableList) {
  let tableRoutes = {[targetTable]: []};

  while(true) {
    let updated = false;
    let tableRouteNames = Object.keys(tableRoutes);
    let leftTables = tableList.filter(table => !tableRouteNames.includes(table.name));
    
    // category --> product
    leftTables.forEach(table => {
      table.fields.filter(field => tableRouteNames.includes(field.linkedTable)).forEach(field => {
        let route = tableRoutes[field.linkedTable];
        tableRoutes[table.name] = [...route, table.name];
        updated = true;
      });
    });

    // product --> category
    tableRouteNames.map(tableName => tableList.find(t => t.name === tableName)).forEach(table => {
      
      table.fields.forEach(field => {
        if(!leftTables.find(t => t.name === field.linkedTable)){
          return;
        }
        let route = tableRoutes[table.name];
        tableRoutes[field.linkedTable] = [...route, field.name];
        updated = true;
      });
    });
    
    if(!updated) break;
  }
  return tableRoutes;
}