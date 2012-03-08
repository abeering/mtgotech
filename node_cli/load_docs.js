
var solr = require('solr');
var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

var solr_client = solr.createClient();

var query = pg_client.query( 
    "SELECT id, series, series_number, name, card_type, mana, cmc, rarity, image_name FROM card" 
);

query.on( 'row', function(row) {
    console.log( row.name );

    var name_length = row.name.length;    

    var partials = [];

    for( i=1; i<=name_length; i++ ){
        for( n=0; n<i; n++){
            partials.push( row.name.substring( n, i ) );
        }
    }

    var docrow = 
    [ { 
        'id': row.id, 
        'name': row.name, 
        'partial_name': partials ,
        'series': row.series,
        'series_number': row.series_number,
        'card_type': row.card_type,
        'mana': row.mana,
        'cmc': row.cmc,
        'rarity': row.rarity,
        'image_name': row.image_name
    } ];

    solr_client.add(docrow, function(err, response) {
        if( err ) throw err;
        console.log('added.');
    });
});

var t = setTimeout( function() {
    console.log( 'committing changes..' );
    solr_client.commit();
}, 5000 );
