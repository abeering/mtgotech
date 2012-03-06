var solr = require('solr');

var client = solr.createClient();

var query = 'name_t:markov';

client.query(query, function(err, response) {
      if (err) throw err;
      var responseObj = JSON.parse(response);
      console.log('A search for "' + query + '" returned ' + responseObj.response.numFound + ' documents.');
      console.log('First doc title: ' + responseObj.response.docs[0].name_t);
      console.log('Second doc title: ' + responseObj.response.docs[1].name_t);
});
