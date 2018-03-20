var fixtures = require('webtorrent-fixtures')
var http = require('http')
var DHT = require('bittorrent-dht')
var ed = require('ed25519-supercop')
var parseTorrent = require('../')
var crypto = require('crypto')
var test = require('tape')

test('http url to a torrent file, string', function (t) {
  t.plan(3)

  var server = http.createServer(function (req, res) {
    t.pass('server got request')
    res.end(fixtures.leaves.torrent)
  })

  server.listen(0, function () {
    var port = server.address().port
    var url = 'http://127.0.0.1:' + port
    parseTorrent.remote(url, function (err, parsedTorrent) {
      t.error(err)
      t.deepEqual(parsedTorrent, fixtures.leaves.parsedTorrent)
      server.close()
    })
  })
})

test('filesystem path to a torrent file, string', function (t) {
  t.plan(2)

  parseTorrent.remote(fixtures.leaves.torrentPath, function (err, parsedTorrent) {
    t.error(err)
    t.deepEqual(parsedTorrent, fixtures.leaves.parsedTorrent)
  })
})

test('dht put/get of torrent (BEP46)', function (t) {
  t.plan(6)

  var infoHashBuf = Buffer.from(fixtures.numbers.parsedTorrent.infoHash, 'hex')
  t.equal(infoHashBuf.length, 20, 'infoHashBuf is 20 bytes')

  var keypair = ed.createKeyPair(ed.createSeed())

  var dht = new DHT({ bootstrap: false, verify: ed.verify })
  t.once('end', function () {
    dht.destroy()
  })

  dht.on('warning', function (err) { t.fail(err) })
  dht.on('error', function (err) { t.fail(err) })

  dht.on('ready', function () {
    var opts = {
      k: keypair.publicKey,
      sign: function (buf) {
        return ed.sign(buf, keypair.publicKey, keypair.secretKey)
      },
      seq: 0,
      v: {
        ih: infoHashBuf
      }
    }

    var expectedHash = crypto.createHash('sha1').update(opts.k).digest()

    dht.put(opts, function (_, hash) {
      t.equal(
        hash.toString('hex'),
        expectedHash.toString('hex'),
        'hash of the public key'
      )

      // should perform a dht.get
      parseTorrent.remote({
        torrentId: 'magnet:?xs=urn:btpk:' + keypair.publicKey.toString('hex'),
        dht: dht
      }, function (err, parsedTorrent) {
        t.ifError(err)
        t.equal(infoHashBuf.toString('hex'), parsedTorrent.infoHash,
          'got back what we put in'
        )

        // put a value without infohash (should throw)
        opts.v = 'foo'
        opts.seq++
        dht.put(opts, function (_, hash) {
          t.equal(
            hash.toString('hex'),
            expectedHash.toString('hex'),
            'hash of the public key'
          )

          parseTorrent.remote({
            torrentId: 'magnet:?xs=urn:btpk:' + keypair.publicKey.toString('hex'),
            dht: dht
          }, function (err, parsedTorrent) {
            if (err) t.pass(err)
            else t.fail('should have errored')
          })
        })
      })
    })
  })
})
