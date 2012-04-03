
/*
 *   SEARCH STUFFZ
 */

var solr = require('solr');

var solr_client = solr.createClient();

exports.card_search = function( req, res, next ){

    var results;

    var query = encodeURIComponent( req.params.query );

    console.log( query );

    var solr_query = 
        'select?wt=json&fl=id,name,set_name,set_shortname,rules_text,name,card_type,mana,cmc,rarity,image_name,score&q=name:' + query;

    solr_client.get(solr_query, function(solr_err, solr_res) {
        if (solr_err) throw solr_err;
        var solr_res_obj = JSON.parse(solr_res);

        results = solr_res_obj.response;

        req.results = results.docs;

        next();

    });

}

exports.card_search_partial = function( req, res, next ){

    var results;
    var query;

    if( req.params.query ) {
        console.log( req.params );
        query = encodeURIComponent( req.params.query );
    } else if ( req.body.query ) {
        console.log( req.body );
        query = encodeURIComponent( req.body.query );
    }

    var solr_query = 
        'select?wt=json&fl=id,name,set_name,set_shortname,rules_text,name,card_type,mana,cmc,rarity,image_name,score&q=partial_name:' + query;

    solr_client.get(solr_query, function(solr_err, solr_res) {
        if (solr_err) throw solr_err;
        var solr_res_obj = JSON.parse(solr_res);

        results = solr_res_obj.response;

        req.results = results.docs;

        next();

    });

}

exports.results = function(req, res){

    console.log( "hit search.results" );

    res.render( 'search_results', { 
        "title": 'card search results',
        "results": req.results,
    });
};

exports.index = function(req, res){

    console.log( "hit search index" );

};

