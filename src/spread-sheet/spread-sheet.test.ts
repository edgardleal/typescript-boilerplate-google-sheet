/**
 * spread-sheet.test.ts
 *
 * @module spread-sheet.test.ts
 */
import SheetSync from './spread-sheet';
import { splitDate } from './date';

describe('spread-sheet', () => {
  let sheet: SheetSync;
  beforeEach(() => {
    sheet = new SheetSync('');
  });
  describe('exists', () => {
    it('should return false when rows is empty', async () => {
      const spy = jest.spyOn(sheet, 'getRows');
      spy.mockReturnValue(Promise.resolve([]));

      const splitedDate = splitDate();

      const result = await sheet.exists(splitedDate);
      expect(result).toBeFalsy();
    });
    it('should return true when getRows return an item with the same date', async () => {
      const splitedDate = splitDate();

      const spy = jest.spyOn(sheet, 'getRows');
      spy.mockReturnValue(Promise.resolve([
        {
          Year: `${splitedDate.year}`,
          Month: `${splitedDate.month}`,
          Day: `${splitedDate.day}`,
        },
      ]) as any);

      const result = await sheet.exists(splitedDate);
      expect(result).toBeTruthy();
    });
  });
});
