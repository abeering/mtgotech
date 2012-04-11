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
use DBI;
use JSON;

use Data::Dumper;

my $dbh = DBI->connect( 'dbi:Pg:dbname=decklist', 'postgres', '', { AutoCommit => 1, RaiseError => 1 } );

# get last event id scraped
my $last_event_id = 0;
my @event_ids;
my $last_event_res = $dbh->selectrow_hashref('SELECT * FROM events ORDER BY seen DESC LIMIT 1');
if ($last_event_res) {
    $last_event_id = $last_event_res->{'mtgo_id'};
}

my $event_listing_url = 'http://www.wizards.com/handlers/XMLListService.ashx?dir=mtgo&type=XMLFileInfo&start=25';
my $listing_markup    = get($event_listing_url);
my $listing_ref       = decode_json $listing_markup;

foreach my $listing ( @{$listing_ref} ) {
    push @event_ids, $listing->{'Hyperlink'} if ( $listing->{'Hyperlink'} > $last_event_id );
}

foreach my $event_id (@event_ids) {

    my $url = 'http://www.wizards.com/Magic/Digital/MagicOnlineTourn.aspx?x=mtg/digital/magiconline/tourn/' . $event_id;
    print "grabbing tournament $url\n";

    my $html      = get($url);
    my $html_tree = HTML::Tree->new();
    $html_tree->parse($html);

    my @decklist_rows = $html_tree->look_down( '_tag', 'div', 'class', 'deck' );

    for my $decklist_html (@decklist_rows) {

        my $land      = '';
        my $creatures = '';
        my $other     = '';
        my $sideboard = '';
        my @cards     = ();

        my $heading       = $decklist_html->look_down( '_tag', 'div', 'class', 'main' )->as_text;
        my $event_details = $decklist_html->look_down( '_tag', 'div', 'class', 'sub' )->as_text;

        my $username = my $wins = my $losses = my $rank = undef;
        if ( $heading =~ m/^\s{0,1}(.+)\s\(([0-9]+)\-([0-9]+)\)\s*/ ) {
            $username = $1;
            $wins     = $2;
            $losses   = $3;
        }
        elsif ( $heading =~ m/^\s{0,1}(.+)\s\((\d+)(nd|th|st|rd) Place\)\s*/ ) {
            $username = $1;
            $rank     = $2;
        }
        else {
            print Dumper($heading);
            die;
        }

        $event_details =~ m/([[:print:]]+) #(\d+) on ([0-9\/]+)$/;
        my $event_type = $1;
        my $event_num  = $2;
        my $date       = $3;


        # gonna figure out a more generic type for this event
        my $basic_event_type = undef;
        if( $event_type =~ m/Standard/ ){
            $basic_event_type = 1;
        } elsif(  $event_type =~ m/Legacy/ ){
            $basic_event_type = 2;
        } elsif( $event_type =~ m/Modern/ ){
            $basic_event_type = 3;
        } elsif( $event_type =~ m/Pauper/ ){
            $basic_event_type = 4;
        } elsif( $event_type =~ m/Block Constructed/ ){
            $basic_event_type = 5;
        }

        print "adding $event_type [ $basic_event_type ] number $event_num from $date - player $username\n";

        my $deck_text = $decklist_html->look_down( '_tag', 'table', 'class', 'cardgroup' )->as_text;
        $deck_text =~ s/\x{a0}//g;

        $deck_text
            =~ m/^Main Deck\d+ cards\s+([[:print:]]+) lands([[:print:]]+) creatures([[:print:]]+) other spells\s*Sideboard\s*([[:print:]]+) sideboard cards\s+$/;
        $land      = $1;
        $creatures = $2;
        $other     = $3;
        $sideboard = $4;

        $land      =~ s/\d+$//g;
        $creatures =~ s/\d+$//g;
        $other     =~ s/\d+$//g;
        $sideboard =~ s/\d+$//g;

        my @creature_array  = $creatures =~ m/(\d+ [^0-9]+)/g;
        my @land_array      = $land      =~ m/(\d+ [^0-9]+)/g;
        my @other_array     = $other     =~ m/(\d+ [^0-9]+)/g;
        my @sideboard_array = $sideboard =~ m/(\d+ [^0-9]+)/g;

        # check for player
        my $player_id;
        my $player_res = $dbh->selectrow_hashref( 'SELECT * FROM players WHERE name = ?', {}, $username );
        if ($player_res) {
            $player_id = $player_res->{'id'};
        }
        else {
            my $players_sth = $dbh->prepare("INSERT INTO players ( name ) VALUES ( ? ) RETURNING id");
            $players_sth->execute($username);
            $player_id = $players_sth->fetch()->[0];
        }

        # check for event
        my $event_id;
        my $event_res = $dbh->selectrow_hashref( 'SELECT * FROM events WHERE mtgo_id = ?', {}, $event_num );
        if ($event_res) {
            $event_id = $event_res->{'id'};
        }
        else {
            my $events_sth
                = $dbh->prepare("INSERT INTO events ( name, mtgo_id, date, event_type_id ) VALUES ( ?, ?, ?, ? ) RETURNING id");
            $events_sth->execute( $event_type, $event_num, $date, $basic_event_type );
            $event_id = $events_sth->fetch()->[0];
        }

        # create deck + event_player record
        my $deck_id;
        my $decks_sth = $dbh->prepare("INSERT INTO decks ( name, type, player_id, analyzed ) VALUES ( ?, ?, ?, 'f' ) RETURNING id");
        $decks_sth->execute( undef, undef, $player_id );
        $deck_id = $decks_sth->fetch()->[0];
        my $events_players_sth
            = $dbh->prepare(
            "INSERT INTO events_players ( player_id, event_id, wins, losses, rank, deck_id ) VALUES ( ?, ?, ?, ?, ?, ? )"
            );
        $events_players_sth->execute( $player_id, $event_id, $wins, $losses, $rank, $deck_id );

        for my $num_cards ( @land_array, @creature_array, @other_array ) {
            $num_cards =~ m/^(\d+) ([^0-9]+)$/;

            my $card_name = $2;
            my $num       = $1;

            my $res = $dbh->selectrow_hashref( 'SELECT id, name FROM cards WHERE name = ? AND parent_id IS NULL', {}, $card_name );
            if ( !$res ) {
                $res = $dbh->selectrow_hashref( 'SELECT id, name FROM cards_alternate_names WHERE name = ?',
                    {}, $card_name );
            }
            if ( !$res ) {
                print "\n\n!!! FAILED TO LOAD CARD '$card_name' !!!\n\n";
                print "enter id to add to alternate_names: ";
                while (<STDIN>) {
                    my $new_card_id = $_;
                    chomp $new_card_id;
                    my $alternate_name_sth
                        = $dbh->prepare(
                        "INSERT INTO cards_alternate_names ( id, name, original_name ) VALUES ( ?, ?, ( SELECT name FROM cards WHERE id = ? ) )"
                        );
                    $alternate_name_sth->execute( $new_card_id, $card_name, $new_card_id );
                    last;
                }

                $res = $dbh->selectrow_hashref( 'SELECT id, name FROM cards_alternate_names WHERE name = ?',
                    {}, $card_name );
            }
            if ( !$res ) {
                die 1;
            }

            my $card_id = $res->{'id'};

            my $decks_cards_sth
                = $dbh->prepare("INSERT INTO decks_cards ( deck_id, card_id, type ) VALUES ( ?, ?, ? )");

            #print "inserting $num $card_name ( $card_id ) into deck id $deck_id - main deck\n";
            for ( 1 .. $num ) {
                $decks_cards_sth->execute( $deck_id, $card_id, 1 );
            }

        }

        for my $num_cards (@sideboard_array) {
            $num_cards =~ m/^(\d+) ([^0-9]+)$/;

            my $card_name = $2;
            my $num       = $1;

            my $res = $dbh->selectrow_hashref( 'SELECT id, name FROM cards WHERE name = ? AND parent_id IS NULL', {}, $card_name );
            if ( !$res ) {
                $res = $dbh->selectrow_hashref( 'SELECT id, name FROM cards_alternate_names WHERE name = ?',
                    {}, $card_name );
            }
            if ( !$res ) {
                print "\n\n!!! FAILED TO LOAD CARD '$card_name' !!!\n\n";
                print "enter id to add to alternate_names: ";
                while (<STDIN>) {
                    my $new_card_id = chomp($_);
                    my $alternate_name_sth
                        = $dbh->prepare(
                        "INSERT INTO cards_alternate_names ( id, name, original_name ) VALUES ( ?, ?, ( SELECT name FROM cards WHERE id = ? ) )"
                        );
                    $alternate_name_sth->execute( $new_card_id, $card_name, $new_card_id );
                    last;
                }

                $res = $dbh->selectrow_hashref( 'SELECT id, name FROM cards_alternate_names WHERE name = ?',
                    {}, $card_name );
            }
            if ( !$res ) {
                die 1;
            }

            my $card_id = $res->{'id'};

            my $decks_cards_sth
                = $dbh->prepare("INSERT INTO decks_cards ( deck_id, card_id, type ) VALUES ( ?, ?, ? )");

            #print "inserting $num $card_name ( $card_id ) into deck id $deck_id - sideboard\n";
            for ( 1 .. $num ) {
                $decks_cards_sth->execute( $deck_id, $card_id, 2 );
            }
        }

    }

}
