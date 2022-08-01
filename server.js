const path = require('path');
const express = require('express');

const app = express();
const DIST_DIR = path.join(__dirname, '/dist');

app.use(express.static(DIST_DIR));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
     console.log("Listening on port " + PORT)
});