
/*
 *   CARD STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.archetype_home = function( req, res ){

	res.render( 'archetypes_home', { 
		"title": "Archetypes", 
        "archetypes": req.archetypes,
		"format_archetype_usage": JSON.stringify(req.format_archetype_usage),
    });

};

exports.format_archetype_usage = function( req, res, next ){

	var query_string = "select et.name as event_type_name, COALESCE( a.name, 'Unknown' ) as archetype_name, d.archetype_id, dc.total, count(*) as count from decks d left join archetypes a ON( a.id = d.archetype_id ) join events_players ep ON( ep.deck_id = d.id ) join events e ON( e.id = ep.event_id ) join event_types et ON( et.id = e.event_type_id ) join ( SELECT e.event_type_id, count(*) as total from decks d join events_players ep ON( ep.deck_id = d.id ) join events e ON( e.id = ep.event_id ) group by e.event_type_id ) dc ON( dc.event_type_id = e.event_type_id ) WHERE e.event_type_id IN( 1, 4 ) and E.DATe > NOW() - interval '30 days' AND e.date < NOW() - interval '1 day' group by et.name, a.name, d.archetype_id, dc.total order by et.name, count";
	console.log( query_string );

	var query = pg_client.query( query_string );

	var archetype_usage = {};

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        var percentage = Math.round( ( ( row.count / row.total ) * 100 ));

        if( archetype_usage[ row.event_type_name ] ){
            archetype_usage[ row.event_type_name ].data.push( { label: row.archetype_id + ',' +row.archetype_name, data: percentage } );
        } else { 
            archetype_usage[ row.event_type_name ] = { 'data': [] };
        }

    });

    query.on( 'end', function(row) {

        req.format_archetype_usage = archetype_usage;

        next();

    });

}

exports.archetype_list = function( req, res, next ){

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

		req.archetypes = archetypes;

		next();

    });


};

exports.display_archetype = function( req, res ){

    res.render( 'archetype', { 
        "title": req.archetype_info.name, 
        "archetype_info": req.archetype_info, 
        "archetype_cards": req.archetype_cards, 
        "archetype_usage_plot_data": JSON.stringify(req.archetype_usage_plot_data),
        "archetype_recent_decks": req.archetype_recent_decks,
    });

};

exports.archetype_info = function(req, res, next){

    var id = req.params.id;

    var query_string;

    if( !isNaN(parseFloat(id)) && isFinite(id) ){
        query_string = "SELECT a.*, et.name AS event_type_name FROM archetypes a JOIN event_types et ON( et.id = a.event_type_id ) WHERE a.id = $1";
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
            req.archetype_info = info;
            next();
        } else { 
            res.redirect('/404');
        }
    });

};

exports.archetype_cards = function(req, res, next){


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
    
    var query_string = "SELECT ddc.date, ddc.event_type_id, ddc.total_decks, COALESCE( aa.count, 0 ) AS number FROM decks_daily_counts ddc LEFT JOIN ( SELECT e.date, e.event_type_id, a.name, COUNT(*) FROM decks d JOIN archetypes a ON( a.id = d.archetype_id ) JOIN events_players ep ON( ep.deck_id = d.id ) JOIN events e ON( e.id = ep.event_id ) WHERE d.archetype_id = $1 AND e.date > NOW() - interval '30 days' AND e.date < NOW() - interval '1 day' GROUP BY e.date, e.event_type_id, a.name ) aa ON( aa.date = ddc.date AND aa.event_type_id = ddc.event_type_id ) WHERE ddc.date > NOW() - interval '30 days' AND ddc.date < NOW() - interval '1 day' AND ddc.event_type_id = ( SELECT event_type_id FROM archetypes WHERE id = $1 ) ORDER BY date ASC";

    var query_params = [ req.archetype_info.id ];

    var query = pg_client.query( query_string, query_params );

    var archetype_daily_usage = { 
        label: req.archetype_info.name, 
        lines: { 'show': true }, 
        points: { 'show': true }, 
        color: 0,
        data: []
    };

    query.on( 'error', function(error){
        console.log( error );
        res.send(error);
    });

    query.on( 'row', function(row) {

        var percentage = Math.round( ( ( row.number / row.total_decks ) * 100 ));

        archetype_daily_usage.data.push( [ (new Date(row.date)).getTime(), percentage ] );

    });

    query.on( 'end', function(row) {

        req.archetype_usage_plot_data = archetype_daily_usage;

        next();
    });

};

exports.archetype_recent_decks = function( req, res, next ){

    var query_string = "SELECT d.id, ep.event_id, ep.wins, ep.losses, ep.rank, p.name as player_name, e.name as event_name, e.date as event_date FROM decks d JOIN events_players ep ON( ep.deck_id = d.id ) JOIN events e ON( e.id = ep.event_id ) JOIN players p ON( p.id = ep.player_id ) WHERE d.archetype_id = $1 ORDER BY e.date DESC LIMIT 20";

    var query = pg_client.query( query_string, [ req.archetype_info.id ] );

    var recent_decks = [];

    query.on( 'error', function(error){
        console.log( error );
        res.send(error);
    });

    query.on( 'row', function(row) {
    
        recent_decks.push( row );

    });

    query.on( 'end', function(row) {

        req.archetype_recent_decks = recent_decks;

        next();
    });

}


