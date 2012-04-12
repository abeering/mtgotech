#!/usr/bin/perl -w
# load_arch.pl
#
# andy@exastris.org
# 04/12/12 10:19:51 PDT

use strict;
use warnings qw(all);
use diagnostics;

use version;
our $VERSION = qv('0.0.1');

use DBI;
use Data::Dumper;

my $dbh = DBI->connect( 'dbi:Pg:dbname=decklist', 'postgres', '', { AutoCommit => 1, RaiseError => 1 } );

open( my $fh, 'archetypes.tsv' );

while (<$fh>) {
    chomp;
    my ( $event_type, $name, $cards ) = split("\t");

    my $event_type_res = $dbh->selectrow_hashref( "SELECT * FROM event_types WHERE name = ?", {}, $event_type );

    my $event_type_id = $event_type_res->{'id'};

    my $insert_archetype_sth
        = $dbh->prepare("INSERT INTO archetypes ( name, event_type_id ) VALUES ( ?, ? ) RETURNING id");
    $insert_archetype_sth->execute( $name, $event_type_id );
    my $archetype_id = $insert_archetype_sth->fetch()->[0];
    print "created archetype $name with id $archetype_id ..\n";

    foreach my $card_name ( split( ",", $cards ) ) {
        my $card_res
            = $dbh->selectrow_hashref( "SELECT * FROM cards WHERE name = ? AND parent_id IS NULL", {}, $card_name );

        if ($card_res) {
            print "inserting card $card_res->{'name'} into archetype id $archetype_id ..\n";
            my $insert_archetype_card_sth
                = $dbh->prepare("INSERT INTO archetypes_cards ( archetype_id, card_id ) VALUES ( ?, ? )");
            $insert_archetype_card_sth->execute( $archetype_id, $card_res->{'id'} );
        }

    }

}
