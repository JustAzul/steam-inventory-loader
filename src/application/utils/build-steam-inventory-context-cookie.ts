export const buildSteamInventoryContextCookie = (
  appID: string,
  contextID: string,
): string => {
  return `strInventoryLastContext=${appID}_${contextID}`;
};
