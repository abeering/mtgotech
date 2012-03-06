DROP SCHEMA public CASCADE;

CREATE SCHEMA public;

BEGIN;

CREATE SEQUENCE card_id_seq;

CREATE TABLE card (
    id INT NOT NULL DEFAULT NEXTVAL('card_id_seq'),
    series TEXT NOT NULL,
    series_number TEXT NOT NULL,
    name TEXT NOT NULL,
    card_type TEXT NOT NULL,
    mana TEXT NOT NULL,
    cmc INT,
    rarity TEXT NOT NULL,
    artist TEXT NOT NULL,
    image_name TEXT NOT NULL
);

COMMIT;
    
    
