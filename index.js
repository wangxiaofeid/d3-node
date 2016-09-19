var express = require('express');
var app = express();

var jsdom = require("./jsdom");

app.use(express.static('public'));

app.get('/', function (req, res) {

    jsdom(res);
   
})

var server = app.listen(3000, function () {
  console.log('访问：http://localhost:3000');
});
