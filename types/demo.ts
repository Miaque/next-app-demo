export type Person = {
  name: string
  age: number
  sex: string
}

export type FormData = {
  email: string
  name: string
  password: string
  confirmPassword: string
}

export interface BlogRef {
  validate: () => Promise<{ valid: boolean; values: any }>
}
