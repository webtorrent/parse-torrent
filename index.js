var bncode = require('bncode')
var path = require('path')
var Rusha = require('rusha') // Fast SHA1 (works in browser)

/**
 * Parse a torrent. Throws an exception if the torrent is missing required fields.
 * @param  {Buffer} torrent
 * @return {Object}         parsed torrent
 */
module.exports = function (torrent) {
  torrent = bncode.decode(torrent)

  var result = {}

  result.infoHash = (new Rusha()).digestFromBuffer(bncode.encode(torrent.info))

  result.name = torrent.info.name.toString()
  result.private = !!torrent.info.private

  result.created = new Date(torrent['creation date'] * 1000)
  result.announce = (torrent['announce-list'] || [torrent.announce]).map(function (obj) {
    return obj.toString().split(',')[0]
  })

  result.files = (torrent.info.files || [torrent.info]).map(function (file, i, files) {
    var parts = [].concat(file.name || result.name, file.path || []).map(function (p) {
      return p.toString()
    })
    return {
      path: path.join.apply(null, [path.sep].concat(parts)).slice(1),
      name: parts[parts.length - 1],
      length: file.length,
      offset: files.slice(0, i).reduce(sumLength, 0)
    }
  })

  var lastFile = result.files[result.files.length-1]

  result.pieceLength = torrent.info['piece length']
  result.lastPieceLength = ((lastFile.offset + lastFile.length) % result.pieceLength) || result.pieceLength
  result.pieces = splitPieces(torrent.info.pieces)

  return result
}

function sumLength (sum, file) {
  return sum + file.length
}

function splitPieces (buf) {
  var pieces = []
  for (var i = 0; i < buf.length; i += 20) {
    pieces.push(buf.slice(i, i + 20).toString('hex'))
  }
  return pieces
}
