import { API_BASE_URL } from '@/config'
import { toast } from '@/hooks/use-toast'
import { asyncRunSafe } from '@/utils/index'
import {
  base,
  baseOptions,
  ContentType,
  FetchOptionType,
  getAccessToken,
} from './fetch'

export type IOnDataMoreInfo = {
  conversationId?: string
  taskId?: string
  messageId: string
  errorMessage?: string
  errorCode?: string
}

export type IOnData = (
  message: string,
  isFirstMessage: boolean,
  moreInfo: IOnDataMoreInfo,
) => void
export type IOnCompleted = (hasError?: boolean, errorMessage?: string) => void
export type IOnError = (msg: string, code?: string) => void

export type IOtherOptions = {
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  silent?: boolean
  onData?: IOnData // for stream
  onError?: IOnError
  onCompleted?: IOnCompleted // for stream
  getAbortController?: (abortController: AbortController) => void
}

const baseFetch = base

function unicodeToChar(text: string) {
  if (!text) return ''

  return text.replace(/\\u[0-9a-f]{4}/g, (_match, p1) => {
    return String.fromCharCode(Number.parseInt(p1, 16))
  })
}

const handleStream = (
  response: Response,
  onData: IOnData,
  onCompleted?: IOnCompleted,
) => {
  if (!response.ok) throw new Error('Network response was not ok')

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let bufferObj: Record<string, any>
  let isFirstMessage = true
  function read() {
    let hasError = false
    reader?.read().then((result: any) => {
      if (result.done) {
        onCompleted && onCompleted()
        return
      }
      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')
      try {
        lines.forEach((message) => {
          if (message.startsWith('data: ')) {
            // check if it starts with data:
            try {
              bufferObj = JSON.parse(message.substring(6)) as Record<
                string,
                any
              > // remove data: and parse as json
            } catch {
              // mute handle message cut off
              onData('', isFirstMessage, {
                conversationId: bufferObj?.conversation_id,
                messageId: bufferObj?.message_id,
              })
              return
            }
            if (bufferObj.status === 400 || !bufferObj.event) {
              onData('', false, {
                conversationId: undefined,
                messageId: '',
                errorMessage: bufferObj?.message,
                errorCode: bufferObj?.code,
              })
              hasError = true
              onCompleted?.(true, bufferObj?.message)
              return
            }
            if (
              bufferObj.event === 'message' ||
              bufferObj.event === 'agent_message'
            ) {
              // can not use format here. Because message is splitted.
              onData(unicodeToChar(bufferObj.answer), isFirstMessage, {
                conversationId: bufferObj.conversation_id,
                taskId: bufferObj.task_id,
                messageId: bufferObj.id,
              })
              isFirstMessage = false
            }
          }
        })
        buffer = lines[lines.length - 1]
      } catch (e) {
        onData('', false, {
          conversationId: undefined,
          messageId: '',
          errorMessage: `${e}`,
        })
        hasError = true
        onCompleted?.(true, e as string)
        return
      }
      if (!hasError) read()
    })
  }
  read()
}

export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  otherOptions: IOtherOptions,
) => {
  const { onData, onCompleted, onError, getAbortController } = otherOptions
  const abortController = new AbortController()

  const token = localStorage.getItem('console_token')

  const options = Object.assign(
    {},
    baseOptions,
    {
      method: 'POST',
      signal: abortController.signal,
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
    } as RequestInit,
    fetchOptions,
  )

  const contentType = (options.headers as Headers).get('Content-Type')
  if (!contentType)
    (options.headers as Headers).set('Content-Type', ContentType.json)

  getAbortController?.(abortController)

  const urlPrefix = API_BASE_URL
  const urlWithPrefix =
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { body } = options
  if (body) options.body = JSON.stringify(body)

  const accessToken = await getAccessToken()
  ;(options.headers as Headers).set('Authorization', `Bearer ${accessToken}`)

  globalThis
    .fetch(urlWithPrefix, options as RequestInit)
    .then((res) => {
      if (!/^[23]\d{2}$/.test(String(res.status))) {
        res.json().then((data) => {
          toast({
            variant: 'destructive',
            description: data.message || 'Server Error',
          })
        })
        onError?.('Server Error')
        return
      }
      return handleStream(
        res,
        (str: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => {
          if (moreInfo.errorMessage) {
            onError?.(moreInfo.errorMessage, moreInfo.errorCode)
            // TypeError: Cannot assign to read only property ... will happen in page leave, so it should be ignored.
            if (
              moreInfo.errorMessage !==
                'AbortError: The user aborted a request.' &&
              !moreInfo.errorMessage.includes(
                'TypeError: Cannot assign to read only property',
              )
            )
              toast({
                variant: 'destructive',
                description: moreInfo.errorMessage,
              })
            return
          }
          onData?.(str, isFirstMessage, moreInfo)
        },
        onCompleted,
      )
    })
    .catch((e) => {
      if (
        e.toString() !== 'AbortError: The user aborted a request.' &&
        !e
          .toString()
          .errorMessage.includes(
            'TypeError: Cannot assign to read only property',
          )
      )
        toast({ variant: 'destructive', description: e })
      onError?.(e)
    })
}

export const request = async <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions,
) => {
  try {
    const otherOptionsForBaseFetch = otherOptions || {}
    const [err, resp] = await asyncRunSafe<T>(
      baseFetch(url, options, otherOptionsForBaseFetch),
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
  otherOptions?: IOtherOptions,
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'GET' }),
    otherOptions,
  )
}

export const post = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions,
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'POST' }),
    otherOptions,
  )
}

export const put = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions,
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'PUT' }),
    otherOptions,
  )
}

export const del = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions,
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'DELETE' }),
    otherOptions,
  )
}

export const patch = <T>(
  url: string,
  options = {},
  otherOptions?: IOtherOptions,
) => {
  return request<T>(
    url,
    Object.assign({}, options, { method: 'PATCH' }),
    otherOptions,
  )
}
