var db = require('./db.js'),
async = require('async'), fs = require('fs');

exports.Register = function(login,password, cb) {
    db.gallery.find({ "userName" :  { $regex: "^" + login + '$', $options: "-i" } }).toArray(function(err, results) {
        if (err) cb(err);
        else if (results.length) cb("Username already exists");
        else {
          db.gallery.insert({userName: login,password: password,Albums:[]},cb);
        }
    });
}

exports.Login = function(userName, cb) {
  //db.gallery.remove(cb);
  db.gallery.find({ "userName" :  { $regex: "^" + userName + '$', $options: "-i" } },{ 'password': 1 }).toArray(cb);
};

exports.getAlbum = function(userName,albumName, cb) {
  db.gallery.find({ "userName" :  userName},{ _id:0, 'Albums':1 }).toArray(function(err, results) {
    if (err || !results.length) cb(null, []);
    else {
      //got frustrated trying to get this query to work so he's a work around, sorry
      var albums = results[0].Albums;
      for (a in albums) {
        if (albums[a].title == albumName) { cb(null, albums[a].Pictures); return; }
      }
      cb(null, []);
    }
  });
};
exports.getList = function(userName, cb) {
  db.gallery.find({ "userName" :  userName },{ _id:0, 'Albums.thumbnail': 1,'Albums.title':1,'Albums.description':1,'Albums.sortOrder':1 }).toArray(function(err, results) {
    if (err || !results.length) cb(null, []);
    else cb(null, results[0].Albums);
  });
};

exports.updateAlbum = function(userId, userName, albumName, newValue, whatToUpdate, cb) {
    var updating = {};
    updating["Albums.$." + whatToUpdate] = newValue;
    db.gallery.update({ "_id" :  userId,"Albums.title": { $regex: "^" + albumName + '$',$options:"-i" } },{ $set: updating },{safe:true},function(err,result) {
      //if album isn't found, result is 0, we have to verify the folder exists and add it with the description property
      if (!result) {
        fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + userName + '\\' + albumName, function (err, stats) {
          if (!err && stats.isDirectory()) {
            var album = { "title":albumName,"thumbnail":"","description":"","sortOrder":0 };
            album[whatToUpdate] = newValue;
            addAlbum(userId,album,cb);
          }
          else cb("Album does not exist");
        });
    }
    else { cb(null); }
  });
}
function addAlbum(userId,album,cb) {
  db.gallery.update({"_id":userId },{ $push: { Albums: album }},{safe:true},cb);
}
exports.DeleteAlbum = function(userId,album,cb) {
  db.gallery.update({"_id":userId },{ $pull: { Albums: album }},{safe:true},cb);
}
exports.DeletePic = function(userId,albumName,filename,cb) {
  db.gallery.update({"_id":userId,"Albums.title": { $regex: "^" + albumName + '$',$options:"-i" } },{ $pull: { 'Albums.$.Pictures': { filename: { $regex: "^" + filename + '$',$options:"-i" } } }},{safe:true},function(err, result) {
    if (err) cb(err);
    else cb(null);
  });
}
exports.updateFile = function(userId, userName, albumName, filename, description, newFile, callback) {
  async.waterfall([
    //check that the old file exists
    function(cb) {
      fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + userName + '\\' + albumName + '\\' + filename, function (err, stats) {
        if (!err && stats.isFile()) cb(null);
        else cb("File does not exist");
      });
    },
    //pull old file from database
    function(cb) {
      db.gallery.update({"_id":userId,"Albums.title": { $regex: "^" + albumName + '$',$options:"-i" } },{ $pull: { 'Albums.$.Pictures': { filename: { $regex: "^" + filename + '$',$options:"-i" } } }},{safe:true},function(err, result) {
        if (err) cb(err);
        else cb(null);
      });
    },
    //push new one
    function(cb) {
      var pic = { "filename":(newFile ? newFile.trim() : filename),"description":description };
      db.gallery.update({"_id":userId,"Albums.title": { $regex: "^" + albumName + '$',$options:"-i" } },{ $push: { 'Albums.$.Pictures': pic } },{safe:true},cb);
    },
  ],callback);
}
