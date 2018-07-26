const fs = require('fs')
const parseTorrent = require('../')
const path = require('path')
const test = require('tape')

const leavesDuplicateTracker = fs.readFileSync(path.join(__dirname, 'torrents/leaves-duplicate-tracker.torrent'))

const expectedAnnounce = [
  'http://tracker.example.com/announce'
]

test('dedupe announce list', t => {
  t.deepEqual(parseTorrent(leavesDuplicateTracker).announce, expectedAnnounce)
  t.end()
})
