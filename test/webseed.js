import fs from 'fs'
import parseTorrent, { toTorrentFile } from '../index.js'
import path, { dirname } from 'path'
import test from 'tape'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const leavesUrlList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-url-list.torrent'))

test('parse url-list for webseed support', async t => {
  const torrent = await parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, ['http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf'])
  t.end()
})

test('parseTorrent.toTorrentFile url-list for webseed support', async t => {
  const parsedTorrent = await parseTorrent(leavesUrlList)
  const buf = toTorrentFile(parsedTorrent)
  const doubleParsedTorrent = await parseTorrent(buf)
  t.deepEqual(doubleParsedTorrent.urlList, ['http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf'])
  t.end()
})
