
/*
 *   IMAGE MAGIC ( ACTUAL MAGIC )
 */
function createRandomData()
{
    for (var i = 10, data = []; --i;)
        data.push([i, parseInt(Math.random() * 30)]);

    return data;
}

exports.image_test = function(req, res){

    require('canvas');

    require('jsdom').env({
        html: '<html><body></body></html>', // URL or markup required
        scripts: [
            // can't use jQuery 1.7+, atm, b/c of https://github.com/NV/CSSOM/issues/29
            'http://code.jquery.com/jquery-1.6.4.min.js',
            // Flot 0.7 patched to support node-canvas
            'jquery.flot-on-node.js'
        ],
        done: function (errors, window)
        {
            if (errors) { 
                console.log( errors );
            }

            // no `window` in node
            var $ = window.$, jQuery = window.jQuery;

            // differences from typical flot usage
            // jQuery (loaded via jsdom) can't determine element dimensions, so:
            // width and height options are required
            var options = { width: 600, height: 300 };
            // we can just use a stub jQuery object
            var $placeholder = $('div');

            // Flot data format and options are unchanged
            var data = [{
                data: createRandomData(),
                lines: {show: true, fill: true}
            }, {
                data: createRandomData(),
                lines: {show: false},
                bars: {show: true}
            }, {
                data: createRandomData(),
                lines: {show: true},
                points: {show: true}
            }];

            console.log( 'attempting to plot' );

            // call Flot as usual
            var $plot = $.plot($placeholder, data, options)

            // get the node-canvas instance
            var nodeCanvas = $plot.getCanvas();

            // write the file
            var fs = require('fs');
            nodeCanvas.toBuffer(function (error, buffer) {
                if (error) throw error;
                    fs.writeFile(__dirname + '/flot.png', buffer);
            });

            res.send( 'ok!' );
        }


    });


};
