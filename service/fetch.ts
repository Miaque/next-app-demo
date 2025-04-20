import { API_BASE_URL } from '@/config/index'
import { toast } from '@/hooks/use-toast'
import type {
  AfterResponseHook,
  BeforeErrorHook,
  BeforeRequestHook,
  Hooks,
} from 'ky'
import ky from 'ky'
import type { IOtherOptions } from './base'

const TIME_OUT = 100000

export const ContentType = {
  json: 'application/json',
  stream: 'text/event-stream',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  download: 'application/octet-stream', // for download
  downloadZip: 'application/zip', // for download
}

export type FetchOptionType = Omit<RequestInit, 'body'> & {
  params?: Record<string, any>
  body?: BodyInit | Record<string, any> | null
}

const afterResponse204: AfterResponseHook = async (
  _request,
  _options,
  response
) => {
  if (response.status === 204) return Response.json({ result: 'success' })
}

export type ResponseError = {
  code: string
  message: string
  status: number
}

const afterResponseErrorCode = (
  otherOptions: IOtherOptions
): AfterResponseHook => {
  return async (_request, _options, response) => {
    const clonedResponse = response.clone()
    if (!/^([23])\d{2}$/.test(String(clonedResponse.status))) {
      const bodyJson = clonedResponse.json() as Promise<ResponseError>
      switch (clonedResponse.status) {
        case 403:
          bodyJson.then((data: ResponseError) => {
            if (!otherOptions.silent)
              toast({ variant: 'destructive', description: data.message })
          })
          break
        case 401:
          return Promise.reject(response)
        // fall through
        default:
          bodyJson.then((data: ResponseError) => {
            if (!otherOptions.silent)
              toast({ variant: 'destructive', description: data.message })
          })
          return Promise.reject(response)
      }
    }
  }
}

const beforeErrorToast = (otherOptions: IOtherOptions): BeforeErrorHook => {
  return (error) => {
    if (!otherOptions.silent)
      toast({ variant: 'destructive', description: error.message })
    return error
  }
}

export async function getAccessToken() {
  return localStorage.getItem('console_token') || ''
}

const beforeRequestAuthorization: BeforeRequestHook = async (request) => {
  const accessToken = await getAccessToken()
  request.headers.set('Authorization', `Bearer ${accessToken}`)
}

const baseHooks: Hooks = {
  afterResponse: [afterResponse204],
}

const baseClient = ky.create({
  hooks: baseHooks,
  timeout: TIME_OUT,
})

export const baseOptions: RequestInit = {
  method: 'GET',
  headers: new Headers({
    'Content-Type': ContentType.json,
  }),
  redirect: 'follow',
}

async function base<T>(
  url: string,
  options: FetchOptionType = {},
  otherOptions: IOtherOptions = {}
): Promise<T> {
  const { params, body, headers, ...init } = Object.assign(
    {},
    baseOptions,
    options
  )
  const {
    bodyStringify = true,
    needAllResponseContent,
    deleteContentType,
    getAbortController,
  } = otherOptions

  const base = API_BASE_URL

  if (getAbortController) {
    const abortController = new AbortController()
    getAbortController(abortController)
    options.signal = abortController.signal
  }

  const fetchPathname = `${base}${url.startsWith('/') ? url : `/${url}`}`

  if (deleteContentType) (headers as any).delete('Content-Type')

  const client = baseClient.extend({
    hooks: {
      ...baseHooks,
      beforeError: [
        ...(baseHooks.beforeError || []),
        beforeErrorToast(otherOptions),
      ],
      beforeRequest: [
        ...(baseHooks.beforeRequest || []),
        beforeRequestAuthorization,
      ].filter(Boolean),
      afterResponse: [
        ...(baseHooks.afterResponse || []),
        afterResponseErrorCode(otherOptions),
      ],
    },
  })

  const res = await client(fetchPathname, {
    ...init,
    headers,
    retry: {
      methods: [],
    },
    ...(bodyStringify ? { json: body } : { body: body as BodyInit }),
    searchParams: params,
  })

  if (needAllResponseContent) return res as T
  const contentType = res.headers.get('content-type')
  if (
    contentType &&
    [ContentType.download, ContentType.downloadZip].includes(contentType)
  )
    return (await res.blob()) as T

  return (await res.json()) as T
}

export { base }
