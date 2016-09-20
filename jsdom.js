var Canvas = require('canvas');
var jsdom = require("jsdom");
var _ = require('lodash');

var d3Calculate = require("./d3Calculate.js");

/**
 * find方法
 */
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

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
var attrList = {
				"accountEmail": "邮箱",
                "accountMobile": "手机号码",
                "ipAddress": "IP地址",
                "qqNumber": "QQ",
                "idNumber": "身份证号",
                "deviceId": "设备ID",
                "cardNumber": "银行卡号"
            }

var fun = function(res){
	d3Calculate(function(imageDatas){
        var html ='<html><body><canvas width="900" height="900" style="width:900px; height:900px;"></canvas></body></html>';
        var window = jsdom.jsdom(html).defaultView;
        var document = window.document;

        function start(error, window){
        	var imgArr = [];
            var canvas = document.getElementsByTagName('canvas')[0];
            var ctx = null;
            _.each(imageDatas,function(imageData){
            	canvas.setAttribute('width', imageData.width);
	            canvas.setAttribute('height', imageData.height);
	            ctx = canvas.getContext('2d');
	            ctx.clearRect(0, 0, 100000, 100000);

		        ctx.beginPath();
		        ctx.lineWidth = 1;
	            imageData.links.forEach(function(d){
	            	ctx.strokeStyle = "#ccc";
	                ctx.moveTo(d.source.x, d.source.y);
	                ctx.lineTo(d.target.x, d.target.y);
	            });
	            ctx.stroke();

	            imageData.nodes.forEach(function(d){
	            	var radius = Math.min(d.degree, 30);
            		radius = radius < 15 ? radius : (radius - 4);
	                var color = fill(d.subGroupId?d.subGroupId.split('_')[1]:0);
	                ctx.beginPath();
	                ctx.moveTo(d.x + radius, d.y);
	                ctx.arc(d.x, d.y, radius, 0, 2 * Math.PI);
	                ctx.fillStyle = color;
	                ctx.fill();
	                if (radius >= 15) {
	                	ctx.beginPath();
	                	ctx.strokeStyle = color;
                        ctx.arc(d.x, d.y, radius + 4, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
	                if (d.isSelfNode && imageData.coreSelfNodes.find(function(item) {return item == d.name})) {
                        ctx.fillStyle = '#000';
                        ctx.textAlign="center";
                        ctx.fillText(attrList[d.type] + ":" + d.name, d.x, d.y + 5);
                    }
	            });

	            if(imageData.haveSubGroups){
		            imageData.groups.forEach(function(d){
		            	
		            	ctx.moveTo(d.center[0] + d.radius, d.center[1]);
		                ctx.strokeStyle = fill(d.key.split('_')[1]);
		                for (var i = 0; i < 180; i++) {
		                	ctx.beginPath();
		                	ctx.arc(d.center[0], d.center[1], d.radius, i*2/360*2 * Math.PI, (i*2+1)/360*2 * Math.PI);
		                	ctx.stroke();
		                }
		            })
		        }

	            imgArr.push({
	            	id: imageData.id,
	            	image: canvas.toDataURL(),
	            	width: imageData.width,
	            	height: imageData.height
	            });
            })
            

            // ctx.beginPath();
            // links.forEach(drawLink);
            // ctx.strokeStyle = "#ccc";
            // ctx.stroke();

            // ctx.beginPath();
            // nodes.forEach(drawNode);
            
            var str = "";
            _.each(imgArr, function(img){
            	str += '<img style="border:1px solid red" src="'+ img.image +'" alt="" />';
            });

            res.send(str + JSON.stringify(imageDatas));
            // console.log(nodes);
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