#!/usr/bin/perl -w
# analyze_concept.pl
#
# andy@exastris.org
# 03/28/12 15:39:24 PDT

use strict;
use warnings qw(all);
use diagnostics;

use version;
our $VERSION = qv('0.0.1');

use DBI;
use Data::Dumper;

my $dbh = DBI->connect( 'dbi:Pg:dbname=decklist', 'postgres', '', { AutoCommit => 1, RaiseError => 1 } );

my $unanalyzed_deck_res = $dbh->selectall_arrayref( "SELECT d.id, e.event_type_id FROM decks d JOIN events_players ep ON( d.id = ep.deck_id ) JOIN events e ON( e.id = ep.event_id ) WHERE d.archetype_id IS NULL ORDER BY e.date ASC", { Slice => {} } );

my $batchsize = scalar @{$unanalyzed_deck_res};

my $i=0;

foreach my $deck ( @{$unanalyzed_deck_res} ) {
    $i++;

    my $deck_id = $deck->{'id'};
    my $event_type_id = $deck->{'event_type_id'};

    print "[ $i / $batchsize ] Re-analyzing deck id $deck_id of event type id $event_type_id for archetypes..\n";

    # check for archetypes
    my $cards_res = $dbh->selectall_arrayref(
        "SELECT dc.*, c.name FROM decks_cards dc JOIN cards c ON( c.id = dc.card_id ) WHERE deck_id = ? AND c.type NOT LIKE '%Basic Land%' AND dc.type = 1",
        { Slice => {} },
        $deck_id
    );

    # get archetypes 
    my $archetypes_res = $dbh->selectall_arrayref( 
        "SELECT ac.* FROM archetypes_cards ac JOIN archetypes a ON( ac.archetype_id = a.id ) WHERE event_type_id = ?", { Slice => {} }, $event_type_id 
    ); 

    # a copy of archetypes_res for pushing archetype matches 
    my @matched_archetypes;

    for my $card ( @{$cards_res} ) {
    
        for my $archetype_card_index ( keys @{$archetypes_res} ){

            if( !defined( @{$archetypes_res}[ $archetype_card_index ] ) ){
                # card already removed from array
                next; 
            }

            if( $card->{'card_id'} == @{$archetypes_res}[ $archetype_card_index ]->{'card_id'} ){
                print "\t\tfound a card match $card->{'card_id'}\n";
                my $matched_card = splice( @{$archetypes_res}, $archetype_card_index, 1 );
                push @matched_archetypes, $matched_card->{'archetype_id'};

            }

        }

    }

    # count matched cards by archetype id 
    my %archetype_match_count;
    my %h;
    $h{$_}++ for @matched_archetypes; 
    my $archetype_id = (reverse sort keys %h)[0];

    # did we get all of the cards for this archetype
    for my $archetype_card ( @{$archetypes_res} ){
        if( $archetype_card->{'archetype_id'} == $archetype_id ){
            print "\t\tfound a missing archetype card - voiding archetype selection\n";
            $archetype_id = undef;
            last;
        }
    }

    if( defined $archetype_id ){
        print "\tdeck id '$deck_id' matches archetype id '$archetype_id'\n";
        my $update_archetype = $dbh->prepare( "UPDATE decks SET archetype_id = ? WHERE id = ?" );
        $update_archetype->execute( $archetype_id, $deck_id );
    }

}
