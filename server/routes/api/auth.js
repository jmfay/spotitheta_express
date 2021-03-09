const express = require('express');
const spotifyApi = require('../../config/spotify.config');
const dbClient = require('../../config/db.config');
const router = express.Router();
const frontend_address = 'http://localhost:8080/'


router.get('/', (req,res) => {
  // IF USER ALREADY AUTHENTICATED, REDIRECT TO DASHBOARD
  // NEED STATE/COOKIES FOR THIS
  if (false){
    res.status(200).end();
  }
  // ELSE, SEND AUTHENTICATION
  var html = spotifyApi.createAuthorizeURL(scopes);
  res.writeHead(302, {'Location': html+"&show_dialog=true"});
  res.send();
  // res.redirect(html+"&show_dialog=true");
});

router.get('/callback', async (req,res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  try {
    var data = await spotifyApi.authorizationCodeGrant(code)
    const { access_token, refresh_token } = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    dbConnect();

    res.redirect(`${frontend_address}dashboard`);
  } catch(err) {
    res.redirect(`${frontend_address}?e=denied`)
  }
});

// establishes connection to database to be used while in dashboard
async function dbConnect(){
  try{
    await dbClient.connect();
    console.log('Successfully connected to database');
  } catch (err) {
    console.log('Error connecting to database:' + err);
  }
}

module.exports = router;