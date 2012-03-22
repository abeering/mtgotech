BEGIN;

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE SEQUENCE cards_seq; 
CREATE SEQUENCE types_seq;
CREATE SEQUENCE cards_types_seq;
CREATE SEQUENCE sets_seq;

CREATE TABLE cards ( 
    id int not null default nextval( 'cards_seq' ),
    name text not null,
    set_id int not null,
    set_number text not null,
    mana text,
    cmc text,
    rules_text text, 
    rarity text, 
    artist text,
    image_name text
);

CREATE TABLE types ( 
    id int not null default nextval( 'types_seq' ),
    name text not null
);

CREATE TABLE sets ( 
    id int not null default nextval( 'sets_seq' ),
    name text not null,
    shortname text not null 
);

CREATE TABLE cards_types ( 
    id int not null default nextval( 'cards_types_seq' ),
    card_id int not null,
    type_id int not null
);


COMMIT;
