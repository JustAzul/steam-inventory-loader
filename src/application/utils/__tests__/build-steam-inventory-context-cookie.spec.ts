import { buildSteamInventoryContextCookie } from '../build-steam-inventory-context-cookie';

describe('Application :: Utils :: buildSteamInventoryContextCookie', () => {
  it('should create the correct context cookie string for Steam inventory API requests', () => {
    const appID = '753';
    const contextID = '6';
    const expectedCookie = `strInventoryLastContext=${appID}_${contextID}`;

    const result = buildSteamInventoryContextCookie(appID, contextID);

    expect(result).toBe(expectedCookie);
  });
}); 