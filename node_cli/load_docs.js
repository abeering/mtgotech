
var solr = require('solr');
var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

var solr_client = solr.createClient();

var query = pg_client.query( 
    "SELECT c.id, c.name, c.mana, c.rarity, c.type, c.rules_text, c.image_name, s.shortname, s.name as set_name FROM cards c JOIN sets s ON (c.set_id = s.id) WHERE c.parent_id IS NULL" 
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
        'card_type': row.type,
        'mana': row.mana,
        'rarity': row.rarity,
        'set_shortname': row.shortname,
        'set_name': row.set_name,
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
}, 25000 );
