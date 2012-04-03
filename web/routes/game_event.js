
/*
 *   EVENT STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.display = function( req, res ){
    console.log( "hit game_event.display" );
    res.render('game_event', { "event_info": req.event_info, "event_players_info": req.event_players_info })
};

exports.event_info_by_id = function(req, res, next){

    console.log( "hit game_event.event_info_by_id" );

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

    console.log( "hit game_event.event_info_by_mtgoid" );

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

exports.event_players_info = function(req, res, next){

    console.log( "hit game_event.event_players_info" );

    var event_id = req.event_id;

    var query = pg_client.query( "SELECT ep.player_id, ep.rank, ep.wins, ep.losses, ep.deck_id, p.name AS player_name FROM events_players ep JOIN players p ON( p.id = ep.player_id ) WHERE ep.event_id = $1 ORDER BY rank DESC, wins DESC", [ event_id ] );

    var players = [];

    query.on( 'error', function(error){
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

