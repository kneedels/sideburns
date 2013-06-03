var nick = 'sideburns';
var channel = '#old-gil'

var irc = require('irc');
var http = require('http');

var client = new irc.Client('abstract.slashnet.org', nick, { channels: [ channel ] });

var interestingHttpOptions = {
	host: 'darksky-proxy.herokuapp.com',
	path: '/interesting'
};

client.addListener('message', function(from, to, message) {

	if (/^!storm$/.test(message)) {
	
		var target = to === channel ? channel : from;
	
		http.request(interestingHttpOptions, function(response) {
			var str = '';
			
			response.on('data', function(chunk) {
				str += chunk;
			});
			
			response.on('end', function() {
				
				var cleanedUp = str.match(/^grid && grid\((.*)\);$/)[1];
				
				var storms = JSON.parse(cleanedUp).storms;
				if (storms.length > 0) {
					storms.sort(function(a, b) {
						return b.intensity - a.intensity;
					});
				
					var mostIntense = storms[0];
					
					client.say(target, 'The most intense storm in the United States is currently in ' + mostIntense.city + '.  Intensity is ' + mostIntense.intensity + ' out of 75.  Details: ' + 
					'http://weatherspark.com/#!dashboard;q='  + mostIntense.latitude + ',' + mostIntense.longitude);
				} 
				else {
					client.say(target, 'There are no interesting storms right now.');
				}
				
			});
		}).end();	
		
	}
});