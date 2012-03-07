
/*
 *   SEARCH STUFFZ
 */

var solr = require('solr');

var solr_client = solr.createClient();

exports.do_search = function(req, res){

    console.log( "hit do_search" );

    var query = req.params.query;

    var solr_query = 'name:' + query;
    console.log( solr_query );

    solr_client.query(solr_query, function(err, solr_res) {
        if (err) throw err;
        var solr_res_obj = JSON.parse(solr_res);

        res.send( solr_res_obj.response );
    });

};

exports.search = function(req, res){

    console.log( "hit info" );

};

