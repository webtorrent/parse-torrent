var fs = require('fs')
var parseTorrent = require('../')
var path = require('path')
var test = require('tape')

var leavesAnnounceList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-empty-announce-list.torrent'))

test('parse torrent with empty announce-list', function (t) {
  t.deepEquals(parseTorrent(leavesAnnounceList).announce, ['udp://tracker.publicbt.com:80/announce'])
  t.end()
})
