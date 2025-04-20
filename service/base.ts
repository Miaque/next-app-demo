import { asyncRunSafe } from '@/utils/index'
import { base } from './fetch'

export type IOtherOptions = {
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  silent?: boolean
  getAbortController?: (abortController: AbortController) => void
}

const baseFetch = base

export const request = async <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions
) => {
  try {
    const otherOptionsForBaseFetch = otherOptions || {}
    const [err, resp] = await asyncRunSafe<T>(
      baseFetch(url, options, otherOptionsForBaseFetch)
    )
    if (err === null) return resp
    else return Promise.reject(err)
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

// request methods
export const get = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'GET' }),
    otherOptions
  )
}

export const post = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'POST' }),
    otherOptions
  )
}

export const put = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'PUT' }),
    otherOptions
  )
}

export const del = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'DELETE' }),
    otherOptions
  )
}

export const patch = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'PATCH' }),
    otherOptions
  )
}
