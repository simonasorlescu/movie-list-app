var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    path = require('path'),
    bodyParser = require('body-parser');

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

MongoClient.connect('mongodb://localhost:27017/video', function(err, db) {

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    app.get('/', function(req, res){

        db.collection('movies').find({}).sort({_id: -1}).limit(10).toArray(function(err, docs) {
            res.render('movies', { 'movies': docs } );
        });

    });

    app.post('/', function(req, res, next) {

        var title = req.body.title;
        var year = req.body.year;
        var imdb = req.body.imdb;
        db.collection('movies').findOne({imdb: imdb}, function(err, duplicateMovie) {
            if (err) {
                console.log('Failed to find the movie ' + imdb);
            }
            else  if (!title) {
                db.collection('movies').find({}).toArray(function(err, docs) {
                    res.render('movies', { 'movies': docs, error: 'Please choose a title.'} );
                });
            } else if (duplicateMovie) {
                db.collection('movies').find({}).toArray(function(err, docs) {
                    res.render('movies', { 'movies': docs, error: 'The movie exists. Please choose another one.'} );
                });
            } else {
                db.collection('movies').insertOne({title: title, year: year, imdb: imdb});
                console.log('Inserted a document into the movies collection');

                res.redirect('/');
            }
        });
    });

    app.post('/:imdb', function(req, res) {
        var imdb = req.params.imdb;

        db.collection('movies').remove({imdb: imdb}, function(err) {
            if (err) {
                console.log('Failed to remove movie ' + imdb);
            }
            else {
                console.log('Removed a document from the movies collection');
            }

            res.redirect('/');
        });

    });

    app.use(function(req, res){
        res.sendStatus(404);
    });

    var server = app.listen(3000, function() {
        var port = server.address().port;
        console.log('Express server listening on port %s.', port);
    });

});




