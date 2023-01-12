import fs from 'fs'
import parseTorrent from '../index.js'
import path, { dirname } from 'path'
import test from 'tape'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const leavesDuplicateTracker = fs.readFileSync(path.join(__dirname, 'torrents/leaves-duplicate-tracker.torrent'))

const expectedAnnounce = [
  'http://tracker.example.com/announce'
]

test('dedupe announce list', async t => {
  t.deepEqual((await parseTorrent(leavesDuplicateTracker)).announce, expectedAnnounce)
  t.end()
})
