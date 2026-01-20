/**
 * Waits for the specified number of milliseconds.
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified time.
 */
export async function wait(ms) {
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
