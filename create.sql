drop schema if exists domain_oriented cascade;

create schema domain_oriented;

create table domain_oriented.auction
(
    auction_id    uuid,
    start_date    timestamptz,
    end_date      timestamptz,
    min_increment numeric,
    start_amount  numeric
);

create table domain_oriented.bid
(
    bid_id     uuid,
    auction_id uuid,
    customer   text,
    amount     numeric,
    date       timestamptz
);