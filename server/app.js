'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var hbs = require('express-hbs');




// init express
var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);

    app.set('view engine', 'handlebars');
    app.set('views', __dirname + '../app/scripts/views');
});

// set logging
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// mount static
app.use(express.static( path.join( __dirname, '../app') ));
app.use(express.static( path.join( __dirname, '../.tmp') ));


//static MP3 local files
app.use('/MP3-01', express.static( '/media/julio/4 H-MP3 (1,36 TB)/' ));
app.use('/MP3-02', express.static( '/media/julio/B21AB1E71AB1A92D/' ));
app.use('/MP3-03', express.static( '/media/julio/2GB, new/' ));
app.use('/MP3-04', express.static( '/media/julio/Files/' ));
app.use('/MP3-05', express.static( '/home/julio/Música/' ));


// route index.html
app.get('/', function(req, res){
  res.sendfile( path.join( __dirname, '../app/index.html' ) );
});

// start server
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express App started!');
});



