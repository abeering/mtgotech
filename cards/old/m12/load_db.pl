#!/usr/bin/perl -w
# load_db.pl
#
# andy@exastris.org
# 03/05/12 22:44:00 PST

use strict;
use warnings qw(all);
use diagnostics;

use version;
our $VERSION = qv('0.0.1');

use Data::Dumper;
use DBI;

open( my $fh, '<', 'cardlist.txt' );
my $dbh = DBI->connect('dbi:Pg:dbname=decklist', 'postgres', '', {AutoCommit=>1,RaiseError=>1} );

my $sth = $dbh->prepare( "INSERT INTO card ( series, series_number, name, card_type, mana, rarity, artist, image_name ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )" );

while (<$fh>) {

    chomp( $_ );
    my @attributes = split( /,/, $_ );

    my $card_num = $attributes[0];
    my $card_name = $attributes[1];
    my $card_type = $attributes[2];
    my $mana = $attributes[3];
    my $rarity = $attributes[4];
    my $artist = $attributes[5];
    my $series = $attributes[6];
    my $image_name = $attributes[8];

    print "loading $card_name ..\n";
    $sth->execute( $series, $card_num, $card_name, $card_type, $mana, $rarity, $artist, $image_name );
    
}

