import { Person } from '@/types/demo'
import { Fetcher } from 'swr'

export const fetchPersonData: Fetcher<{ data: Person }, string> = async (
  name: string
) => {
  try {
    const response = await fetch(`https://api.example.com/person?name=${name}`)
    return (await response.json()) as Person
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}
