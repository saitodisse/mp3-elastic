define([
	'backbone',
  'libs/elastic_searcher',
  'models/song',
  'communicator',
  'libs/pretty_size',
  'libs/pretty_minutes'
],
function( Backbone, ElasticSearcher, Song, Communicator, pretty_size, pretty_minutes ) {
    'use strict';

	/* Return a model class definition */
	return Backbone.Model.extend({
		initialize: function() {
      this.audio = new Audio();
      this.volume = 50;
      this.audio.volume = this.volume / 100;

      // audio events
      this.audio.addEventListener('canplay', this.canplay.bind(this), false);
      this.audio.addEventListener('ended', this.ended.bind(this), false);
      
      this.elasticSearcher = new ElasticSearcher('http://192.168.15.103:9200/music_library/song/');

      Communicator.mediator.on('player:play', this.play, this);
      Communicator.mediator.on('player:pause', this.pause, this);
      Communicator.mediator.on('player:voldown', this.voldown, this);
      Communicator.mediator.on('player:volup', this.volup, this);
      Communicator.mediator.on('player:prev', this.prev, this);
      Communicator.mediator.on('player:next', this.next, this);
      Communicator.mediator.on('player:changeCurrentPosition', this.changeCurrentPosition, this);
      Communicator.mediator.on('player:volume', this.changeVolume, this);

		},

    play:function() {

      clearTimeout(this.tId);
      this.tId = setTimeout(this.updateProgressBar.bind(this), 1000);

      this.audio.play();
    },

    pause:function() {
      clearTimeout(this.tId);
      this.audio.pause();
    },

    prev:function() {
      var index = this.currentIndex;
      var songs = this.songs;
      var nextIndex = index - 1;

      if(nextIndex < 0){
        nextIndex = songs.length-1;
      }

      var newSong = songs.at(nextIndex);
      this.playSong(newSong);
    },

    next:function() {
      var index = this.currentIndex;
      var songs = this.songs;
      var nextIndex = index + 1;

      if(nextIndex > songs.length-1){
        nextIndex = 0;
      }

      var newSong = songs.at(nextIndex);
      this.playSong(newSong);
    },

    voldown:function() {
      if(this.volume > 0){
        this.volume -= 5;
        this.changeVolume(this.volume / 100);
        Communicator.mediator.trigger('player:volumeChanged', this.volume);
      }
    },

    volup:function() {
      if(this.volume < 100){
        this.volume += 5;
        this.changeVolume(this.volume / 100);
        Communicator.mediator.trigger('player:volumeChanged', this.volume);
      }
    },

    changeVolume: function (volume) {
      this.volume = Math.floor(volume*100);
      this.audio.volume = volume;
    },


    canplay: function () {
      clearTimeout(this.tId);
      this.totalLength = this.audio.duration;
      this.updateProgressBar();
    },

    updateProgressBar: function() {
      clearTimeout(this.tId);

      var currentTimeChanged = this.audio.currentTime / this.totalLength;
      Communicator.mediator.trigger('player:currentTimeChanged',
        {
          currentTimeChanged: currentTimeChanged,
          currentTime: this.audio.currentTime,
          totalLength: this.totalLength,
          currentTimeFormated: pretty_minutes(this.audio.currentTime),
          totalLengthFormated: pretty_minutes(this.totalLength),
        });
      this.tId = setTimeout(this.updateProgressBar.bind(this), 1000);
    },

    changeCurrentPosition: function(x) {
      this.audio.currentTime = x * this.totalLength;
    },

    ended: function () {
      this.next();
    },

		defaults: {},

    playId: function( id ) {
      //get path
      this.elasticSearcher.getIdElasticSearch( id ).then(function( songData ) {
        this.song = new Song( songData );
        this.playSong(this.song);

      }.bind(this))
    },

    playSong: function( song ) {
      this.song = song;
      //set the current index if exists
      if(this.songs && this.songs.indexOf(this.song) >= 0){
        this.currentIndex = this.songs.indexOf(this.song);
      }

      this.audio.src = this._convertUrl( this.song.get('filename') );
      this.audio.play();
      this.song.set('audio', this.audio);
      Communicator.mediator.trigger('player:song', this.song, this.audio);
    },

    playPlaylist: function( songs, song ) {
      this.songs = songs;
      this.song = song;
      this.playSong(this.song);
    },


    /*
      from /server/app.js
     */
    _convertUrl: function( oldPath ) {
      if(oldPath.indexOf('/media/julio/4 H-MP3 (1,36 TB)/') >= 0){
        return oldPath.replace('/media/julio/4 H-MP3 (1,36 TB)/', '/MP3-01/');
      }
      if(oldPath.indexOf('/media/julio/B21AB1E71AB1A92D/') >= 0){
        return oldPath.replace('/media/julio/B21AB1E71AB1A92D/', '/MP3-02/');
      }
      if(oldPath.indexOf('/media/julio/2GB, new/') >= 0){
        return oldPath.replace('/media/julio/2GB, new/', '/MP3-03/');
      }
      if(oldPath.indexOf('/media/julio/Files/') >= 0){
        return oldPath.replace('/media/julio/Files/', '/MP3-04/');
      }
      if(oldPath.indexOf('/home/julio/Música/') >= 0){
        return oldPath.replace('/home/julio/Música/', '/MP3-05/');
      }
    }

    });
});
