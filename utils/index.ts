export async function asyncRunSafe<T = any>(fn: Promise<T>): Promise<[Error] | [null, T]> {
  try {
    return [null, await fn]
  }
  catch (e: any) {
    return [e || new Error('unknown error')]
  }
}
