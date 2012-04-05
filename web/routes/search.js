
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
    var query_page_size = 18;
    var page_num = 1;

    if( req.params.query ) {
        console.log( req.params );
        query = encodeURIComponent( req.params.query );
        if( req.params.page_num ){
            page_num = req.params.page_num;
        }
        query_start = ( page_num - 1 ) * query_page_size;
    } else if ( req.body.query ) {
        query = encodeURIComponent( req.body.query );
    }

    var solr_query = 
        'select?wt=json&fl=id,name,set_name,set_shortname,rules_text,name,card_type,mana,cmc,rarity,image_name,score&q=partial_name:' + query;

    solr_query += '&rows=' + query_page_size;
    solr_query += '&start=' + query_start;

    console.log( solr_query );

    solr_client.get(solr_query, function(solr_err, solr_res) {
        if (solr_err) throw solr_err;
        var solr_res_obj = JSON.parse(solr_res);

        results = solr_res_obj.response;

        var num_found = results.numFound;

        req.page_num = page_num;
        req.results = results.docs;
        req.page_ceil = Math.ceil( num_found / query_page_size );
        req.query = req.params.query;
        req.num_found = results.numFound;

        next();

    });

}

exports.results = function(req, res){

    console.log( "hit search.results" );

    res.render( 'search_results', { 
        "title": 'card search results',
        "results": req.results,
        "query": req.query,
        "page_num": req.page_num,
        "page_ceil": req.page_ceil,
        "num_found": req.num_found,
    });
};

exports.index = function(req, res){

    console.log( "hit search index" );

};

