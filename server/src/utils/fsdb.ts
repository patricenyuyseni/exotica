import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve a repo-scoped data directory so code works whether server is started
// from repo root or from the `server/` folder.
function resolveDataDir(){
  const candidates = [
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'server', 'data'),
    path.join(process.cwd(), '..', 'server', 'data'),
    path.join(__dirname, '..', 'data'),
    path.join(__dirname, '..', '..', 'data'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  // default to create under server/data relative to repo root
  return path.join(process.cwd(), 'server', 'data')
}

function dataDir(){
  const d = resolveDataDir()
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  return d
}

function filePath(filename: string){
  return path.join(dataDir(), filename)
}

export function readJSON(filename: string) {
  const p = filePath(filename)
  if (!fs.existsSync(p)) fs.writeFileSync(p, '[]')
  const raw = fs.readFileSync(p, 'utf-8')
  return JSON.parse(raw)
}

export function writeJSON(filename: string, data: any) {
  const p = filePath(filename)
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

export function exists(p: string){
  try{ return fs.existsSync(p) }catch{ return false }
}

export function unlink(p: string){
  try{ if (fs.existsSync(p)) fs.unlinkSync(p) }catch(e){ console.warn('unlink', e) }
}

export default { readJSON, writeJSON, exists, unlink }
