/**
 * spread-sheet.test.ts
 *
 * @module spread-sheet.test.ts
 */
import SheetSync from './spread-sheet';

describe('spread-sheet', () => {
  let sheet: SheetSync;
  beforeEach(() => {
    sheet = new SheetSync('');
  });
  describe('exists', () => {
    it('should return false when rows is empty', async () => {
      const spy = jest.spyOn(sheet, 'getRows');
      spy.mockReturnValue(Promise.resolve([]));

      const result = await sheet.exists('1', 'id');
      expect(result).toBeFalsy();
    });
    it('should return true when getRows return an item with the same date', async () => {
      const spy = jest.spyOn(sheet, 'getRows');
      spy.mockReturnValue(Promise.resolve([
        {
          Id: '1',
          Data: 'Test',
          Value: 'Test value',
        },
        { // the last row should be empty to stop the read process
          Id: '',
          Data: '',
          Value: '',
        },
      ]) as any);

      const result = await sheet.exists('1', 'Id');
      expect(result).toBeTruthy();
    });
  });
});
