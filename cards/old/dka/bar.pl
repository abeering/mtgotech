#!/usr/bin/perl -w
# bar.pl
#
# andy@exastris.org
# 03/05/12 15:56:44 PST

use strict;
use warnings qw(all);
use diagnostics;

use version;
our $VERSION = qv('0.0.1');

use HTML::Tree;
use LWP::Simple qw/get/;

use Data::Dumper;

my $EXPANSION = "dka";

open( CARDLIST, '>>cardlist.txt' );


my $url  = "http://magiccards.info/" . $EXPANSION . "/en.html";
my $html = get($url);
my $html_tree = HTML::Tree->new();
$html_tree->parse($html);

# looking down the tree here to cardDetails ( a table that has everything we're interested in )
# cellpadding="3" cellspacing="0" width="100%"
my $html_card_table = $html_tree->look_down( '_tag', 'table', 'cellpadding', 3, 'cellspacing', 0, 'width', '100%' );

my @html_card_rows = $html_card_table->look_down( '_tag', 'tr' );

my $html_header_row = shift @html_card_rows;

for my $html_card ( @html_card_rows ) {

    my @html_attributes = $html_card->look_down( '_tag', 'td' );
    my @attributes;

    for my $html_attribute ( @html_attributes ) {
        my $text_attribute = $html_attribute->as_text;
        $text_attribute =~ s/^\s*\b(.*)\b\s*/$1/;
        push @attributes, $text_attribute;

    }

    my $image_url = "http://magiccards.info/scans/en/" . $EXPANSION . "/" . $attributes[0] . ".jpg";
    my $image_filename = $EXPANSION . "_" . $attributes[0] . ".jpg";
    push @attributes, $image_url;
    push @attributes, $image_filename;

    print "retreiving " . $attributes[0] . " --- " . $attributes[1] . "...\n";
    LWP::Simple::getstore( $image_url, $image_filename );
    print CARDLIST join(',', @attributes) . "\n";

    sleep 15;


}

close( CARDLIST );


