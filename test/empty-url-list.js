import fs from 'fs'
import parseTorrent from '../index.js'
import path, { dirname } from 'path'
import test from 'tape'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const leavesUrlList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-empty-url-list.torrent'))

test('parse empty url-list', t => {
  const torrent = parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, [])
  t.end()
})
