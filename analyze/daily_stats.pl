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

# for cleaning overall stats
my $clear_overall_stats = $dbh->prepare( "DELETE FROM stats_cards_overall WHERE event_type_id = ?" );
# for cleaning weekly stats
my $clear_weekly_stats = $dbh->prepare( "DELETE FROM stats_cards_weekly WHERE event_type_id = ?" );

# update highest used cards overall
my $event_types_res = $dbh->selectall_arrayref( "SELECT * FROM event_types", { Slice => {} } );

foreach my $event_type ( @{$event_types_res} ) {

    # all grouped by event_type_id
    my $event_type_id = $event_type->{'id'};

    print "updating overall stats for event_type_id '$event_type_id'....";

    # purge yesterday's daily summary 
    $clear_overall_stats->execute( $event_type_id );

    my $insert_query = qq/
INSERT INTO stats_cards_overall ( event_type_id, card_id, num ) 
SELECT ?, dc.card_id, COUNT(*) 
FROM decks_cards dc 
JOIN cards c ON( c.id = dc.card_id ) 
JOIN events_players ep ON( dc.deck_id = ep.deck_id ) 
JOIN events e ON( e.id = ep.event_id ) 
WHERE e.event_type_id = ? AND NOT c.ignore 
AND dc.type = 1
GROUP BY dc.card_id, c.name 
ORDER BY COUNT(*) desc limit 25;
/;

    my $insert_sth = $dbh->prepare( $insert_query );
    $insert_sth->execute( $event_type_id, $event_type_id );

    print "DONE\n";

}

# update highest used cards last week
my $event_types_res = $dbh->selectall_arrayref( "SELECT * FROM event_types", { Slice => {} } );

foreach my $event_type ( @{$event_types_res} ) {

    # all grouped by event_type_id
    my $event_type_id = $event_type->{'id'};

    print "updating weekly stats for event_type_id '$event_type_id'....";

    # purge yesterday's daily summary 
    $clear_weekly_stats->execute( $event_type_id );

    my $insert_query = qq/
INSERT INTO stats_cards_weekly ( event_type_id, card_id, num ) 
SELECT ?, dc.card_id, COUNT(*) 
FROM decks_cards dc 
JOIN cards c ON( c.id = dc.card_id ) 
JOIN events_players ep ON( dc.deck_id = ep.deck_id ) 
JOIN events e ON( e.id = ep.event_id ) 
WHERE e.event_type_id = ? AND NOT c.ignore 
AND e.date > NOW() - interval '7 days'
AND dc.type = 1
GROUP BY dc.card_id, c.name 
ORDER BY COUNT(*) desc limit 25;
/;

    my $insert_sth = $dbh->prepare( $insert_query );
    $insert_sth->execute( $event_type_id, $event_type_id );

    print "DONE\n";

}

# insert cards daily usage for yesterday's cards
print "updating yetserdays daily card usage ...\n";

my $card_daily_usage_query = qq/
INSERT INTO cards_daily_usage ( date, event_type_id, card_id, number ) 
SELECT e.date, e.event_type_id, dc.card_id, COUNT(distinct dc.deck_id) 
FROM decks_cards dc 
JOIN events_players ep ON( ep.deck_id = dc.deck_id ) 
JOIN events e ON( e.id = ep.event_id ) 
WHERE e.date > ( SELECT max(date) FROM cards_daily_usage ) 
GROUP BY e.date, e.event_type_id, dc.card_id
/;

my $insert_sth = $dbh->prepare( $card_daily_usage_query );
$insert_sth->execute();

print "DONE\n";


# insert yesterday's daily deck counts
print "updating yetserdays daily deck counts ...\n";

my $daily_deck_count_query = qq/
INSERT INTO decks_daily_counts ( date, event_type_id, total_decks ) 
SELECT e.date, e.event_type_id, COUNT(distinct deck_id) 
FROM events_players ep 
JOIN events e ON ( e.id = ep.event_id ) 
GROUP BY e.date, e.event_type_id
/;

$insert_sth = $dbh->prepare( $daily_deck_count_query );
$insert_sth->execute();

print "DONE\n";

#
#
