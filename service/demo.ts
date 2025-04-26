import { get } from './base'
import { Person } from '@/types/demo'
import { Fetcher } from 'swr'

export const fetchPersonData: Fetcher<Person, string> = async (
  name: string
) => {
  return get<Person>(`/api/person/${name}`)
}
