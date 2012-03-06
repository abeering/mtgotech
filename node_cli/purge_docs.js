
var solr = require('solr');

var solr_client = solr.createClient();

solr_client.del( null, '*:*', function(err, res) {
    if (err) throw err;
});

solr_client.commit();
