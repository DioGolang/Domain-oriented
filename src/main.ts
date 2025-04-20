import express, {Request, Response} from "express";
import process from "process";
import crypto from "crypto";
import pgp from "pg-promise";
import WebSocket, {Server} from "ws";
import {AuctionRepositoryDatabase} from "./AuctionRepository";

const app = express();
app.use(express.json());

const wss = new WebSocket.Server({ port: 8080 });
const connections: any = [];
wss.on("connection", (ws) => {
    connections.push(ws);
});

//const connection = pgp()(`postgres://postgres:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`);
const connection = pgp()(`postgres://postgres:123456@localhost:5432/app`);
const auctionRepository = new AuctionRepositoryDatabase();


app.post("/auctions", async (req: Request, res: Response) => {
    const auction = req.body;
    auction.auctionId = crypto.randomUUID();
    await auctionRepository.save(auction);
    res.json({
        auctionId: auction.auctionId,
    });
});

app.post("/bids", async (req: Request, res: Response) => {
    const bid = req.body;
    bid.bidId = crypto.randomUUID();
    const [auction] = await connection.query(
        "select * from domain_oriented.auction where auction_id = $1", [bid.auctionId]);

    if(!auction) throw new Error("auction not found");

    const [highestBid] = await connection.query("select * from domain_oriented.bid where auction_id = $1 order by amount desc limit 1",
        [bid.auctionId]);


    const bidDate = new Date(bid.date);
    if (bidDate.getTime() > auction.end_date.getTime()) {
        return res.status(422).json({
            error: "Auction is already closed",
        });
    }

    if (highestBid && highestBid.amount > bid.amount){
        return res.status(422).json({
            error: "Bid amount should be higher than highest bid",
        })
    }

    if (highestBid && highestBid.customer === bid.customer){
        return res.status(422).json({
            error: "Auction does not accept sequential bids from the same customer",
        })
    }

    await connection.query(
        "insert into domain_oriented.bid (bid_id, auction_id, customer, amount, date)" +
        "values ($1, $2, $3, $4, $5)",
        [
            bid.bidId,
            bid.auctionId,
            bid.customer,
            bid.amount,
            bid.date,
        ]);

    for (const connection of connections) {
        connection.send(Buffer.from(JSON.stringify(bid)), "utf8");
    }

    res.json({
       bidId: bid.bidId
    });
});

app.get("/auctions/:auctionId", async (req: Request, res: Response) => {
    const auctionId = req.params.auctionId;
    const [auction] = await auctionRepository.get(auctionId);

    if (!auction) throw new Error("auction not found");

    const [highestBid] = await connection.query("select * from domain_oriented.bid where auction_id = $1 order by amount desc limit 1",
        [auctionId]);

    res.json({
        auctionId,
        highestBid,
    });
});


app.listen(3000);