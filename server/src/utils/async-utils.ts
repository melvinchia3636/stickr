import { exec } from 'child_process'
import { Response } from 'express'
import { promisify } from 'util'

export const execAsync = promisify(exec)

export function sendFileAsync(res: Response, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    res.sendFile(filePath, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}
