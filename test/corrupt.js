import fixtures from 'webtorrent-fixtures'
import parseTorrent from '../index.js'
import test from 'tape'

test('exception thrown when torrent file is missing `name` field', async t => {
  try {
    await parseTorrent(fixtures.corrupt.torrent)
  } catch (e) {
    t.ok(e instanceof Error)
  }
  t.end()
})
