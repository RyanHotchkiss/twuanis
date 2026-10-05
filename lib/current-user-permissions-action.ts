'use server'

import {
  resolveCurrentUserPermissionContext
} from './current-user-permissions'

export async function loadCurrentUserPermissionContext(
  accessToken: string
) {
  return resolveCurrentUserPermissionContext(
    accessToken
  )
}
