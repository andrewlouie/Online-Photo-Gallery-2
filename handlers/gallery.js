var helpers = require('./helpers.js'),
    async = require('async'),
    gall_data = require('../data/gall_data.js'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf');

exports.Login = function(req,res) {
  async.waterfall([
      function (cb) {
        //make sure all the fields are submitted
          if (!req.body || !req.body.login || !req.body.password) {
              cb("Missing info");
              return;
          }
          cb(null);
      },
      function (cb) {
          //validate info and login
          gall_data.Login(req.body.login,function(err, result) {
            if (err || !result.length) cb("Invalid login");
            else if (result[0].password == req.body.password) { req.session.login = result[0]._id; req.session.userName = req.body.login; req.session.save(); cb(null); }
            else cb("Invalid password");
          });
      }
  ],
  function (err, results) {
      if (err) {
          helpers.send_error(res, err);
      } else {
          helpers.send_success(res, { Success: true });
      }
  });
};

exports.GetAlbum = function(req,res) {
  async.waterfall([
    function(cb) {
      //get listing from folder
      fs.readdir(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.params.user_name + '\\' + req.params.album_name,function(err, files) {
        if (err || typeof files == 'undefined') cb(null, []);
        else cb(null, files);
      });
    },
    function (fileList, cb) {
      //merge with results from database
      gall_data.getAlbum(req.params.user_name,req.params.album_name,function(err, result) {
        if (err) cb(err);
        else {
          if (typeof result === 'undefined') result = [];
          //remove ones from file list that are in results
          var spresult = [];
          var lowerCaseNames = fileList.map(function(value) {
            return value.toLowerCase();
          });
          for (r in result) {
            if (lowerCaseNames && result[r].filename && lowerCaseNames.indexOf(result[r].filename.toLowerCase()) > -1) {
              var idx = lowerCaseNames.indexOf(result[r].filename.toLowerCase())
              lowerCaseNames.splice(idx,1);
              fileList.splice(idx,1);
              spresult.push(result[r]);
            }
          }
          //make the remaining items in fileList part of results as objects
          for (f in fileList) {
            spresult.push({ filename: fileList[f], description: fileList[f].replace(/\.[^/.]+$/, "") })
          }
          cb(null, spresult);
        }
      });
    },
  ],
  function (err, results) {
      if (err) {
          helpers.send_error(res, err);
      } else {
          helpers.send_success(res, { Success: results });
      }
  });
};

exports.ListAlbums = function(req,res) {
  async.waterfall([
    function(cb) {
      //get listing from folder
      fs.readdir(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.params.user_name,function(err, folders) {
        if (err || typeof folders == 'undefined') cb(null, []);
        else cb(null, folders);
      });
    },
    function (fileList, cb) {
      //merge with results from database
      gall_data.getList(req.params.user_name,function(err, result) {
        if (err) cb(err);
        else {
          //remove ones from file list that are in results
          var spresult = [];
          var lowerCaseNames = fileList.map(function(value) {
            return value.toLowerCase();
          });
          for (r in result) {
            if (result[r].title && lowerCaseNames && lowerCaseNames.indexOf(result[r].title.toLowerCase()) > -1) {
              var idx = lowerCaseNames.indexOf(result[r].title.toLowerCase());
              lowerCaseNames.splice(idx,1);
              fileList.splice(idx,1);
              spresult.push(result[r]);
            }
          }
          //make the remaining items in fileList part of results as objects
          for (f in fileList) {
            spresult.push({ title: fileList[f], thumbnail: null,description:"",sortOrder:0 })
          }
          spresult.sort(function(a,b) {
            return (parseInt(a.sortOrder,10)>parseInt(b.sortOrder,10) ? 1 : -1);
          });
          cb(null, spresult);
          return;
        }
      });
    },
    function(result, cb) {
      //if the thumbnail is not defined in the database, use the first file in that folder
      (function iterator(i) {
        if(i < result.length) {
          if (!result[i].thumbnail) {
            fs.readdir(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.params.user_name + '\\' + result[i].title, function(err, newresult) {
              if (!err && newresult.length) { result[i].thumbnail = newresult[0]; }
              else result[i].thumbnail = "../../placeholder.png"
              iterator(i+1);
            });
          }
          else iterator(i+1);
        }
        else cb(null, result);
      })(0);
    }
  ],
  function (err, results) {
      if (err) {
          helpers.send_error(res, err);
      } else {
          helpers.send_success(res, { Success: results });
      }
  });
};

exports.ChangeAlbumDesc = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName || !req.body.description) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else gall_data.updateAlbum(req.session.login, req.session.userName, req.body.albumName, req.body.description, "description", cb);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.SetSortOrder = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName || !req.body.sortOrder) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else gall_data.updateAlbum(req.session.login, req.session.userName, req.body.albumName, req.body.sortOrder, "sortOrder", cb);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.SetThumbnail = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else gall_data.updateAlbum(req.session.login, req.session.userName, req.body.albumName, req.body.thumbnail, "thumbnail", cb);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.RenameAlbum = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName || !req.body.newName) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else if (!helpers.isValid(req.body.newName)) cb("Invalid name");
        else {
          fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.newName, function (err, stats) {
            if (!err && stats.isDirectory()) cb("Album name already exists");
            else cb(null);
          });
        }
      },
      function(cb) {
        gall_data.updateAlbum(req.session.login, req.session.userName, req.body.albumName, req.body.newName.trim(), "title", cb);
      },
      function(cb) {
        fs.rename(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName,
          require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.newName.trim(),cb);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.NewAlbum = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else if (!helpers.isValid(req.body.albumName)) cb("Invalid name");

        //create folder
        else {
          fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName, function (err, stats) {
            if (!err && stats.isDirectory()) cb("Album name already exists");
            else cb(null);
          });
        }
      },
      function(cb) {
        mkdirp(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName.trim(),function(err) { if (err) cb(err); else cb(null) });
      },
      function (cb) {
        if (req.body.description) gall_data.updateAlbum(req.session.login, req.session.userName, req.body.albumName.trim(), req.body.description, "description", cb);
        else cb(null);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};
exports.DeleteAlbum = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else rimraf(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName,function(err) { if (err) cb(err); else cb(null); });
      },
      function(cb) {
        gall_data.DeleteAlbum(req.session.login, req.body.albumName, cb);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.UpdateFile = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.filename || !req.body.albumName) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else if (req.body.newName && !helpers.isValid(req.body.newName)) cb("Invalid name");
        else if (req.body.newName && req.body.newName.trim() != req.body.filename){
          fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName + '\\' + req.body.newName, function (err, stats) {
            if (!err && stats.isFile()) cb("File name already exists");
            else cb(null);
          });
        }
        else cb(null);
      },
      function(cb) {
        gall_data.updateFile(req.session.login, req.session.userName, req.body.albumName, req.body.filename, req.body.description, req.body.newName, function(err, result) {
          if (err) cb(err);
          else cb(null);
        });
      },
      function(cb) {
        if (req.body.newName && req.body.newName.trim() != req.body.filename) {
          fs.rename(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName + '\\' + req.body.filename,
            require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName + '\\' + req.body.newName.trim(),cb);
        }
        else cb(null);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.DeletePic = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName || !req.body.filename) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else fs.unlink(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName + '\\' + req.body.filename,function(err) { if (err) cb(err); else cb(null); });
      },
      function(cb) {
        gall_data.DeletePic(req.session.login, req.body.albumName, req.body.filename, cb);
      }
  ],
  function (err, results) {
      if (err) helpers.send_error(res, err);
      else helpers.send_success(res, { Success: true });
  });
};

exports.Upload = function(req,res) {
  async.waterfall([
      function (cb) {
        if (!req.body || !req.body.albumName || !req.files['files']) cb("Missing info");
        else if (!req.session.login) cb("Please log in first");
        else {
          //check album folder exists
            fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName, function (err, stats) {
              if (!err && stats.isDirectory()) cb(null);
              else cb("Album does not exist");
          });
        }
      },
      function (cb) {
        var files = req.files['files'];
        (function iterator(i) {
          if (files[i]) {
            var newfn = files[i].originalname;
            (function inner(innerfn) {
              fs.stat(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName + '\\' + innerfn, function (err, stats) {
                if (!err && stats.isFile()) inner(helpers.addNum(innerfn));
                else {
                  fs.rename(require('path').resolve(__dirname) + '\\..\\temp\\' + files[i].originalname,
                    require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.session.userName + '\\' + req.body.albumName + '\\' + innerfn,function() { iterator(i+1); });
                }
              });
            })(files[i].originalname);
          }
          else cb(null);
        })(0);
      }
      //if there is an error, delete the temp files
  ],
  function (err, results) {
      if (err) {
        var files = req.files['files'];
        (function deleteAll(i) {
          if (files[i]) {
            fs.unlink(require('path').resolve(__dirname) + '\\..\\temp\\' + files[i].originalname,function() { deleteAll(i+1); });
          }
          else helpers.send_error(res, err);
        })(0);
      }
      else helpers.send_success(res, { Success: true });
  });
};

exports.Register = function(req,res) {
  async.waterfall([
      function (cb) {
        //make sure all the fields are submitted
          if (!req.body || !req.body.login || !req.body.password || !req.body.adminPassword) cb("Missing info");
          else if (req.body.adminPassword != "someFakeHardCodedPassword") cb("Require correct admin password to register");
          else if (!helpers.isValid(req.body.login)) cb("Invalid name");
          else {
            mkdirp(require('path').resolve(__dirname) + '\\..\\photos' + '\\' + req.body.login.trim(),function(err) { if (err) cb(err); else cb(null) });
        }
      },
      function (cb) {
          //validate info and login
          gall_data.Register(req.body.login,req.body.password, function(err, result) {
            if (err) cb(err);
            else cb(null);
          });
      }
  ],
  function (err, results) {
      if (err) {
          helpers.send_error(res, err);
      } else {
          helpers.send_success(res, { Success: true });
      }
  });
};
