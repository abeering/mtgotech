
var solr = require('solr');
var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

var solr_client = solr.createClient();

var query = pg_client.query( 
    "SELECT id, name as name_t FROM card" 
);

query.on( 'row', function(row) {
    console.log( row.name_t );
    solr_client.add(row, function(err, response) {
        if( err ) throw err;
        console.log('added.');
    });
});

var t = setTimeout( function() {
    console.log( 'committing changes..' );
    solr_client.commit();
}, 2000 );
