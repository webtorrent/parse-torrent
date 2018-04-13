var fs = require('fs')
var parseTorrent = require('../')
var path = require('path')
var test = require('tape')

var leavesUrlList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-empty-url-list.torrent'))

test('parse empty url-list', function (t) {
  var torrent = parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, [])
  t.end()
})
