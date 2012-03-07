
/*
 * GET home page.
 */

exports.index = function(req, res){
    console.log( "hit index" );
  res.render('index', { title: 'Express' })
};

exports.card = function(req, res){
    console.log( "hit card" );
    res.send( req.params );
};
