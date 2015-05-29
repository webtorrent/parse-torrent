var fs = require('fs')
var http = require('http')
var parseTorrent = require('../')
var test = require('tape')

var leavesPath = __dirname + '/torrents/leaves.torrent'
var leaves = fs.readFileSync(leavesPath)
var leavesParsed = parseTorrent(leaves)

test('http url to a torrent file, string', function (t) {
  t.plan(3)

  var server = http.createServer(function (req, res) {
    t.pass('server got request')
    res.end(leaves)
  })

  server.listen(0, function () {
    var port = server.address().port
    var url = 'http://127.0.0.1:' + port
    parseTorrent.remote(url, function (err, parsedTorrent) {
      t.error(err)
      t.deepEqual(parsedTorrent, leavesParsed)
      server.close()
    })
  })
})

test('filesystem path to a torrent file, string', function (t) {
  t.plan(2)

  parseTorrent.remote(leavesPath, function (err, parsedTorrent) {
    t.error(err)
    t.deepEqual(parsedTorrent, leavesParsed)
  })
})
