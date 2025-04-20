import pgp from "pg-promise";

export default interface AuctionRepository {
    save(auction: any): Promise<void>;
    get(auctionId: string): Promise<any>;
}

export class AuctionRepositoryDatabase implements AuctionRepository {
    constructor() {}

    async save(auction: any): Promise<void> {
        const connection = pgp()(`postgres://postgres:123456@localhost:5432/app`);
        await connection.query(
            "insert into domain_oriented.auction (auction_id, start_date, end_date, min_increment, start_amount)" +
            "values ($1, $2, $3, $4, $5)",
            [
                auction.auctionId,
                auction.startDate,
                auction.endDate,
                auction.minIncrement,
                auction.startAmount
            ]);

        await connection.$pool.end()
    }
    async get(auctionId: string): Promise<any> {
        const connection = pgp()(`postgres://postgres:123456@localhost:5432/app`);
        const [auction] = await connection.query("select * from domain_oriented.auction where auction_id = $1",
            [auctionId]);
        await connection.$pool.end()
        return auction;
    }
}
