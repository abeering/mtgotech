var solr = require('solr');

var client = solr.createClient();

//var query = 'name:mar';
var query = 'name:markov';

console.log( query );
client.query(query, function(err, response) {
      if (err) throw err;
      var responseObj = JSON.parse(response);
        //console.log( "\n\n\n\n" );
      //console.log( responseObj );
});

//var query = 'select?fl=*,score,partial_name&q=*:*&facet=true&facet.field=name_auto&facet.mincount=1&facet.prefix=blade&wt=json';
var query = 'select?fl=id,name,score&q=partial_name:doom%20trav&wt=json';

console.log( query );
client.get(query, function(err, response) {
      if (err) throw err;
      var responseObj = JSON.parse(response);
        console.log( "\n\n\n\n" );
      console.log( responseObj );
        console.log( "\n\n" );
        console.log( responseObj.response.docs );

});
