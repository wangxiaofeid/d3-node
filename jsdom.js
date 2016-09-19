var Canvas = require('canvas');
var jsdom = require("jsdom");

var d3Calculate = require("./d3Calculate.js");

const fill = (function() {
    var colors = [
        '#83DCEC',
        '#A4BDAC',
        '#D58173',
        '#6493A8',
        '#F5BD5F',
        '#036776',
        '#A7D2C7',
        '#CBE474',
        '#DBDA63',
        '#AE9A93'
    ];
    return function(index) {
        return colors[index % colors.length];
    }
})();

var fun = function(res){
	d3Calculate(function(nodes, links){
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
                ctx.fillStyle = fill(d.category);
                // console.log(tt.setting.color(d.category));
                ctx.fill();
            }

            // ctx.beginPath();
            // links.forEach(drawLink);
            // ctx.strokeStyle = "#ccc";
            // ctx.stroke();

            // ctx.beginPath();
            // nodes.forEach(drawNode);
            
            // res.send('<img src="'+ canvas.toDataURL() +'" alt="" />' + JSON.stringify(nodes));
            console.log(nodes);
            res.send(JSON.stringify(nodes));
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
}

module.exports = fun