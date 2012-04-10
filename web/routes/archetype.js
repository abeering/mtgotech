
/*
 *   CARD STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.archetype_home = function( req, res ){

    console.log( "hit archetype.archetype_home" );

    var query_string = "SELECT a.*, et.name AS event_type_name FROM archetypes a JOIN event_types et ON( et.id = a.event_type_id ) ORDER BY a.event_type_id ASC, a.name ASC";

    var query = pg_client.query( query_string );

    var archetypes = {};

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        if( archetypes[ row.event_type_name ] ) {
            archetypes[ row.event_type_name ].push( row );
        } else { 
            archetypes[ row.event_type_name ] = [ row ];
        }

    });

    query.on( 'end', function(row) {

        res.render( 'archetypes_home', { 
            "title": "Archetypes", 
            "archetypes": archetypes,
        });

    });


};

exports.display_archetype = function( req, res ){
    console.log( "hit archetype.display_archetype" );

    res.render( 'archetype', { 
        "title": req.archetype_info.name, 
        "archetype_info": req.archetype_info, 
        "archetype_cards": req.archetype_cards, 
        //"archetype_usage_plot_data": JSON.stringify(req.archetype_usage_plot_data),
    });

};

exports.archetype_info = function(req, res, next){

    console.log( "hit archetype.archetype_info" );

    var id = req.params.id;

    var query_string;

    if( !isNaN(parseFloat(id)) && isFinite(id) ){
        query_string = "SELECT a.*, et.name AS event_type_name FROM archetypes a JOIN event_types et ON( et.id = a.event_type_id ) WHERE a.id = $1";
    } 
    console.log( query_string );

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
            req.archetype_info = info;
            next();
        } else { 
            res.redirect('/404');
        }
    });

};

exports.archetype_cards = function(req, res, next){

    console.log( "hit archetype.archetype_cards" );

    var query_string = "SELECT c.*, s.shortname FROM archetypes_cards ac JOIN cards c ON( c.id = ac.card_id ) JOIN sets s ON( s.id = c.set_id ) WHERE ac.archetype_id = $1";

    var query = pg_client.query( query_string, [ req.archetype_info.id ] );

    var cards = [];

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        cards.push( row );

    });

    query.on( 'end', function(row) {

        req.archetype_cards = cards;
        next();

    });
}

exports.archetype_usage = function(req, res, next){
    
    console.log( "hit card.daily_usage_statistics" );
    // FIXME
        next();
    /*

    var query_string = "SELECT ddc.date, et.name AS event_type_name, ddc.total_decks, COALESCE(cdu.number,0) as total FROM decks_daily_counts ddc LEFT JOIN ( SELECT * FROM cards_daily_usage WHERE card_id = $1 AND cards_daily_usage.date > NOW() - interval '30 days' AND cards_daily_usage.date < NOW() - interval '1 day' ) cdu ON( ddc.date = cdu.date AND ddc.event_type_id = cdu.event_type_id ) JOIN event_types et ON( et.id = ddc.event_type_id AND et.id IN( ( SELECT DISTINCT event_type_id FROM cards_daily_usage WHERE card_id = $1 ) ) ) AND ddc.date > NOW() - interval '30 days' AND ddc.date < NOW() - interval '1 day' AND ddc.event_type_id IS NOT NULL ORDER BY ddc.date, et.name";
    var query_params = [ req.card_info.id ];
    console.log( query_string );

    var query = pg_client.query( query_string, query_params );

    var daily_usage_stats = {};
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
    */

};
