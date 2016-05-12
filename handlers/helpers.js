exports.error = function (code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
};
//really bad errors, database problems
exports.invalid_resource = function () {
    return exports.error("invalid_resource",
                         "The requested resource does not exist.");
};
//successful
exports.send_success = function(res, data) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(data));
}
//used for regular errors
exports.send_error = function(res, data) {
    res.writeHead(200, {"Content-Type": "application/json"});
    var output = { Error: data };
    res.end(JSON.stringify(output));
}

exports.isValid= (function(){
  var rg1=/^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
  var rg2=/^\./; // cannot start with dot (.)
  var rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
  var rg4=/\.$/; // cannot end with dot (.)
  return function isValid(fname){
    return rg1.test(fname)&&!rg2.test(fname)&&!rg3.test(fname)&&!rg4.test(fname);
  }
})();

exports.addNum = function(fn) {
  var exten = fn.lastIndexOf(".");
  if (exten == -1) exten = fn.length;
  if (fn.charAt(exten - 1) == ')') {
  	var opening = fn.substr(0,exten).lastIndexOf("(");
  	if (opening && fn.charAt(opening -1) == " ") {
  		var inbrackets = fn.substring(opening + 1,exten - 1);
  		if (parseInt(inbrackets,10) == inbrackets) {
    		var newnum = parseInt(inbrackets,10) + 1;
    		return fn.substr(0,opening+1) + newnum + fn.substr(exten-1,fn.length);
  	 }
  }
  }
  return fn.substr(0,exten) + ' (2)' + fn.substr(exten,fn.length);
}
