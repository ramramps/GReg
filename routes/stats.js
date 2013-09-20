var error = require('../lib/error')
  , mongoose = require('mongoose')
  , stats = require('../lib/stats')

exports.DEFAULT_LIMIT = 10;

exports.by_engine_and_query = function(req, res) {

  var engine = req.params.engine
    , query_type = req.params.query_type
    , limit = req.query.id || exports.DEFAULT_LIMIT;

  if ( !stats.query_type ){
    return res.send(404, error.fail('Not a valid query_type'));
  }

  stats[query_type]( engine, limit, function(err, pkgs){

    if ( err || !pkgs ){
      return res.send( 404, error.fail("Failed to return results with given engine") );
    }

    return res.send( error.success_with_content('Found stats', pkgs) );

  });

};
