declare module 'multer' {
  import { Request } from 'express'
  export interface File {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    size: number
    destination: string
    filename: string
    path: string
    buffer?: Buffer
  }
  function multer(opts?: any): any
  namespace multer {
    function diskStorage(opts: any): any
  }
  export = multer
}
