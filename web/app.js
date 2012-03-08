
/**
 * Module dependencies.
 */

var express = require('express')
  , site = require('./routes/site')
  , card = require('./routes/card')
  , search = require('./routes/search')
  , deck = require('./routes/deck');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', site.index);
app.get('/card/:id', card.info);
app.get('/search/card/:query', search.card_search, search.results );
app.get('/search', search.index);
app.get('/deck', deck.build);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
