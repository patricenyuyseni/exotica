import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

// This script downloads placeholder images from Unsplash Source (royalty-free)
// for products in server/data/products.json that reference the placeholder image.
// It queries product names and attempts to download an image using the product name
// as the search term. Save files into client/public/images/products and update
// products.json to reference them.

const repoRoot = path.join(new URL(import.meta.url).pathname, '..', '..')
const dataPath = path.join(repoRoot, 'server', 'data', 'products.json')
const imagesDir = path.join(repoRoot, 'client', 'public', 'images', 'products')

if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true })

const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

async function downloadImage(url, dest){
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  const buffer = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buffer))
}

async function main(){
  for (const p of products){
    if (p.image && p.image !== '/images/products/placeholder.jpg' && p.image !== '/images/products/placeholder-test.jpg') continue
    // Use product name as search term; prioritize "weed" related terms if product suggests
    const query = encodeURIComponent(p.name + ' weed vape')
    const url = `https://source.unsplash.com/800x800/?${query}`
    const filename = `${p.slug || p.id}-${Date.now()}.jpg`
    const dest = path.join(imagesDir, filename)
    try{
      console.log('Downloading', url)
      await downloadImage(url, dest)
      p.image = `/images/products/${filename}`
      p.images = [p.image]
      console.log('Saved', dest)
    }catch(e){
      console.warn('Failed to download for', p.name, e)
    }
  }
  fs.writeFileSync(dataPath, JSON.stringify(products, null, 2))
  console.log('Updated products.json')
}

main().catch(e=>{ console.error(e); process.exit(1) })
