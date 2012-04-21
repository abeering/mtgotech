
/*
 *   CARD STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.card_home = function( req, res ){

    var query_string = "( SELECT 'overall' as type, sco.event_type_id, c.id, c.name, s.shortname, c.image_name, sco.num FROM stats_cards_overall sco JOIN cards c ON( c.id = sco.card_id ) JOIN sets s ON( s.id = c.set_id ) ) UNION ( SELECT 'weekly' AS type, scw.event_type_id, c.id, c.name, s.shortname, c.image_name, scw.num FROM stats_cards_weekly scw JOIN cards c ON( c.id = scw.card_id ) JOIN sets s ON( s.id = c.set_id ) ) ORDER BY type, event_type_id ASC, num DESC";

    var query = pg_client.query( query_string );

    var card_stats = {};

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        if( card_stats[ row.type ] ) {
            if( card_stats[ row.type ][ row.event_type_id ] ){
                card_stats[ row.type ][ row.event_type_id ].push( row );
            } else {
                card_stats[ row.type ][ row.event_type_id ] = [ row ];
            } 
        } else {
            var foo = {};
            foo[ row.event_type_id ] = [ row ];
            card_stats[ row.type ] = foo;
        }

    });

    query.on( 'end', function(row) {

        res.render( 'card_home', { 
            "title": "Cards", 
            "card_stats": card_stats,
        });

    });


};

exports.display = function( req, res ){

    res.render( 'card', { 
        "title": req.card_info.name, 
        "card_info": req.card_info, 
        "card_usage": req.card_usage, 
        "relation_info": req.relation_info, 
        "filter_format_name": req.filter_format_name, 
        "card_usage_plot_data": JSON.stringify(req.card_usage_plot_data),
        "card_daily_usage_data": JSON.stringify(req.daily_usage_stats) 
    });
};

exports.filter_format = function(req, res, next){

    switch( req.params.format.toLowerCase() ){
        case 'pauper':
            req.filter_format = 4;
            req.filter_format_name = 'Pauper';
            break;
        case 'standard':
            req.filter_format = 1;
            req.filter_format_name = 'Standard';
            break;
        case 'legacy': 
            req.filter_format = 2;
            req.filter_format_name = 'Legacy';
            break;
        case 'modern':
            req.filter_format = 3;
            req.filter_format_name = 'Modern';
            break;
    }

    next();

}

exports.card_info = function(req, res, next){

    var id = req.params.id;

    var query_string;

    if( !isNaN(parseFloat(id)) && isFinite(id) ){
        query_string = "SELECT c.*, s.shortname FROM cards c JOIN sets s ON ( s.id = c.set_id ) WHERE c.id = $1 AND parent_id IS NULL";
    } else { 
        query_string = "SELECT c.*, s.shortname FROM cards c JOIN sets s ON ( s.id = c.set_id ) WHERE c.name ILIKE $1 AND parent_id IS NULL";
    }

    var query = pg_client.query( query_string, [ id ] );

    var info;

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {
        info = row;
    });

    query.on( 'end', function(row) {

        if( info ){
            req.card_info = info;
            next();
        } else { 
            res.redirect('/404');
        }
    });

};

exports.card_usage = function(req, res, next){

    // depends if limit_format was chained
    var query_string;
    var query_params;
    if( req.filter_format ){
        query_string = "SELECT card_id, number, SUM(seen) AS seen FROM cards_usage WHERE card_id = $1 AND event_type_id = $2 GROUP BY card_id, number ORDER BY number DESC";
        query_params = [ req.card_info.id, req.filter_format ];
    } else { 
        query_string = "SELECT card_id, number, SUM(seen) AS seen FROM cards_usage WHERE card_id = $1 GROUP BY card_id, number ORDER BY number DESC";
        query_params = [ req.card_info.id ];
    }

    var query = pg_client.query( query_string , query_params );

    var total_seen = 0;
    var usage_info = [];
    var usage_plot_data = [];

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        total_seen += row.seen;
        usage_info.push( row );
        usage_plot_data.push( [ row.number, row.seen ] );

    });

    query.on( 'end', function(row) {

        for( i=0; i < usage_info.length; i++ ){
            usage_info[i].percentage = Math.round( ( (usage_info[i].seen / total_seen) * 100 ));
        }
        
        req.card_usage_plot_data = usage_plot_data;
        req.card_usage = { 'total_seen': total_seen, 'usage_stats': usage_info };
        next();
    });
}

exports.card_relations = function(req, res, next){

    var query_string;
    var query_params;
    if( req.filter_format ){
        query_string = "SELECT second_card_id, sum(seen) as seen, c.name, s.shortname, c.image_name FROM cards_pair_usage cpu JOIN cards c ON( c.id = cpu.second_card_id ) JOIN sets s ON( s.id = c.set_id ) WHERE cpu.first_card_id = $1 AND event_type_id = $2 GROUP BY second_card_id, c.name, c.image_name, s.shortname ORDER BY SUM(seen) DESC LIMIT 24";
        query_params = [ req.card_info.id, req.filter_format ];
    } else { 
        query_string = "SELECT second_card_id, sum(seen) as seen, c.name, s.shortname, c.image_name FROM cards_pair_usage cpu JOIN cards c ON( c.id = cpu.second_card_id ) JOIN sets s ON( s.id = c.set_id ) WHERE cpu.first_card_id = $1 GROUP BY second_card_id, c.name, c.image_name, s.shortname ORDER BY SUM(seen) DESC LIMIT 24";
        query_params = [ req.card_info.id ];
    }

    var query = pg_client.query( query_string, query_params );

    var relation_info = [];

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {
        relation_info.push( row );
    });

    query.on( 'end', function(row) {

        for( i=0; i < relation_info.length; i++ ){
            relation_info[i].percentage = Math.round( ( (relation_info[i].seen / req.card_usage.total_seen) * 100 ));
        }
        
        req.relation_info = relation_info;
        next();
    });
}

exports.daily_usage_statistics = function(req, res, next){
    
    var query_string = "SELECT ddc.date, et.name AS event_type_name, ddc.total_decks, COALESCE(cdu.number,0) as total FROM decks_daily_counts ddc LEFT JOIN ( SELECT * FROM cards_daily_usage WHERE card_id = $1 AND cards_daily_usage.date > NOW() - interval '30 days' AND cards_daily_usage.date < NOW() - interval '1 day' ) cdu ON( ddc.date = cdu.date AND ddc.event_type_id = cdu.event_type_id ) JOIN event_types et ON( et.id = ddc.event_type_id AND et.id IN( ( SELECT DISTINCT event_type_id FROM cards_daily_usage WHERE card_id = $1 ) ) ) AND ddc.date > NOW() - interval '30 days' AND ddc.date < NOW() - interval '1 day' AND ddc.event_type_id IS NOT NULL ORDER BY ddc.date, et.name";
    var query_params = [ req.card_info.id ];

    var query = pg_client.query( query_string, query_params );

    var daily_usage_stats = {};
    var sideboard_usage_stats = {};
    // used for graph
    var color_index = 0;
    // used for filling gaps
    var last_date;

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        var percentage = Math.round( ( ( row.total / row.total_decks ) * 100 ));

        if( daily_usage_stats[ row.event_type_name ] ){
            daily_usage_stats[ row.event_type_name ].data.push( [ (new Date(row.date)).getTime(), percentage ] );
        } else { 
            daily_usage_stats[ row.event_type_name ] = { 'label': row.event_type_name, 'data': [], lines: { 'show': true }, points:{ 'show': true }, color: color_index };
            color_index++;
        }

    });

    query.on( 'end', function(row) {

        req.daily_usage_stats = daily_usage_stats;

        next();
    });


};
