var _ = require('underscore');
var async = require('async');
var csv = require('csvtojson');
var tulind = require('tulind');
var tf = require('@tensorflow/tfjs');
var Normalizer = require('neural-data-normalizer/dist/src/normalizer.js');
require('dotenv').load()

var stocks=[];
var results=[];
var features=[];

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
    _callback(null,'app-filter-on-REJECT_BELOW');
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
    features=[];
    async.each(results, function(item, done) {
      var result={};
      if ( typeof item.smaCloseStatus !== 'undefined') {
        result.smaCloseStatus=item.smaCloseStatus;
        result.isRecommended = true;
        features.push(result);
      }
      done();
    }, function(err) {
      _callback(null,'app-get-features');
    });
  },

  function(_callback) {

    var normalizer = new Normalizer.Normalizer(features);
     normalizer.setOutputProperties(['isRecommended']);
     normalizer.normalize();
     var metadata = normalizer.getDatasetMetaData();
     var inputs = normalizer.getBinaryInputDataset();
     var outputs = normalizer.getBinaryOutputDataset();

     var trainingData = [];
     for(var i = 0;i < outputs.length; i++) {
       trainingData.push({
          input: inputs[i],
          output: outputs[i]
       });
     };

     const model = tf.sequential();
     model.add(tf.layers.dense({units: 10, activation: 'sigmoid',inputShape: [inputs[0].length]}));
     model.add(tf.layers.dense({units: 3, activation: 'sigmoid',inputShape: [10]}));
     model.add(tf.layers.dense({units: 1, activation: 'sigmoid',inputShape: [3]}));
     model.compile({loss: 'meanSquaredError', optimizer: 'rmsprop'});

     const training_data = tf.tensor2d(_.pluck(trainingData,'input'));
     const target_data = tf.tensor2d(_.pluck(trainingData,'output'));

     async function go() {
        var h = await model.fit(training_data, target_data, {batchSize:32, epochs: 250});
        var loss = h.history.loss[0]
        console.log(loss);

        model.predict(tf.tensor2d([[0],[0.5],[1]])).print();

        _callback(null,'app-predict');
      }
      go();


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
