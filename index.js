var request;
var Twitter;

var NEWS_API_KEY = "--";

var MONGO_DATABASE_URL = '--';

var CONSUMER_KEY = "--";
var CONSUMER_SECRET = "---";
var ACCESS_TOKEN_KEY = "---";
var ACCESS_TOKEN_SECRET = "---";

startTwitterAPI();

var MongoClient = require('mongodb').MongoClient;

startTwitterStreamHashTagListen("#ExemploNewsbot", (screen_name, text)=> {

   responseUser(screen_name,text);

});


startNewsTwitterBotServer();



//----------- FUNCTIONS--------- ///


function startNewsTwitterBotServer() {
  var collection;
  setInterval(function() {
    console.log(
      "\n ------------- Send News (" + new Date() + ")-------------\n"
    );
    MongoClient.connect(
      MONGO_DATABASE_URL,
      function(err, db) {
        collection = db.collection("users");
        collection.find({}).toArray(function(err, users) {
          for (var i = 0; i < users.length; i++) {
            getTopNews(
              "br",
              users[i].user_interest,
              users[i].screen_name,
              null,
              (articles, screen_name, status_id) => {
                console.log("\n News for: @" + screen_name);
                for (let j = 0; j < 1; j++) {
                  console.log("   - " + articles[j].title);
                  tweet(
                    articles[j].title + " " + articles[j].url,
                    screen_name,
                    status_id
                  );
                }
              }
            );
          }
        });
        db.close();
      }
    );
  }, 60 * 1000); // 1 min
}

function responseUser (screen_name, text) {

  var userSentiment = getSentiment(text);
  var userInterest = getInterestedGenre(text);

  var user = {
    'screen_name': screen_name,
    'user_interest': userInterest
  };

  console.log(user);
  if(userInterest == null){
    tweet("Não entendi qual o seu interesse... "+ new Date() ,screen_name, null);
    return null;
  }

  MongoClient.connect(MONGO_DATABASE_URL, function (err, db) {
    console.log("Connected successfully to server");
    var collection = db.collection('users');
    if (userSentiment == 'positive') {
      collection.insertMany([user], function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log("Inserted a user interest into the collection");
          tweet("Opa vou te mandar umas noticias sobre " + userInterest + " " + new Date() ,screen_name, null);
          db.close();
        }
      });
    } else {
      collection.deleteOne(user, function (err, result) {
        console.log(err);
        console.log("Deleted a user interest from the collection");
        tweet("Ta ok então, vou parar de mandar noticias... " + userInterest + " " + new Date() ,screen_name, null);
        db.close();
      });
    }
  });
  
}


function getSentiment(text) {
  if (text.search('not interested') != -1) {
    return 'negative';
  }
  if (text.search('no more') != -1) {
    return 'negative';
  }
  if (text.search('don\'t send') != -1) {
    return 'negative';
  }
  if (text.search('no ') != -1) {
    return 'negative';
  }
  if (text.search('dont like ') != -1) {
    return 'negative';
  }
  if (text.search('unsubscribe ') != -1) {
    return 'negative';
  }
  if (text.search('don\'t follow ') != -1) {
    return 'negative';
  }
  if (text.search('stop ') != -1) {
    return 'negative';
  }
  return 'positive';
}


function getInterestedGenre(text) {
  if (text.search('tech') != -1 || text.search('technology') != -1) {
    return 'technology';
  }
  else if (text.search('politics') != -1 || text.search('political') != -1) {
    return 'politics';
  }
  else if (text.search('sports') != -1 || text.search('sport') != -1) {
    return 'sport';
  }
  else if (text.search('business') != -1) {
    return 'business';
  }
  else if (text.search('entertainment') != -1) {
    return 'entertainment';
  }
  else if (text.search('health') != -1) {
    return 'health';
  }
  else if (text.search('science') != -1) {
    return 'science';
  }
  return null;
}



function getTopNews(country, category, screen_name, status_id, callback) {
  request(
    {
      url:
        "https://newsapi.org/v2/top-headlines?" +
        "country=" +
        country +
        "&category=" +
        category +
        "&apiKey=" +
        NEWS_API_KEY,
      method: "GET"
    },
    function(error, response, body) {
      //response is from the bot
      if (!error && response.statusCode == 200) {
        var botResponse = JSON.parse(body);
        callback(botResponse.articles, screen_name, status_id);
      } else {
        console.log("Sorry. No new");
      }
    }
  );
}


function search(hashtag, resultType) {
  var params = {
    q: hashtag, // REQUIRED
    result_type: resultType,
    lang: "en"
  };
  Twitter.get("search/tweets", params, function(err, data) {
    if (!err) {
      console.log("Found tweets: " + data.statuses.length);
      console.log("First one: " + data.statuses[1].text);
    } else {
      console.log("Something went wrong while SEARCHING...");
    }
  });
}

function retweet(retweetId) {
  Twitter.post(
    "statuses/retweet/",
    {
      id: retweetId
    },
    function(err, response) {
      if (err) {
        console.log("Something went wrong while RETWEETING...");
        console.log(err);
      } else if (response) {
        console.log("Retweeted!!!");
        console.log(response);
      }
    }
  );
}

function tweet(statusMsg, screen_name, status_id) {
  console.log("Sending tweet to: " + screen_name);
  console.log("In response to:" + status_id);
  var msg = statusMsg;
  if (screen_name != null) {
    msg = "@" + screen_name + " " + statusMsg;
  }
  Twitter.post(
    "statuses/update",
    {
      status: msg
    },
    function(err, response) {
      if (err) {
        console.log("Something went wrong while TWEETING...");
        console.log(err);
      } else if (response) {
        console.log("Tweeted!!!");

      }
    }
  );
}


function startTwitterAPI() {
  var TwitterPackage = require("twitter");

  request = require("request");
  console.log("Hello World! I am a twitter bot!");
  var secret = {
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET
  };
  Twitter = new TwitterPackage(secret);
}

function startTwitterStreamHashTagListen(hashtag, callback) {
  console.log("Listening to:" + hashtag);

  Twitter.stream("statuses/filter", { track: hashtag }, function(stream) {
    stream.on("data", function(tweet) {
      console.log("Tweet:@" + tweet.user.screen_name + "\t" + tweet.text);
      console.log("------");
      callback(tweet.user.screen_name, tweet.text);
    });

    stream.on("error", function(error) {
      console.log(error);
    });
  });
}
