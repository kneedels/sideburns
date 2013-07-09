/**
 * Created with JetBrains WebStorm.
 * User: Keith
 * Date: 6/23/13
 * Time: 9:42 PM
 * To change this template use File | Settings | File Templates.
 */
var distance = require('geo-distance');
var _ = require('underscore')._;
var http = require('http');

var boston = {
    lat: 42.3583,
    lon: -71.0603
};

// The most intense storm in America
var MostIntense = function(splitInput) {

    var self = this;

    self.applies = function() {
        return splitInput.length == 1;
    };

    self.superlative = "most intense storm in the united states";

    self.sortFunction = function(a, b) {
        return b.intensity - a.intensity;
    };
};

// The closest storm to Boston
var Closest = function(splitInput) {

    var self = this;

    self.applies = function() {
        return splitInput[1] && splitInput[1] === 'closest' && !splitInput[2];
    };

    self.superlative = "closest storm to Boston";

    self.sortFunction = function(a, b) {
        var aCoords = {
            lat: a.latitude,
            lon: a.longitude
        };

        var bCoords = {
            lat: b.latitude,
            lon: b.longitude
        };

        return distance.between(aCoords, boston) - distance.between(bCoords, boston);
    };
};

// The closest to Boston with a minimum intensity
var ClosestMinIntensity = function(splitInput) {
    var self = this;
    var min;

    if (splitInput[2]) {
        min = parseFloat(splitInput[2]);
    }

    self.superlative = "closest storm to Boston with a minimum intensity of " + splitInput[2];

    self.applies = function() {
        return splitInput[1] && splitInput[1] === 'closest' && min;
    };

    self.filterFunction = function(storm) {
        return storm.intensity >= min;
    };

    self.prototype = new Closest(splitInput);
};



var handlers = [MostIntense, Closest, ClosestMinIntensity];

// Now for the main show
var handleMessage = function(message, responseCallback) {

    var interestingHttpOptions = {
        host: 'darksky-proxy.herokuapp.com',
        path: '/interesting'
    };

    var split = message.split(' ');

    if (!(split && split[0] === '!storm')) {
        return;
    }

    var handlerInstances = _.map(handlers, function(handler) { return new handler(split); });
    var handler = _.filter(handlerInstances, function(instance) { return instance.applies() })[0];

    if (handler) {
        http.request(interestingHttpOptions, function(response) {
            var str = '';

            response.on('data', function(chunk) {
                str += chunk;
            });

            response.on('end', function() {

                var cleanedUp = str.match(/^grid && grid\((.*)\);$/)[1];
                var storms = JSON.parse(cleanedUp).storms;

                if (handler.filterFunction) {
                    storms = _.filter(storms, handler.filterFunction);
                }

                if (storms.length > 0) {
                    storms.sort(handler.sortFunction);
                    var target = storms[0];

                    var dst = distance.between( {lat: target.latitude, lon: target.longitude}, boston).human_readable("customary");
                    responseCallback('The ' + handler.superlative + ' is currently in ' +
                        target.city + ', which is ' + dst + ' from Boston.  Intensity is ' + target.intensity + '.  Details: ' +
                        'http://weatherspark.com/#!dashboard;q='  + target.latitude + ',' + target.longitude);
                } else {
                    responseCallback("No storms match your criteria.");
                }


            });
        }).end();
    }
};

module.exports = handleMessage;