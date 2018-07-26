const fs = require('fs')
const parseTorrent = require('../')
const path = require('path')
const test = require('tape')

const leavesAnnounceList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-empty-announce-list.torrent'))

test('parse torrent with empty announce-list', t => {
  t.deepEquals(parseTorrent(leavesAnnounceList).announce, ['udp://tracker.publicbt.com:80/announce'])
  t.end()
})
