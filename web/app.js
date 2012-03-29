
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

// homepage
app.get('/', site.index);

// card pages
app.get('/card/:id', card.card_info, card.card_usage, card.card_relations, card.display );
app.get('/card/:id/format/:format', card.filter_format, card.card_info, card.card_usage, card.card_relations, card.display );

// deck pages
app.get('/deck/:deck_id', deck.deck_info, deck.deck_cards_info, deck.display);
app.get('/deck/build', deck.build);

// search pages
app.get('/search/card/:query', search.card_search, search.results );
app.get('/search', search.index);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
