var express = require('express');
var app = express();
var Canvas = require('canvas');
var jsdom = require("jsdom");

var tt = require("./d3Calculate.js");

app.use(express.static('public'));

app.get('/foo', function (req, res) {

    tt.init(function(nodes, links){
        var html ='<html><body><canvas width="1000" height="800" style="width:1000px; height:800px;"></canvas></body></html>';
        var window = jsdom.jsdom(html).defaultView;
        var document = window.document;

        function start(error, window){

            var canvas = document.getElementsByTagName('canvas')[0];
            canvas.setAttribute('width', 1000);
            canvas.setAttribute('height', 800);
            var ctx = canvas.getContext('2d');

            function drawLink(d) {
                ctx.moveTo(d.source.x, d.source.y);
                ctx.lineTo(d.target.x, d.target.y);
            }

            function drawNode(d) {
                ctx.beginPath();
                ctx.moveTo(d.x + 3 + Math.sqrt(d.score), d.y);
                ctx.arc(d.x, d.y, 3 + Math.sqrt(d.score), 0, 2 * Math.PI);
                ctx.fillStyle = tt.setting.color(d.category);
                console.log(tt.setting.color(d.category));
                ctx.fill();
            }

            ctx.beginPath();
            links.forEach(drawLink);
            ctx.strokeStyle = "#ccc";
            ctx.stroke();

            ctx.beginPath();
            nodes.forEach(drawNode);
            
            res.send('<img src="'+ canvas.toDataURL() +'" alt="" />' + JSON.stringify(nodes));
            end()
            /*
            本地图片
            var svg = new Canvas.Image;
            svg.src = fs.readFileSync("./public/ggg.png");
            ctx.drawImage(svg,0,0);
            */ 

            function end(str){
                console.log('close');
                window.close();
            }

        }

        jsdom.env(html, start);
    });
   
})

var server = app.listen(3000, function () {
  console.log('访问：http://localhost:3000/foo');
});
