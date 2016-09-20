/**
 * Created by yaozhengfeng on 16/8/11.
 */
var d3 = require("d3");
var _ = require('lodash');
var fs = require('fs');

// 力导图
function Force(options) {
    return d3.layout.force()
        .nodes(options.nodes || [])
        .links(options.links || [])
        .size(options.size || [0,0])
        .linkDistance(options.linkDistance || 100)
        .charge(options.charge || -50)
        .on('start', function() {
            if (typeof options.start == 'function') {
                options.start();
            }
        })
        .on('tick', function(e) {
            if (typeof options.tick == 'function') {
                options.tick(e);
            }
        })
        .on('end', function() {
            if (typeof options.end == 'function') {
                options.end();
            }
        });
}

// 设置团伙中心
function cluster(alpha) {
    return function(o) {
        o.y += (o.center.y - o.y) * alpha;
        o.x += (o.center.x - o.x) * alpha;
    }
}

// 避免节点碰撞
function collipe(alpha, nodes, padding) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
        var rb = 2 * (d.degree || d.radius) + padding,
            nx1 = d.x - rb,
            nx2 = d.x + rb,
            ny1 = d.y - rb,
            ny2 = d.y + rb;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y);
                if (l < rb) {
                    l = (l - rb) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}

// 计算包围一组团伙的最小圆
function getMinCircle(d) {
    var maxRight = _.maxBy(d.values, 'x');
    var maxLeft = _.minBy(d.values, 'x');
    var maxTop = _.maxBy(d.values, 'y');
    var maxBottom = _.minBy(d.values, 'y');
    var center = [(maxLeft.x + maxRight.x) / 2, (maxTop.y + maxBottom.y) / 2];
    var radius = Math.sqrt(Math.pow(maxRight.x - maxLeft.x, 2) + Math.pow(maxTop.y - maxBottom.y, 2)) / 2;
    return {
        center: center,
        radius: radius
    }
}

function renderAssociations(data) {
    return new Promise(function(resolve) {
        var nodes = data.nodes;
        var links = _(data.edges).map(function(edge) {
            return {
                source: _(nodes).findIndex(function(node) {return node.nodeId == edge.srcId}),
                target: _(nodes).findIndex(function(node) {return node.nodeId == edge.targetId})
            };
        }).value();
        var subGroups = _(nodes).map(function(node) {return node.subGroupId}).uniq().value();
        var coreSelfNodes = data.coreSelfNode.split(';');
        // 只有一个子团伙无需分团
        if (subGroups.length == 1) {
            new Force({
                nodes: nodes,
                links: links,
                size: [900, 900],
                charge: -50,
                start: function() {
                   
                },
                tick: function(e) {
                    
                },
                end: function() {                  
                    resolve({
                        id: data.groupId,
                        nodes: nodes,
                        links: links,
                        coreSelfNodes: coreSelfNodes
                    });
                }
            }).start();
        } else {
            // 分团
            subGroups = _(subGroups).map(function(id) { return {id: id} })
                .forEach(function(group) {
                    group.radius = 0;
                    nodes.forEach(function(node) {
                        if (node.subGroupId == group.id) {
                            node.center = group;
                            group.radius++;
                        }
                    });
                    group.radius = Math.min(group.radius * 2 + 20, Math.max(nodes.length / subGroups.length, 90));
                });
            var npgId = data.groupId + '_node';
            var gpgId = data.groupId + '_group';
            var nodeForce = new Force({
                nodes: nodes,
                links: links,
                size: [900, 900],
                charge: -500,
                start: function() {     
                },
                tick: function(e) {
                    nodes.forEach(cluster(subGroups.length / 2 * e.alpha));
                    nodes.forEach(collipe(.5, nodes, (nodes.length > 1000 ? 1 : 10)));
                },
                end: function() {
                    resolve({
                        id: data.groupId,
                        nodes: nodes,
                        links: links,
                        coreSelfNodes: coreSelfNodes,
                        haveSubGroups: true
                    }); 
                }
            });
            // 团伙力导,实时计算团伙中心
            new Force({
                nodes: subGroups,
                size: [900, 900],
                charge: Math.min(Math.max(-900, -60 * subGroups.length), -nodes.length / subGroups.length),
                start: function() {
                    nodeForce.start();
                },
                tick: function(e) {
                    subGroups.forEach(collipe(.5, subGroups, 50));
                },
                end: function() {
                }
            }).start();
        }
    });
}

function fun(callback){
    var context = JSON.parse(fs.readFileSync('./public/test/test3.json'));
    var promises = [];

    for (i in context.features) {
        promises.push(renderAssociations(context.features[i]));
    }
    Promise.all(promises).then(function(values) {
        
        _.each(values, function(obj){
            var minX = _.minBy(obj.nodes, 'x').x - 100;
            var minY = _.minBy(obj.nodes, 'y').y - 100;
            var maxX = _.maxBy(obj.nodes, 'x').x - minX + 100;
            var maxY = _.maxBy(obj.nodes, 'y').y - minY + 100;
console.log(minX,minY,maxX,maxY);
            
            obj.width = maxX;
            obj.height = maxY;

            _.each(obj.nodes, function(node){
                node.x -= minX;
                node.y -= minY;
            });

            obj.groups = _(d3.nest().key(function(d) { return d.subGroupId; }).entries(obj.nodes))
                                .map(function(group) {
                                    var maxDNode = _.maxBy(group.values, 'degree');
                                    var circle = getMinCircle(group);
                                    group.center = circle.center;
                                    group.radius = circle.radius + Math.min(maxDNode.degree, 30) + 2;
                                    return group;
                                }).value();

            
        });
        callback(values);
    })
}

module.exports = fun;
