import { mapWithConcurrency, batchProcess } from '../../src/utils/concurrency';

describe('Concurrency Utilities', () => {
  describe('mapWithConcurrency', () => {
    it('should process all items and return results', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await mapWithConcurrency(items, async (item) => item * 2, 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should maintain order of results', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await mapWithConcurrency(
        items,
        async (item) => {
          // Add delay to test concurrency
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
          return item * 2;
        },
        2
      );

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should limit concurrency', async () => {
      let currentConcurrency = 0;
      let maxConcurrency = 0;

      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      await mapWithConcurrency(
        items,
        async (item) => {
          currentConcurrency++;
          maxConcurrency = Math.max(maxConcurrency, currentConcurrency);
          await new Promise((resolve) => setTimeout(resolve, 10));
          currentConcurrency--;
          return item;
        },
        3 // Max 3 concurrent
      );

      expect(maxConcurrency).toBeLessThanOrEqual(3);
    });

    it('should handle empty array', async () => {
      const results = await mapWithConcurrency([], async (item: number) => item * 2, 2);
      expect(results).toEqual([]);
    });

    it('should handle errors in individual operations', async () => {
      const items = [1, 2, 3];
      await expect(
        mapWithConcurrency(
          items,
          async (item) => {
            if (item === 2) {
              throw new Error('Test error');
            }
            return item * 2;
          },
          2
        )
      ).rejects.toThrow('Test error');
    });

    it('should work with concurrency of 1 (sequential)', async () => {
      const items = [1, 2, 3];
      const results = await mapWithConcurrency(items, async (item) => item * 2, 1);

      expect(results).toEqual([2, 4, 6]);
    });

    it('should use default concurrency of 5', async () => {
      const items = [1, 2, 3];
      const results = await mapWithConcurrency(items, async (item) => item * 2);

      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('batchProcess', () => {
    it('should process all items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const results = await batchProcess(items, async (item) => item * 2, 2);

      expect(results).toEqual([2, 4, 6, 8, 10, 12]);
    });

    it('should process items sequentially by batch', async () => {
      const processOrder: number[] = [];
      const items = [1, 2, 3, 4, 5, 6];

      await batchProcess(
        items,
        async (item) => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          processOrder.push(item);
          return item;
        },
        2
      );

      // First batch (1, 2) should complete before second batch (3, 4)
      expect(processOrder.slice(0, 2).sort()).toEqual([1, 2]);
      expect(processOrder.slice(2, 4).sort()).toEqual([3, 4]);
      expect(processOrder.slice(4, 6).sort()).toEqual([5, 6]);
    });

    it('should handle empty array', async () => {
      const results = await batchProcess([], async (item: number) => item * 2, 2);
      expect(results).toEqual([]);
    });

    it('should handle items not evenly divisible by batch size', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await batchProcess(items, async (item) => item * 2, 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should use default batch size of 10', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await batchProcess(items, async (item) => item * 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle errors in batch operations', async () => {
      const items = [1, 2, 3];
      await expect(
        batchProcess(
          items,
          async (item) => {
            if (item === 2) {
              throw new Error('Test error');
            }
            return item * 2;
          },
          2
        )
      ).rejects.toThrow('Test error');
    });
  });
});
