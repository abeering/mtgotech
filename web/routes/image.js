
/*
 *   IMAGE MAGIC ( ACTUAL MAGIC )
 */
exports.transform_archetype = function(req, res, next){
	req.plot_data = [ req.archetype_usage_plot_data ];
	req.plot_options = { 
		width: 450, height: 200,
		legend: { backgroundOpacity: .5, position: 'ne', show: true },
		xaxis: { mode: 'time', minTickSize: [ 1, "day"], labelWidth: 50, labelHeight: 20, show: true },
		yaxis: { min: 0, max: 100, show: true },
		grid: {	
			backgroundColor: 'white', 
			canvasText: { show: true, font: "sans 9px" }, 
			legend: { position: 'ne', backgroundColor: 'white', backgroundOpacity: 0.50 },
		},
	};

	next();
}

exports.transform_card = function(req, res, next){
	req.plot_data = [];
	for( key in req.daily_usage_stats ){
		if( key == 'Standard' || key == 'Modern' || key == 'Pauper' )
			req.plot_data.push( req.daily_usage_stats[key] );
	}
	req.plot_options = { 
		width: 450, height: 200,
		legend: { backgroundOpacity: .5, position: 'ne', show: true },
		xaxis: { mode: 'time', minTickSize: [ 1, "day"], labelWidth: 50, labelHeight: 20, show: true },
		yaxis: { min: 0, max: 100, show: true },
		grid: {	
			backgroundColor: 'white', 
			canvasText: { show: true, font: "sans 9px" }, 
			legend: { position: 'ne', backgroundColor: 'white', backgroundOpacity: 0.50 },
		},
	};
	next();
}
exports.image = function(req, res){

    require('jsdom').env({
        html: '<html><body></body></html>', // URL or markup required
        scripts: [
            // can't use jQuery 1.7+, atm, b/c of https://github.com/NV/CSSOM/issues/29
            'http://code.jquery.com/jquery-1.6.4.min.js',
            // Flot 0.7 patched to support node-canvas
            //'frontendjs/jquery.flot-on-node.js'
			'frontendjs/jquery.flot.js'
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
            var options = req.plot_options;
			// we can just use a stub jQuery object
            var $placeholder = $('div');
			$placeholder.css('width',450);
			$placeholder.css('height',200);
			$placeholder.css('font-size','13px');

            // Flot data format and options are unchanged
            var data = req.plot_data;

            // call Flot as usual
            var $plot = $.plot( $placeholder, data, options )

			var ctx = $plot.getCanvas().getContext("2d");
			ctx.fillStyle = '#000';
			ctx.font = 'bold 10px sans-serif';
			//ctx.textBaseline( 'bottom' );
			ctx.fillText( 'Generated @ mtgotech.com', 35, 25 );

            // get the node-canvas instance
            var nodeCanvas = $plot.getCanvas();

            // write the file
			res.writeHead(200, {'Content-Type': 'image/png', 'Transfer-Encoding': 'chunked'} );
            nodeCanvas.toBuffer(function (error, buffer) {
                if (error) throw error;
				res.end( buffer );
            });


        }


    });


};
