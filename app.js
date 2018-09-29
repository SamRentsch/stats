var _ = require('underscore');
var async = require('async');
var csv = require('csvtojson');
var tulind = require('tulind');
require('dotenv').load()

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
    var rejects = _.filter(stocks, function(item) { return item.close < parseInt(process.env.REJECT_BELOW) })
    var rejectedNames = _.uniq(rejects, function(item) { return item.Name; });
    results = _.reject(stocks,function(item){return _.find(rejectedNames,{Name: item.Name});});
    _callback(null,'app-debug');
  },

  function(_callback) {
    var closes = _.map(results,function(item){return item.close;})
    tulind.indicators.sma.indicator([closes], [process.env.SMA_CLOSE], function(err, smaCloses) {
      var previous=0;
      _.each(results,function(item,iteratee){
        if (iteratee >= parseInt(process.env.SMA_CLOSE) ) {
          item.smaClose=Math.round(smaCloses[0][(iteratee-parseInt(process.env.SMA_CLOSE))]);
          if (item.smaClose === previous)
            item.smaCloseStatus=0;
          else if (item.smaClose > previous)
            item.smaCloseStatus=1;
            else if (item.smaClose < previous)
              item.smaCloseStatus=-1;
          previous=item.smaClose;
        }
      })
      _callback(null,'app-sma-close');
    });
  },

  function(_callback) {
    var acceptedNames = _.pluck(_.uniq(results, function(item) { return item.Name; }),'Name');
    console.log('last item in results ',results[(results.length-1)]);
    console.log('acceptedNames ',acceptedNames);
    console.log('acceptedNames.length ',acceptedNames.length);
    console.log('results.length ',results.length);
    _callback(null,'');
  },

],
function(err, results) {
  console.log(results);
});
