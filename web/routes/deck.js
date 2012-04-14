
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

    var query = pg_client.query( "SELECT d.id AS deck_id, ep.rank, ep.wins, ep.losses, e.name AS event_name, e.mtgo_id as event_mtgo_id, e.date as event_date, e.id as event_id, p.name AS player_name, a.name AS archetype_name, a.id AS archetype_id FROM decks d JOIN events_players ep ON( d.id = ep.deck_id ) JOIN events e ON( e.id = ep.event_id ) JOIN players p ON( p.id = ep.player_id ) LEFT JOIN archetypes a ON( d.archetype_id = a.id ) WHERE d.id = $1", [ deck_id ] );

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

exports.deck_bbcode_txt = function(req, res){

    // construct a [deck] bbcode string for forum linkage
    var basic_types = { '0': 'Basic Land', '1': 'Land', '2': 'Creatures', '3': 'Sorceries', '4': 'Instants', 'null': 'Other Spells' }
    var bbcode_deck_content = "[deck=" + req.deck_info.player_name + "'s deck from #" + req.deck_info.event_mtgo_id + " on " + req.deck_info.event_date  + "]\n";

    for( basic_type in req.deck_cards_info.maindeck ){

            bbcode_deck_content += basic_types[ basic_type ] + "\n";
            
            for( i = 0; i < req.deck_cards_info.maindeck[ basic_type ].length; i++ ){
                bbcode_deck_content +=  req.deck_cards_info.maindeck[ basic_type ][ i ].count + ' ' + req.deck_cards_info.maindeck[ basic_type ][ i ].name + "\n";
            }

            bbcode_deck_content += "\n";

    }

    bbcode_deck_content += "Sideboard\n";

    for( i = 0; i < req.deck_cards_info.sideboard.length; i++ ){
        bbcode_deck_content += req.deck_cards_info.sideboard[ i ].count + ' ' + req.deck_cards_info.sideboard[ i ].name + "\n";
    }

    bbcode_deck_content += "[/deck]\n";
    bbcode_deck_content += "View this deck on mtgotech @ [url]http://mtgotech.com/deck/id/" + req.deck_info.deck_id + "[/url]\n";

    res.header('Content-Type', 'text/plain');
    res.end(bbcode_deck_content);

};

exports.deck_mtgo_deckfile_txt = function(req, res){

    var mtgo_deckfile_content = '';

    for( basic_type in req.deck_cards_info.maindeck ){

            for( i = 0; i < req.deck_cards_info.maindeck[ basic_type ].length; i++ ){
                mtgo_deckfile_content +=  req.deck_cards_info.maindeck[ basic_type ][ i ].count + ' ' + req.deck_cards_info.maindeck[ basic_type ][ i ].name + "\n";
            }

    }

    mtgo_deckfile_content += "Sideboard\n";

    for( i = 0; i < req.deck_cards_info.sideboard.length; i++ ){
        mtgo_deckfile_content += req.deck_cards_info.sideboard[ i ].count + ' ' + req.deck_cards_info.sideboard[ i ].name + "\n";
    }

    var deckfile_filename = req.deck_info.player_name + "'s #" + req.deck_info.event_mtgo_id + " decklist.txt";

    res.header('Content-Type', 'text/plain');  
    res.attachment( deckfile_filename );
    res.end(mtgo_deckfile_content);

};


exports.build = function(req, res){

    res.render('build');

}
