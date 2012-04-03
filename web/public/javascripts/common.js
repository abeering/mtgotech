
function init_hover_links(){
    $('.card_hover_link').each(function(){
        $(this).hover( function(){
            var new_image_path = $(this).attr('image');
            update_card_image( new_image_path );
        });
    });
}

function update_card_image( new_image_path ){
    $('#card_image').attr('src', new_image_path );
}

function init_graph_options(){

    $('.flot_option').each(function(){
        $(this).click( render_daily_stats );
    });

}

function render_daily_stats(){

    var filtered_data = [];

    $('.flot_option').each(function(){

        this.click_render_daily_stats

        if( $(this).attr('checked') ){

            var key = $(this).attr('name');
            
            if( key && data[key] ){
                filtered_data.push( data[key] );
            } else { 
                $(this).attr('disabled', true);
            }
            

        }

    });

    if( filtered_data.length > 0 ){

        $.plot( $('#usage_placeholder'), 
                filtered_data,  
                { 
                    legend: { backgroundOpacity: .5, position: 'nw' },
                    xaxis: { mode: 'time', minTickSize: [ 1, "day"], },
                    yaxis: { min: 0, max: 100 },
                }
        ); 

    } else { 
    }

}

$(document).ready( function(){

    init_hover_links();

});
