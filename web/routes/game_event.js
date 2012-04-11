
/*
 *   EVENT STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.display_event = function( req, res ){
    res.render('game_event', { "event_info": req.event_info, "event_players_info": req.event_players_info })
};

exports.display_recent_events = function( req, res ){
    res.render( 'game_events_recent', { "title": "Recent Events", "events": req.events } );
};

exports.event_info_by_id = function(req, res, next){

    var event_id = req.params.event_id;

    var query = pg_client.query( "SELECT * FROM events WHERE id = $1", [ event_id ] );

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        req.event_info = row;

    });

    query.on( 'end', function(row) {
        req.event_id = req.event_info.id;
        next();
    });

};

exports.event_info_by_mtgoid = function(req, res, next){

    var event_id = req.params.event_id;

    var query = pg_client.query( "SELECT * FROM events WHERE mtgo_id = $1", [ event_id ] );

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        req.event_info = row;

    });

    query.on( 'end', function(row) {
        req.event_id = req.event_info.id;
        next();
    });

};

exports.recent_events_info = function(req, res, next){

    var event_id = req.params.event_id;

    var query = pg_client.query( "( SELECT e.*, et.name AS event_type_name FROM events e JOIN event_types et ON( et.id = e.event_type_id ) WHERE e.event_type_id = 1 ORDER BY date DESC LIMIT 15 ) UNION ( SELECT e.*, et.name AS event_type_name FROM events e JOIN event_types et ON( et.id = e.event_type_id ) WHERE e.event_type_id = 3 ORDER BY date DESC LIMIT 15 ) UNION ( SELECT e.*, et.name AS event_type_name FROM events e JOIN event_types et ON( et.id = e.event_type_id ) WHERE e.event_type_id = 4 ORDER BY date DESC LIMIT 15 ) ORDER BY event_type_id ASC, date DESC" );

    var events = {};

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {
        if( events[ row.event_type_name ] ) {
            events[ row.event_type_name ].push( row );
        } else {
            events[ row.event_type_name ] = [ row ];
        }
    });

    query.on( 'end', function(row) {
        req.events = events;
        next();
    });

};

exports.event_players_info = function(req, res, next){

    var event_id = req.event_id;

    var query = pg_client.query( "SELECT ep.player_id, ep.rank, ep.wins, ep.losses, ep.deck_id, p.name AS player_name, a.id AS archetype_id, a.name AS archetype_name FROM events_players ep JOIN players p ON( p.id = ep.player_id ) JOIN decks d ON( ep.deck_id = d.id ) LEFT JOIN archetypes a ON( a.id = d.archetype_id ) WHERE ep.event_id = $1 ORDER BY rank ASC, wins DESC", [ event_id ] );

    var players = [];

    query.on( 'error', function(error){
        console.log( error );
        res.send(error);
    });

    query.on( 'row', function(row) {

        players.push( row );

    });

    query.on( 'end', function(row) {
        req.event_players_info = players;
        next();
    });

};

