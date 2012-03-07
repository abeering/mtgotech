
/*
 *   CARD STUFFZ
 */


var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

exports.info = function(req, res){

    console.log( "hit info" );

    var id = req.params.id;

    var query = pg_client.query( "SELECT * FROM card WHERE id = $1", [ id ] );

    var info;

    query.on( 'error', function(error){
        res.send(error);
    });

    query.on( 'row', function(row) {
        info = row;
    });

    query.on( 'end', function(row) {
        res.render('card', { "title": info.name, "card_info": info })
    });

};

