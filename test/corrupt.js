const fixtures = require('webtorrent-fixtures')
const parseTorrent = require('../')
const test = require('tape')

test('exception thrown when torrent file is missing `name` field', t => {
  t.throws(() => {
    parseTorrent(fixtures.corrupt.torrent)
  })
  t.end()
})
