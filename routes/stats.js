var error = require('../lib/error')
  , mongoose = require('mongoose')
  , stats = require('../lib/stats')

exports.DEFAULT_LIMIT = 10;

exports.by_engine_and_query = function(req, res) {

  var engine = req.params.engine
    , query_type = req.params.query_type
    , limit = req.query.limit || exports.DEFAULT_LIMIT;

  if ( !stats[query_type] ){
		return res.send(404, error.fail("No such statistic"));
	}
 
  stats[query_type]( engine, limit, false, function(err, pkgs){

    if ( err || !pkgs || pkgs.length === 0 ){
      return res.send( 404, error.fail("No results") );
    }

    return res.send( error.success_with_content('Found stats', pkgs) );

  });

}
