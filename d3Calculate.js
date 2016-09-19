var d3 = require('d3');
var _ = require('lodash');
var fs = require('fs');

var tt = {
    setting:{
        width: 1000,
        height: 800,
        color: (function(){
            var arr = [d3.scale.category20(),d3.scale.category20b(),d3.scale.category20c(),d3.scale.category20(),d3.scale.category20b(),d3.scale.category20c()];
            return function(key){
                var num = parseInt(key);
                // console.log(num,arr[Math.floor(num/20)](num%20));
                return arr[Math.floor(num/20)](num%20);
            }
        })(),
        zoomRange:[0.2, 4],
        zoomScale:[0.9,1.1]
    },
    init: function(callback){
        var self = this;

        self.callback = callback;
        
        var graph = JSON.parse(fs.readFileSync('./public/test/test1.json'));

            self.nodes = graph.nodes;
            self.links = [];
            self.outNodesJson = {};
            self.outNodes = [];
            self.outLinks = [];
            _.each(_.groupBy(self.nodes, function(node){return node.category}),function(obj,key){
                var tobj = {
                    nodeNum:obj.length,
                    category:key
                }
                self.outNodesJson[key] = tobj;
                self.outNodes.push(tobj);
            })
            self.linkMap = {};
            _.each(graph.edges,function(obj){
                var source = self.nodes.find(function(n){ return n.name == obj.source});
                var target = self.nodes.find(function(n){ return n.name == obj.target});
                if(source&&target){
                    if(self.linkMap[source.category + "_" + target.category]){
                        self.linkMap[source.category + "_" + target.category]++
                    }else if(self.linkMap[target.category + "_" + source.category]){
                        self.linkMap[target.category + "_" + source.category]++
                    }else{
                        self.linkMap[source.category + "_" + target.category] = 1;
                    }
                }
                self.links.push({
                    source: source,
                    target: target
                });
            });

            self.groups = d3.nest().key(function(d) { return d.category; }).entries(self.nodes);

            self.initOutForce();

            self.initForce();
            self.refresh();
        
    },
    initOutForce: function(){
        var self = this;
        // var svg = d3.select("body").append("svg")
        //     .attr("width", self.setting.width)
        //     .attr("height", self.setting.height);

        // var svgg = svg.append("svg:g").attr('class','outg');
        // var svgline = svgg.append("svg:g").attr('class','lines');
        // var svgnode = svgg.append("svg:g").attr('class','nodes');

        // self.svggTest = svgg;

        var outLinks = [];
        var maxLink = 0, minLink = 10000;
        _.each(self.linkMap,function(obj,key){
            var key = key.split('_');
            outLinks.push({
                source: self.outNodesJson[key[0]],
                target: self.outNodesJson[key[1]],
                linkNum:obj
            })
            obj > maxLink&&(maxLink = obj);
            obj < minLink&&(minLink = obj);
        });
        var linkStrength = d3.scale.linear().domain([minLink,maxLink]).range([0,1]);

        var force = d3.layout.force()
            .nodes(self.outNodes)
            .links(outLinks)
            .linkStrength(function(d){
                // console.log(d.linkNum,":",linkStrength(d.linkNum));
                return linkStrength(d.linkNum)
            })
            // .linkDistance(function(d){
            //     return 300
            // })
            .charge(-1200)
            .size([self.setting.width, self.setting.height])
            .start();

        // //添加连线
        // var svg_edges = svgline.selectAll("line")
        //                 .data(outLinks);
        // svg_edges.exit().remove();
        // svg_edges.enter()
        //         .append("line")
        //         .attr('class','outline')
        //         .style('stroke-width',function(d){ return d.linkNum});
        // //添加节点
        // var svg_nodes = svgnode.selectAll(".node")
        //                         .data(self.outNodes);
        // svg_nodes.exit().remove();
        // var nodeEnter = svg_nodes.enter()
        //     .append('g')
        //     .attr('class', 'outnode')
        //     .attr('transform', function(d) {
        //         return 'translate(' + (d.x||self.setting.width/2) + ',' + (d.y||self.setting.height/2) + ')';
        //     })
        //     .each(function(d){
        //         var _this = d3.select(this);
        //         _this.append('circle')
        //                 .attr("r", 10 + d.nodeNum)
        //                 .style("fill", function(d) { return self.setting.color(d.category)});
        //     });

        // force.on("tick", function(e){    //对于每一个时间间隔
        //     //更新连线坐标
        //     svg_edges.attr("x1",function(d){ return d.source.x; })
        //             .attr("y1",function(d){ return d.source.y; })
        //             .attr("x2",function(d){ return d.target.x; })
        //             .attr("y2",function(d){ return d.target.y; });
        //      //更新节点坐标
        //     svg_nodes.attr('transform',function(d){ return 'translate(' + d.x + ',' + d.y + ')'});
        // });

    },
    initForce: function(){
        var self = this;
        // 力导图
        self.force = d3.layout.force()
            .nodes(self.nodes)
            .links(self.links)
            .charge(-240)
            .linkDistance(40)
            .size([self.setting.width, self.setting.height]);
        // // 拖动事件
        // self.force.drag()
        //     .on("dragstart",function(d,i){
        //         d3.event.sourceEvent.stopPropagation();
        //     })
        //     .on("drag", function(d) {  
        //     })
        //     .on("dragend",function(d){
        //     });
        // // 缩放
        // self.zoomObj = d3.behavior.zoom()
        //                 .scaleExtent(self.setting.zoomRange)
        //                 .on("zoom", function(){
        //                     self.svgg.attr("transform",
        //                         "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        //                     self.svggTest.attr("transform",
        //                         "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        //                 })
        //                 .on('zoomend', function(){
        //                 });

        // self.svg = d3.select("body").append("svg")
        //     .attr("width", self.setting.width)
        //     .attr("height", self.setting.height)
        //     .call(self.zoomObj);

        // self.svgg = self.svg.append("svg:g").attr('class','outg');
        // self.svghull = self.svgg.append("svg:g").attr('class','hull');
        // self.svgline = self.svgg.append("svg:g").attr('class','lines');
        // self.svgnode = self.svgg.append("svg:g").attr('class','nodes');
    },
    refresh: function(){
        var self = this;
        // //添加连线
        // var svg_edges = self.svgline.selectAll("line")
        //                 .data(self.links);
        // svg_edges.exit().remove();
        // svg_edges.enter()
        //         .append("line");

        // //添加节点
        // var svg_nodes = self.svgnode.selectAll(".node")
        //                         .data(self.nodes);
        // svg_nodes.exit().remove();

        // var nodeEnter = svg_nodes.enter()
        //     .append('g')
        //     .attr('class', 'node')
        //     .attr('transform', function(d) {
        //         return 'translate(' + (d.x||self.setting.width/2) + ',' + (d.y||self.setting.height/2) + ')';
        //     })
        //     .call(self.force.drag)
        //     .each(function(d){
        //         var _this = d3.select(this);
        //         _this.append('circle')
        //                 .attr("r", function(d){ d.radius = 3 + Math.sqrt(d.score); return d.radius })
        //                 .style("fill", function(d) { return self.setting.color(d.category); });
        //     });

        self.force.on("tick", function(e){    //对于每一个时间间隔
            var k = 3 * e.alpha;
            self.nodes.forEach(function(o, i) {
                o.y += (self.outNodesJson[o.category].y - o.y) * k;
                o.x += (self.outNodesJson[o.category].x - o.x) * k;
                // o.y = self.outNodesJson[o.group].y;
                // o.x = self.outNodesJson[o.group].x;
                o.radius = 3 + Math.sqrt(o.score)
            });
            // console.log(e.alpha);
            function collide(node) {

              var r = node.radius + 16,
                  nx1 = node.x - r,
                  nx2 = node.x + r,
                  ny1 = node.y - r,
                  ny2 = node.y + r;
              return function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                  var x = node.x - quad.point.x,
                      y = node.y - quad.point.y,
                      l = Math.sqrt(x * x + y * y),
                      r = node.radius + quad.point.radius + 5;
                  if (l < r) {
                    l = (l - r) / l * .5;
                    node.x -= x *= l;
                    node.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                  }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
              };
            }
            // console.log('event', e.alpha);
            if(e.alpha < 0.05){
                var q = d3.geom.quadtree(self.nodes),
                    i = 0,
                    n = self.nodes.length;

                while (++i < n) q.visit(collide(self.nodes[i]));
                if(e.alpha < 0.008){
                    self.callback(self.nodes,self.links);
                    self.force.stop();
                }
            }

            //  //更新连线坐标
            // svg_edges.attr("x1",function(d){ return d.source.x; })
            //         .attr("y1",function(d){ return d.source.y; })
            //         .attr("x2",function(d){ return d.target.x; })
            //         .attr("y2",function(d){ return d.target.y; });

            //  //更新节点坐标
            // svg_nodes.attr('transform',function(d){ return 'translate(' + d.x + ',' + d.y + ')'});

            // // 凸包
            // var groupPath = function(d) {
            //     return "M" + 
            //       d3.geom.hull(d.values.map(function(i) { return [i.x, i.y]; }))
            //         .join("L")
            //     + "Z";
            // };
            // self.svghull.selectAll("path")
            //             .data(self.groups)
            //             .attr("d", groupPath)
            //             .enter().append("path")
            //             .style("fill", function(d, i) {return self.setting.color(d.key); })
            //             .style("stroke", function(d, i) { return self.setting.color(d.key); })
            //             .style("stroke-width", 40)
            //             .style("stroke-linejoin", "round")
            //             .style("opacity", .2)
            //             .attr("d", groupPath);
        });
        
        

        self.force.start();
        return self;
    }
}

module.exports = tt;