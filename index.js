var express = require('express');
var app = express();
var local = require("./local.config.js");
var cors = require('cors');
var Connection = require('mongodb').Connection;
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var bodyParser = require('body-parser');
var db = require('./data/db.js'),
    error_hdlr = require('./handlers/helpers.js'),
    fs = require('fs'),
    gallery_handlr = require('./handlers/gallery.js');
    var multer  = require('multer');
var port = local.config.db_config.port
    ? local.config.db_config.port
    : Connection.DEFAULT_PORT;
var store = new MongoDBStore(
  {
    uri: 'mongodb://localhost:' + port + '/AAPhotoGallery',
    collection: 'mySessions'
  });
// Catch errors
store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});
app.use(cors({ origin: true, credentials: true }))
app.options(cors({ origin: true, credentials: true }))

app.use('/photos', express.static(__dirname + "/photos"));

app.use(bodyParser.json({ limit: '50mb'}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(session({
    secret: "cat keyboard",
    name: "cookie_session",
    store: store, // connect-mongo session store
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
//    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.post('/Login', gallery_handlr.Login);
app.post('/ChangeAlbumDesc', gallery_handlr.ChangeAlbumDesc);
//app.post('/Upload', gallery_handlr.Upload);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, require('path').resolve(__dirname) + '\\temp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage });
var cpUpload = upload.fields([{ name: 'files', maxCount: 20 }, { name: 'albumName', maxCount: 1 }])
app.post('/Upload', cpUpload, gallery_handlr.Upload)

app.post('/DeletePic', gallery_handlr.DeletePic);
app.post('/UpdateFile', gallery_handlr.UpdateFile);

app.post('/NewAlbum', gallery_handlr.NewAlbum);
app.post('/DeleteAlbum', gallery_handlr.DeleteAlbum);
app.post('/SetSortOrder', gallery_handlr.SetSortOrder);
app.post('/RenameAlbum', gallery_handlr.RenameAlbum);
app.post('/SetThumbnail', gallery_handlr.SetThumbnail);
app.post('/Register',gallery_handlr.Register);
app.get('/GetAlbum/:user_name/:album_name.json', gallery_handlr.GetAlbum);
app.get('/ListAlbums/:user_name.json', gallery_handlr.ListAlbums);

app.post('*', four_oh_four);
app.get('*', four_oh_four);

function four_oh_four(req, res) {
    res.writeHead(404, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(error_hdlr.invalid_resource()) + "\n");
}

db.init(function (err, results) {
    if (err) {
        console.error("** FATAL ERROR ON STARTUP: ");
        console.error(err);
        process.exit(-1);
    }
    app.listen(88);
});
