import fs from 'fs'
import parseTorrent from '../index.js'
import path, { dirname } from 'path'
import test from 'tape'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const leavesAnnounceList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-empty-announce-list.torrent'))

test('parse torrent with empty announce-list', t => {
  t.deepEquals(parseTorrent(leavesAnnounceList).announce, ['udp://tracker.publicbt.com:80/announce'])
  t.end()
})
