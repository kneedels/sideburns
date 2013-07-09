var nick = 'sideburns';
var channel = '#old-gil';

var irc = require('irc');
var _ = require('underscore')._;

var client = new irc.Client('abstract.slashnet.org', nick, { channels: [ channel ] });

var handlers = [ require('./storm.js') ];

client.addListener('message', function(from, to, message) {

    var target = to === channel ? channel : from;

    _.each(handlers, function(handler) {
        handler(message, function(response) {
            client.say(target, response);
        })
    });

});