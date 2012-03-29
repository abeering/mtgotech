
function init_hover_links(){
    $('.card_hover_link').each(function(card_hover_link){
        $(this).hover( function(){
            var new_image_path = $(this).attr('image');
            update_card_image( new_image_path );
        });
    });
}

function update_card_image( new_image_path ){
    $('#card_image').attr('src', new_image_path );
}

$(document).ready( function(){
    init_hover_links();
});
