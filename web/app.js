
/**
 * Module dependencies.
 */

var express = require('express')
  , site = require('./routes/site')
  , card = require('./routes/card')
  , search = require('./routes/search')
  , deck = require('./routes/deck')
  , game_event = require('./routes/game_event')
  , archetype = require('./routes/archetype');

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

app.error(function(err, req, res, next){
    if( err instanceof NotFound ){
        res.render('404');
    } else { 
        next(err);
    }
});


// Routes

// homepage
app.get('/', card.card_home ); 

// card pages
app.get('/card/id/:id', card.card_info, card.card_usage, card.card_relations, card.daily_usage_statistics, card.display );
app.get('/card/id/:id/format/:format', card.filter_format, card.card_info, card.card_usage, card.card_relations, card.daily_usage_statistics, card.display );
app.get('/cards', card.card_home ); 

// deck pages
app.get('/deck/id/:deck_id', deck.deck_info, deck.deck_cards_info, deck.display );
// app.get('/deck/build', deck.build);

// event pages
app.get('/event/id/:event_id', game_event.event_info_by_id, game_event.event_players_info, game_event.display_event );
app.get('/event/mtgoid/:event_id', game_event.event_info_by_mtgoid, game_event.event_players_info, game_event.display_event );
app.get('/events', game_event.recent_events_info, game_event.display_recent_events );

// archetype pages
app.get('/archetypes', archetype.archetype_home );
app.get('/archetype/id/:id', archetype.archetype_info, archetype.archetype_cards, archetype.archetype_usage, archetype.archetype_recent_decks, archetype.display_archetype );

// search pages
app.get('/search/card/:query', search.card_search_partial, search.results );
app.get('/search/card/:query/page/:page_num', search.card_search_partial, search.results );
app.post('/search/card', search.card_search_partial, search.results );

app.get('/404', function(req,res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

NotFound.prototype.__proto__ = Error.prototype;

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
