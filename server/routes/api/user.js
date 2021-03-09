// user will handle current user actions

const express = require('express');
const spotifyApi = require('../../config/spotify.config');
const dbClient = require('../../config/db.config');
const { json } = require('body-parser');

const router = express.Router();

// use this middle-ware
//const bodyParser = require('body-parser');
//router.use(bodyParser.json());

// gets users username and picture, and begins database connection
router.get('/retrieveInfo', async (req,res) => {
  try {
    var user = await spotifyApi.getMe();

    const user_id = user.body.id;
    const user_pfp = user.body.images[0].url;
    res.status(200).json({
      name: user_id,
      pfp: user_pfp
    });
  } catch (err) {
    res.status(500);
  }
});

// After setting access/refresh tokens, get list of users top artists
// over span of 6 months
router.get('/retrieveArtists', async (req,res) => {
  try {
    if (!spotifyApi.getAccessToken()){
      console.log('Something went wrong');
      res.status(500).send();
      return;
    }
    // get current user's display name
    var user = await spotifyApi.getMe();

    // DATABASE OBJECT - ARTIST IDS AND QUANTITIES
    db_vec = {
      user: user.body.id,
      artists: {},
    }

    // VECTOR WITH ARTIST NAMES AND QUANTITIES
    front_vec = {
      artists: {}
    }

    // save for when comparison is being made
    // check Spotify Dev TOS, not sure if allowed
    /*if (user.body.images){
      db_vec.pfp = user.body.images[0].url;
    }*/

    // TODO Vary short/medium/long term? How will they affect results
    var data = await spotifyApi.getMyTopTracks({
      limit: 50,
      time_range: 'medium_term'
    });
    const songs = data.body.items;
    
    var s=0;
    // retrieving main artist ID from songs list
    for (var s=0;s<songs.length;s++){
      main_artist = songs[s].artists[0];
      if (main_artist.id in db_vec.artists){
        db_vec.artists[main_artist.id]++;
      } else {
        db_vec.artists[main_artist.id] = 1;
      }
      if (main_artist.name in front_vec.artists){
        front_vec.artists[main_artist.name]++;
      } else {
        front_vec.artists[main_artist.name] = 1;
      }
    }
    // create/update Mongodb document
    await upsertUser(db_vec);
    
    res.json(front_vec);
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong.');
  } finally {
    //dbClient.close();
  }
});

// Remove current user's database entry
router.get('/disconnect', async (req,res) => {
  try {
    // hard-coded in, but connect username to front-end request
    // to avoid another Spotify API call [getMe()]
    console.log("DISCONNECTING USER");
    user = "jfa33";
    await deleteUser(user);

    // successfully deleted
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    // user not in db, already deleted
    res.sendStatus(410);
  } finally {
    await dbClient.close()
  }
});

module.exports = router;

// FOR DEV PURPOSES ONLY
// create current user's database entry
router.get('/insert', async (req,res) => {
  try{
    await dbClient.connect();
    await upsertUser(my_json);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    // something went wrong with upserting user's db entry
    res.sendStatus(500);
  }
  finally {
    await dbClient.close()
  }
});

router.get('/search', async (req,res) => {
  try{
    const username = req.query.q;

    const found = await checkUser(username);
    
    if (found) {
      res.json({status: 'success'});
    } else {
      res.json({status: 'failure'});
    }
  } catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
});




// CRUD - CREATE & UPDATE
// if user exists, will simply update artists
// else, new db document created
async function upsertUser(freshListing){
  try {
    let result = await dbClient.db('spotitheta').collection('users').updateOne({user:freshListing.user},{$set: {artists:freshListing.artists}},{upsert: true});

    // debugging;
    if (result.upsertedCount > 0) {
      console.log(`One document was inserted with the id ${result.upsertedId._id}`);
    } else {
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
    }
  } catch(err) {
    throw err;
  }
}

// CRUD - READ
// kinda, just checks if exists, not actually reading
async function readUser(username){
  let result = await dbClient.db('spotitheta').collection('users').findOne({user:username});

  if (result) {
    console.log(`Found a listing in the collection with the name '${username}'`);
    return result;
  } else {
    console.log(`No listings found with the name '${username}'`);
    return null;
  }
}

async function checkUser(username){
  let result = await dbClient.db('spotitheta').collection('users').findOne({user:username});
  if (result) {
    return true;
  } else {
    return false;
  }
}

// CRUD - DELETE
// remove user's document from the Mongo db
async function deleteUser(toBeDeleted) {
  let result = await dbClient.db('spotitheta').collection('users').deleteOne({user:toBeDeleted});

  if (result.deletedCount == 1){
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
  } else {
    throw `Something went wrong trying to delete the following user: ${toBeDeleted}`;
  }
  
}

// for testing purposes
let my_json = JSON.parse(`{"user":"jfa33_HARD","artists":{"56ZTgzPBDge0OvCGgMO3OY":3,"450o9jw6AtiQlQkHCdH6Ru":6,"5M52tdBnJaKSvOpJGz8mfZ":7,"0fA0VVWsXO9YnASrzqfmYu":5,"7k9T7lZlHjRAM1bb0r9Rm3":1,"053q0ukIDRgzwTr4vNSwab":1,"67hb7towEyKvt5Z8Bx306c":1,"6KImCVD70vtIoJWnq6nGn3":1,"17Vw9uuOYB7XYjPt0LNFN0":1,"6aVjo0xHSiuW5hkasoYSR3":1,"1YFLNH4rO40x9i16RpLwdY":1,"3Uqu1mEdkUJxPe7s31n1M9":2,"0dRiUTGvNV17AMIULRYsvn":1,"0yNLKJebCb8Aueb54LYya3":1,"77mJc3M7ZT5oOVM7gNdXim":2,"1OeYjH80o59axC1PYRV97m":2,"2EliUhznUrwHp1yJvhlHQF":1,"2oQX8QiMXOyuqbcZEFsZfm":1,"2u01kCKA5wDvvztuH8lyT0":1,"46SHBwWsqBkxI7EeeBEQG7":1,"3l0CmX0FuQjFxr8SK7Vqag":1,"0SwO7SWeDHJijQ3XNS7xEE":1,"3AA28KZvwAUcZuOKwyblJQ":1,"09kXLeOXRyfNQMXRaDO4qA":1,"2h93pZq0e7k5yf4dywlkpM":1,"39B7ChWwrWDs7zXlsu3MoP":1,"68kACMx6A3D2BYiO056MeQ":1,"3g2kUQ6tHLLbmkV7T4GPtL":1,"5INjqkS1o8h1imAzPqGZBb":1,"0tMnuEXTeJeHbslcV8OybJ":1}}`);