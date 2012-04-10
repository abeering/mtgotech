
/*
 *   DECK STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.display = function( req, res ){
    res.render('deck', { "title": 'Viewing Deck', "deck_info": req.deck_info, "deck_cards_info": req.deck_cards_info })
};

exports.deck_info = function(req, res, next){

    var deck_id = req.params.deck_id;

    var query = pg_client.query( "SELECT ep.rank, ep.wins, ep.losses, e.name AS event_name, e.mtgo_id as event_mtgo_id, e.date as event_date, e.id as event_id, p.name AS player_name FROM decks d JOIN events_players ep ON( d.id = ep.deck_id ) JOIN events e ON( e.id = ep.event_id ) JOIN players p ON( p.id = ep.player_id ) WHERE d.id = $1", [ deck_id ] );

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        req.deck_info = row;

    });

    query.on( 'end', function(row) {
        next();
    });

};

exports.deck_cards_info = function(req, res, next){

    var deck_id = req.params.deck_id;

    var query = pg_client.query( "SELECT dc.card_id, dc.type, c.name, c.basic_type, s.shortname, c.image_name, COUNT(card_id) FROM decks_cards dc JOIN cards c ON( c.id = dc.card_id ) JOIN sets s ON( s.id = c.set_id ) WHERE dc.deck_id = $1 GROUP BY dc.card_id, dc.type, c.name, c.basic_type, s.shortname, c.image_name ORDER BY dc.type ASC, c.basic_type ASC, c.name ASC", [ deck_id ] );

    var info = [];

    info.maindeck = {};
    info.sideboard = [];

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {

        if( row.type == 1 ){
            if( info.maindeck[row.basic_type] ){
                info.maindeck[row.basic_type].push( row );
            } else { 
                info.maindeck[row.basic_type] = [];
                info.maindeck[row.basic_type].push( row );
            }
        } else if( row.type == 2 ){
            info.sideboard.push( row );
        }

    });

    query.on( 'end', function(row) {
        req.deck_cards_info = info;
        next();
    });

};


exports.build = function(req, res){

    res.render('build');

}
