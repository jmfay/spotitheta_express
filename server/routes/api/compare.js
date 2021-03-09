// Compare will be responsible for querying database for friends and transforming artists into genre vectors, normalizing, and calculating cosine similarity
// who have also used Spotitheta and return their data to display and compare

const express = require('express');
const spotifyApi = require('../../config/spotify.config');
const dbClient = require('../../config/db.config');

const router = express.Router();

router.get('/', async (req,res) => {
  try {
    // check if user recently authorized, redirect to authorization if needed
    if (!spotifyApi.getAccessToken()){
      res.redirect('./recents/')
      return;
    }

    // req.body with usernames
    // query db for data
    // TODO HANDLE DATABASE REQUESTS HERE
    my_json;
    o_json;

    // converting json artists section into arrays
    // to preserve ordering
    const me = [];
    const other = [];
    for (i in my_json.artists){
      me.push([i,my_json.artists[i]]);
    }
    for (i in o_json.artists){
      other.push([i,o_json.artists[i]]);
    }

    // exchange artist ids for full artists objects
    const mydata = await spotifyApi.getArtists(me.map(x => x[0]));
    const odata = await spotifyApi.getArtists(other.map(x => x[0]));

    // find common artists/genres here?

    common_artists = {}
    // compile genres from API request and database
    // object magnitudes
    vec1 = {};
    for (var a in mydata.body.artists){
      //console.log(mydata.body.artists[a].name);
      //console.log(me[a][1])
      for (var g of mydata.body.artists[a].genres){
        if (g in vec1){
          vec1[g] += me[a][1]
        } else {
          vec1[g] = me[a][1];
        }
      }
    }

    
    vec2={};
    for (var a in odata.body.artists){
      //console.log(odata.body.artists[a].name);
      //console.log(other[a][1])
      for (var g of odata.body.artists[a].genres){
        if (g in vec2){
          vec2[g] += other[a][1]
        } else {
          vec2[g] = other[a][1];
        }
      }
    }

    //console.log(Object.keys(vec1).length);
    //console.log(Object.keys(vec2).length);

    shared={genres:[]};
    // "normalize" vectors
    for (var k of Object.keys(vec1)){
      if (!(k in vec2)){
        vec2[k] = 0;
      } else {
        shared.genres.push(k);
      }
    }

    console.dir(shared);

    for (var k of Object.keys(vec2)){
      if (!(k in vec1)){
        vec1[k] = 0;
      }
    }


    // CONVERT TO ARRAYS FOR PROPER SORTING
    var my_arr = []
    var o_arr = []
    for (i in vec1){
      my_arr.push([i,vec1[i]]);
    }
    for (i in vec2){
      o_arr.push([i,vec2[i]]);
    }

    // SORTING ARRAYS ALPHABETICALLY
    // (z,x,y) => (x,y,z)
    my_arr.sort(function(a,b){
      if(a[0] < b[0]) {return -1;}
      if(a[0] > b[0]) {return 1;}
      return 0;
    });
    o_arr.sort(function(a,b){
      if(a[0] < b[0]) {return -1;}
      if(a[0] > b[0]) {return 1;}
      return 0;
    });

    // STRIPPING ARRAYS FOR JUST MAGNITUDES
    // my_arr = [["Kid Cudi", 18], ....] --> [18,...] = my_mag
    // ORDER MUST BE PRESERVED
    my_mag = my_arr.map(x => x[1]);
    o_mag = o_arr.map(x => x[1]);

    // CALCULATE COSINE SIM with mags
    // CHECK FOR 0 ARRAYS?
    cossim = cosinesim(my_mag,o_mag);
    console.log(cossim);

    res.json({
      status: 'success',
      sim: cossim,
      mutuals: []
    });

    } catch(err) {
      console.log(err);
      res.status(400).send(err)
    }
  
});

function cosinesim(A,B){
  var dotproduct=0;
  var mA=0;
  var mB=0;
  for(i = 0; i < A.length; i++){ // here you missed the i++
      dotproduct += (A[i] * B[i]);
      mA += (A[i]*A[i]);
      mB += (B[i]*B[i]);
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  var similarity = (dotproduct)/((mA)*(mB)) // here you needed extra brackets
  return similarity;
}


async function getUserArtists(username){
  try {
    // Connect the dbClient to the server
    await dbClient.connect();
    // Establish and verify connection
    await dbClient.db("spot_user_history").command({ ping: 1 });
    console.log("Connected successfully to server");
    const collection = dbClient.db("spot_user_history").collection('spot_user_history');
    var query = {
      user:'jfa33'
    };
    const options = {};
    const cursor = collection.find(query,options);

    if ((await cursor.count()) === 0){
      console.log("No documents found!");
    }
    await cursor.forEach(console.dir);

  } finally {
    // Ensures that the client will close when you finish/error
    await dbClient.close();
  }
}

module.exports = router;

// temporary placeholders for what will be retrieved from db
let my_json = JSON.parse(`{"user":"jfa33","artists":{"56ZTgzPBDge0OvCGgMO3OY":3,"450o9jw6AtiQlQkHCdH6Ru":6,"5M52tdBnJaKSvOpJGz8mfZ":7,"0fA0VVWsXO9YnASrzqfmYu":5,"7k9T7lZlHjRAM1bb0r9Rm3":1,"053q0ukIDRgzwTr4vNSwab":1,"67hb7towEyKvt5Z8Bx306c":1,"6KImCVD70vtIoJWnq6nGn3":1,"17Vw9uuOYB7XYjPt0LNFN0":1,"6aVjo0xHSiuW5hkasoYSR3":1,"1YFLNH4rO40x9i16RpLwdY":1,"3Uqu1mEdkUJxPe7s31n1M9":2,"0dRiUTGvNV17AMIULRYsvn":1,"0yNLKJebCb8Aueb54LYya3":1,"77mJc3M7ZT5oOVM7gNdXim":2,"1OeYjH80o59axC1PYRV97m":2,"2EliUhznUrwHp1yJvhlHQF":1,"2oQX8QiMXOyuqbcZEFsZfm":1,"2u01kCKA5wDvvztuH8lyT0":1,"46SHBwWsqBkxI7EeeBEQG7":1,"3l0CmX0FuQjFxr8SK7Vqag":1,"0SwO7SWeDHJijQ3XNS7xEE":1,"3AA28KZvwAUcZuOKwyblJQ":1,"09kXLeOXRyfNQMXRaDO4qA":1,"2h93pZq0e7k5yf4dywlkpM":1,"39B7ChWwrWDs7zXlsu3MoP":1,"68kACMx6A3D2BYiO056MeQ":1,"3g2kUQ6tHLLbmkV7T4GPtL":1,"5INjqkS1o8h1imAzPqGZBb":1,"0tMnuEXTeJeHbslcV8OybJ":1}}`);

let o_json = JSON.parse(`{"user":"jfa33","artists":{"0fA0VVWsXO9YnASrzqfmYu":18,"2h93pZq0e7k5yf4dywlkpM":9,"3Uqu1mEdkUJxPe7s31n1M9":1,"4MXUO7sVCaFgFjoTI5ox5c":4,"2hPgGN4uhvXAxiXQBIXOmE":3,"3XHO7cRUPCLOr6jwp8vsx5":1,"0Y5tJX1MQlPlqiwlOH1tJY":1,"1Bl6wpkWCQ4KVgnASpvzzA":1,"5K4W6rqBFWDnAN6FQUkS6x":1,"2QsynagSdAqZj3U9HgDzjD":1,"1LeVJ5GPeYDOVUjxx1y7Rp":1,"5M52tdBnJaKSvOpJGz8mfZ":3,"2RhgnQNC74QoBlaUvT4MEe":1,"1moxjboGR7GNWYIMWsRjgG":1,"0epOFNiUfyON9EYx7Tpr6V":1,"73sIBHcqh3Z3NyqHKZ7FOL":1,"7bcbShaqKdcyjnmv4Ix8j6":1,"26T3LtbuGT1Fu9m0eRq5X3":1}}`);

let molly_medium_json = JSON.parse(`{"user":"xomollyfay","artists":{"2wY79sveU1sp5g7SokKOiI":23,"1HY2Jd0NmPuamShAr6KMms":9,"7CajNmpbOovFoOoasH2HaY":1,"3Sz7ZnJQBIHsXLUSo0OQtM":1,"4AK6F7OLvEQ5QYCBNiQWHq":5,"5YGY8feqx7naU7z4HrwZM6":1,"6qGkLCMQkNGOJ079iEcC5k":1,"52OQXvCMAJ0zqE2ZQrBTqC":1,"5cVeSOiS002MF1uiUFOPV5":1,"2feDdbD5araYcm6JhFHHw7":1,"6zlR5ttMfMNmwf2lecU9Cc":3,"0NIPkIjTV8mB795yEIiPYL":1,"6UE7nl9mha6s8z0wFQFIZ2":1,"3hv9jJF3adDNsBSIQDqcjp":1}}`);

let john_medium_json = JSON.parse(`{"user":"jayfayy","artists":{"49bzE5vRBRIota4qeHtQM8":2,"3NKVm2Jedcf6ibJr6pMUVx":1,"2xiIXseIJcq3nG7C8fHeBj":2,"5BtHciL0e0zOP7prIHn3pP":2,"5lVNSw2GPci8kebrAQpZqU":1,"2Pfv2w8a20xzC7Dr7QXRqM":1,"3utxjLheHaVEd9bPjQRsy8":1,"6TIYQ3jFPwQSRmorSezPxX":3,"45eNHdiiabvmbp4erw26rg":1,"0EyuKHE1AeE9lWUF8mzKVp":1,"6nS5roXSAGhTGr34W6n7Et":1,"5LfGQac0EIXyAN8aUwmNAQ":1,"7lIBLhQHKay3r1xtO3VtWT":1,"586uxXMyD5ObPuzjtrzO1Q":1,"6XyY86QOPPrYVGvF9ch6wz":3,"3TOqt5oJwL9BE2NG9MEwDa":1,"6olE6TJLqED3rqDCT0FyPh":1,"4bazJLWIv8CuqmgxJRiGqo":1,"6Wr3hh341P84m3EI8qdn9O":2,"6gZq1Q6bdOxsUPUG1TaFbF":1,"3h11MHQeCrcsUgRRijI1zL":1,"113reBz1jA6rVxbXl55mlj":1,"7FBcuc1gsnv6Y1nwFtNRCb":1,"6B5c4sch27tWHAGdarpPaW":1,"1yqxFtPHKcGcv6SXZNdyT9":1,"74XFHRwlV6OrjEM0A2NCMF":1,"3T0HSMgUpuH1hXbT1JPwQF":1,"2RTUTCvo6onsAnheUk3aL9":1,"1RyvyyTE3xzB2ZywiAwp0i":1,"0FBRY66KVaAiddGVefikLB":1,"2E1NFr5AeEGUJkLUUsWCAO":1,"55Aa2cqylxrFIXC767Z865":1,"4VNQWV2y1E97Eqo2D5UTjx":1,"39B7ChWwrWDs7zXlsu3MoP":1,"46gyXjRIvN1NL1eCB8GBxo":1,"4FN8WHqUbwkd97WEjoCu7B":1,"0M7GyeyRi2fG8c1LdP4jhi":1,"64tNsm6TnZe2zpcMVMOoHL":1,"1KpCi9BOfviCVhmpI4G2sY":1,"4Q6nIcaBED8qUel8bBx6Cr":1,"5X83BYTRaFGSoKLknnIpWz":1,"6deZN1bslXzeGvOLaLMOIF":1}}`);