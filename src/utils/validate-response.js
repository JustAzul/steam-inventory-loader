// Helper to validate Steam inventory response
function validateInventoryResponse(data) {
  if (!data) return null;
  
  var items = data.assets || [];
  var descriptions = data.descriptions || [];
  
  // Build lookup map
  var descMap = {};
  for (var i = 0; i < descriptions.length; i++) {
    var key = descriptions[i].classid + '_' + descriptions[i].instanceid;
    descMap[key] = descriptions[i];
  }
  
  // Merge assets with descriptions
  var result = [];
  for (var j = 0; j < items.length; j++) {
    var asset = items[j];
    var desc = descMap[asset.classid + '_' + asset.instanceid];
    if (desc) {
      result.push(Object.assign({}, asset, desc));
    }
  }
  
  return result;
}

module.exports = { validateInventoryResponse };
