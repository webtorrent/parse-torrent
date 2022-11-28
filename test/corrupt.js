import fixtures from 'webtorrent-fixtures'
import parseTorrent from '../index.js'
import test from 'tape'

test('exception thrown when torrent file is missing `name` field', t => {
  t.throws(() => {
    parseTorrent(fixtures.corrupt.torrent)
  })
  t.end()
})
