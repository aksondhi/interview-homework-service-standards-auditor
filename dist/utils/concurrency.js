/**
 * Utility functions for managing concurrent operations
 */
/**
 * Execute promises with controlled concurrency
 *
 * Limits the number of promises running at once to avoid overwhelming system resources.
 * This is more efficient than Promise.all for large numbers of operations.
 *
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param concurrency - Maximum number of concurrent operations (default: 5)
 * @returns Promise resolving to array of results
 *
 * @example
 * ```typescript
 * const results = await mapWithConcurrency(
 *   services,
 *   async (service) => auditService(service),
 *   10 // max 10 concurrent audits
 * );
 * ```
 */
export async function mapWithConcurrency(items, fn, concurrency = 5) {
    const results = new Array(items.length);
    let index = 0;
    // Create worker function that processes items from the queue
    const worker = async () => {
        while (index < items.length) {
            const currentIndex = index++;
            results[currentIndex] = await fn(items[currentIndex], currentIndex);
        }
    };
    // Start workers up to concurrency limit
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
    // Wait for all workers to complete
    await Promise.all(workers);
    return results;
}
/**
 * Batch process items in chunks
 *
 * Processes items in sequential batches, with all items in a batch executing in parallel.
 * Useful when you want to process items in waves rather than all at once.
 *
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param batchSize - Number of items to process per batch (default: 10)
 * @returns Promise resolving to array of results
 *
 * @example
 * ```typescript
 * const results = await batchProcess(
 *   largeServiceList,
 *   async (service) => auditService(service),
 *   5 // process 5 services at a time
 * );
 * ```
 */
export async function batchProcess(items, fn, batchSize = 10) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((item, batchIndex) => fn(item, i + batchIndex)));
        results.push(...batchResults);
    }
    return results;
}
