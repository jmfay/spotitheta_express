const express = require('express');
// helps in extracting the body portion of an incoming request stream
const bodyParser = require('body-parser');
const cors = require('cors');
const dbClient = require('./config/db.config');
// environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();


// Middle-ware
app.use(bodyParser.json());
// further configuration of cors for security reasons?
// right now, works for all routes from localhost
/*const corsOptions = {
  origin: 'http://localhost:8080/',
}*/
app.use(cors());

const auth = require('./routes/api/auth');
app.use('/api/auth',auth);

const compare = require('./routes/api/compare');
app.use('/api/compare',compare);

const user = require('./routes/api/user');
app.use('/api/user', user);

// Handle production
if (process.env.NODE_ENV === 'production'){
  // Static folder
  app.use(express.static(__dirname+'/public/'));

  // Handle SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'));
}

const port = process.env.PORT || 5000;
app.listen(port, ()=> console.log(`Listening on port ${port}`))