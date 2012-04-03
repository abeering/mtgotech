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

my $unanalyzed_deck_res = $dbh->selectall_arrayref( "SELECT d.id, e.event_type_id FROM decks d JOIN events_players ep ON( d.id = ep.deck_id ) JOIN events e ON( e.id = ep.event_id ) WHERE ( d.analyzed = 'f' OR d.analyzed IS NULL ) LIMIT 1000", { Slice => {} } );

foreach my $deck ( @{$unanalyzed_deck_res} ) {

    my $deck_id = $deck->{'id'};
    my $event_type_id = $deck->{'event_type_id'};

    print "Analyzing deck id $deck_id ..\n";

    my $cards_res = $dbh->selectall_arrayref(
        "SELECT dc.*, c.name FROM decks_cards dc JOIN cards c ON( c.id = dc.card_id ) WHERE deck_id = ? AND c.type NOT LIKE '%Land%' AND dc.type = 1",
        { Slice => {} },
        $deck_id
    );

    my $relation_ref = {};

    for my $card ( @{$cards_res} ) {

        my $card_id = $card->{'card_id'};

        if ( $relation_ref->{$card_id} ) {
            $relation_ref->{$card_id}->{'count'}++;
            next;
        }
        else {
            $relation_ref->{$card_id} = { 'count' => 1, relations => {} };
        }

        for my $other_card ( @{$cards_res} ) {
            my $other_card_id = $other_card->{'card_id'};

            if ( $card_id eq $other_card_id ) {
                next;
            }

            if ( $relation_ref->{$card_id}->{'relations'}->{$other_card_id} ) {
                $relation_ref->{$card_id}->{'relations'}->{$other_card_id}++;
            }
            else {
                $relation_ref->{$card_id}->{'relations'}->{$other_card_id} = 1;
            }

        }

    }

    foreach my $card_id ( keys %{$relation_ref} ) {

        # fill cards_usage statistics ( card_id, number in deck, count of times this has occured )

        my $count = $relation_ref->{$card_id}->{'count'};

        my $cards_usage_res = $dbh->selectrow_hashref( "SELECT * FROM cards_usage WHERE card_id = ? AND number = ? AND event_type_id = ?",
            {}, $card_id, $count, $event_type_id );

        if ($cards_usage_res) {
            my $update_cards_usage_sth
                = $dbh->prepare("UPDATE cards_usage SET seen = seen + 1 WHERE card_id = ? AND number = ? AND event_type_id = ?");
            $update_cards_usage_sth->execute( $card_id, $count, $event_type_id );
        }
        else {
            my $insert_cards_usage_sth
                = $dbh->prepare("INSERT INTO cards_usage ( card_id, number, seen, event_type_id ) VALUES ( ?, ?, 1, ? )");
            $insert_cards_usage_sth->execute( $card_id, $count, $event_type_id );
        }

        foreach my $other_card_id ( keys %{ $relation_ref->{$card_id}->{'relations'} } ) {
            my $cards_pair_usage_res
                = $dbh->selectrow_hashref(
                "SELECT * FROM cards_pair_usage WHERE first_card_id = ? AND second_card_id = ? AND event_type_id = ?",
                {}, $card_id, $other_card_id, $event_type_id );

            if ($cards_pair_usage_res) {
                my $update_cards_pair_usage_sth = $dbh->prepare(
                    "UPDATE cards_pair_usage SET seen = seen + 1 WHERE first_card_id = ? AND second_card_id = ? AND event_type_id = ?");
                $update_cards_pair_usage_sth->execute( $card_id, $other_card_id, $event_type_id );
            }
            else {
                my $insert_cards_pair_usage_sth = $dbh->prepare(
                    "INSERT INTO cards_pair_usage ( first_card_id, second_card_id, seen, event_type_id ) VALUES ( ?, ?, 1, ? )");
                $insert_cards_pair_usage_sth->execute( $card_id, $other_card_id, $event_type_id );
            }
        }

    }


    # check for archetypes


    my $update_deck_state = $dbh->prepare( "UPDATE decks SET analyzed = 't' WHERE id = ?" );
    $update_deck_state->execute( $deck_id );


}
