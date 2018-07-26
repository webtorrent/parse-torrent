const fs = require('fs')
const parseTorrent = require('../')
const path = require('path')
const test = require('tape')

const leavesUrlList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-empty-url-list.torrent'))

test('parse empty url-list', t => {
  const torrent = parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, [])
  t.end()
})
