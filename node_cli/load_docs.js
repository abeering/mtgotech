
var solr = require('solr');
var pg = require('pg');

var con_string = "tcp://postgres@localhost/decklist";
var pg_client = new pg.Client(con_string);
pg_client.connect();

var solr_client = solr.createClient();

var query = pg_client.query( 
    "SELECT id, name FROM card" 
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

    var docrow = [ { 'id': row.id, 'name': row.name, 'partial_name': partials } ];

    solr_client.add(docrow, function(err, response) {
        if( err ) throw err;
        console.log('added.');
    });
});

var t = setTimeout( function() {
    console.log( 'committing changes..' );
    solr_client.commit();
}, 5000 );
