var _ = require('underscore');
var async = require('async');
var csv = require('csvtojson');

var stocks=[];
var results=[];

async.series([

  function(_callback) {

    async function go() {
      stocks=await csv().fromFile('data/all_stocks_5yr.csv');
      _callback(null,'app-read-csv');
    }
    go();
  },

  function(_callback) {
    var rejects = _.filter(stocks, function(item) { return item.close < 200 })
    var rejectedNames = _.uniq(rejects, function(item) { return item.Name; });
    results = _.reject(stocks,function(item){return _.find(rejectedNames,{Name: item.Name});});
    _callback(null,'app-debug');
  },

  function(_callback) {
    var acceptedNames = _.pluck(_.uniq(results, function(item) { return item.Name; }),'Name');
    console.log('acceptedNames ',acceptedNames);
    console.log('acceptedNames.length ',acceptedNames.length);
    console.log('results.length ',results.length);
    _callback(null,'');
  },

],
function(err, results) {
  console.log(results);
});
