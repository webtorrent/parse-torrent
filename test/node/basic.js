import fixtures from 'webtorrent-fixtures'
import http from 'http'
import { remote } from '../../index.js'
import test from 'tape'

fixtures.leaves.parsedTorrent.infoHashBuffer = new Uint8Array(fixtures.leaves.parsedTorrent.infoHashBuffer)

test('http url to a torrent file, string', t => {
  t.plan(3)

  const server = http.createServer((req, res) => {
    t.pass('server got request')
    res.end(fixtures.leaves.torrent)
  })

  server.listen(0, () => {
    const port = server.address().port
    const url = `http://127.0.0.1:${port}`
    remote(url, (err, parsedTorrent) => {
      t.error(err)
      t.deepEqual(parsedTorrent, fixtures.leaves.parsedTorrent)
      server.close()
    })
  })
})

test('filesystem path to a torrent file, string', t => {
  t.plan(2)

  remote(fixtures.leaves.torrentPath, (err, parsedTorrent) => {
    t.error(err)
    t.deepEqual(parsedTorrent, fixtures.leaves.parsedTorrent)
  })
})
