(function() {
"use strict";
var bncode = require('bncode');
var path = require('path');
var Rusha = require('rusha-browserify'); // Fast SHA1 (works in browser)



var handleInfoDictionary = function(info_dictionary, result) {
  if (Buffer.isBuffer(info_dictionary)) {
    info_dictionary = bncode.decode(info_dictionary);
  }
  result = result || {};
  
  ensure(info_dictionary.name, 'info.name');
  ensure(info_dictionary['piece length'], 'info[\'piece length\']');
  ensure(info_dictionary.pieces, 'info.pieces');
  if (info_dictionary.files) {
    info_dictionary.files.forEach(function (file) {
      ensure(file.length, 'info.files[0].length');
      ensure(file.path, 'info.files[0].path');
    });
  } else {
    ensure(info_dictionary.length, 'info.length');
  }

  result.infoHash = sha1(bncode.encode(info_dictionary));
  result.private = !!info_dictionary.private;


  result.name = info_dictionary.name && info_dictionary.name.toString();
  var files = info_dictionary.files || [info_dictionary];
  result.files = files.map(function (file, i) {
    var parts = [].concat(file.name || result.name, file.path || []).map(function (p) {
      return p.toString();
    });
    return {
      path: path.join.apply(null, [path.sep].concat(parts)).slice(1),
      name: parts[parts.length - 1],
      length: file.length,
      offset: files.slice(0, i).reduce(sumLength, 0)
    };
  });

  result.length = files.reduce(sumLength, 0);

  var lastFile = result.files[result.files.length-1];

  result.pieceLength = info_dictionary['piece length'];
  result.lastPieceLength = ((lastFile.offset + lastFile.length) % result.pieceLength) || result.pieceLength;
  result.pieces = splitPieces(info_dictionary.pieces);

  result.info_dictionary = bncode.encode(info_dictionary);
  return result;
};

/**
 * Parse a torrent. Throws an exception if the torrent is missing required fields.
 * @param  {Buffer|Object} torrent
 * @return {Object}         parsed torrent
 */
module.exports = function (torrent) {
  if (Buffer.isBuffer(torrent)) {
    torrent = bncode.decode(torrent);
  }

  // sanity check
  ensure(torrent.info, 'info');
  ensure(torrent['announce-list'] || torrent.announce, 'announce-list/announce');


  var result = {};
  handleInfoDictionary(torrent.info, result);

  
  if (torrent['creation date']) {
    result.created = new Date(torrent['creation date'] * 1000);
  }

  result.announce = (torrent['announce-list'] || [torrent.announce]).map(function (obj) {
    return obj.toString().split(',')[0];
  });

  return result;
};

function sumLength (sum, file) {
  return sum + file.length;
}

function splitPieces (buf) {
  var pieces = [];
  for (var i = 0; i < buf.length; i += 20) {
    pieces.push(buf.slice(i, i + 20).toString('hex'));
  }
  return pieces;
}

function sha1 (buf) {
  return (new Rusha()).digestFromBuffer(buf);
}

function ensure (bool, fieldName) {
  if (!bool) {
    throw new Error('Torrent is missing required field: ' + fieldName);
  }
}


module.exports.parseInfoDictionary = handleInfoDictionary;
})();