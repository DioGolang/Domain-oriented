import axios from "axios";
import WebSocket, {Server} from "ws";

axios.defaults.validateStatus = () => true;
let ws: WebSocket;
let messages: any = [];

beforeEach(async () => {
    ws = new WebSocket("ws://localhost:8080");
    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        messages.push(message);
    });
});


test.only("Deve criar uma leilão e dar três lances", async () => {
    const inputCreateAuction = {
        startDate: "2025-03-01T10:00:00Z",
        endDate: "2025-03-01T12:00:00Z",
        minIncrement: 10,
        startAmount: 1000,
    };
    const responseCreateAuction = await axios.post("http://localhost:3000/auctions", inputCreateAuction);
    const outputCreateAuction = responseCreateAuction.data;
    expect(outputCreateAuction.auctionId).toBeDefined();

    const inputBid1 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "a",
        amount: 1010,
        date: "2025-03-01T10:00:00Z",
    };
    const responseCreateBid1 = await axios.post("http://localhost:3000/bids", inputBid1);
    const outCreateBid1 = responseCreateBid1.data;
    expect(outCreateBid1.bidId).toBeDefined();

    const inputBid2 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "b",
        amount: 1050,
        date: "2025-03-01T10:00:00Z",
    };
    const responseCreateBid2 = await axios.post("http://localhost:3000/bids", inputBid2);
    const outCreateBid2 = responseCreateBid2.data;
    expect(outCreateBid2.bidId).toBeDefined();

    const inputBid3 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "c",
        amount: 1100,
        date: "2025-03-01T10:00:00Z",
    };
    const responseCreateBid3 = await axios.post("http://localhost:3000/bids", inputBid3);
    const outCreateBid3 = responseCreateBid3.data;
    expect(outCreateBid3.bidId).toBeDefined();



    const responseGetAuction = await axios.get(`http://localhost:3000/auctions/${outputCreateAuction.auctionId}`);
    const outputGetAuction = responseGetAuction.data;
    expect(outputGetAuction.highestBid.customer).toBe("c");
    expect(outputGetAuction.highestBid.amount).toBe("1100");

    expect(messages).toHaveLength(3);
    expect(messages.at(0).customer).toBe("a");
    expect(messages.at(1).customer).toBe("b");
    expect(messages.at(2).customer).toBe("c");
});


test("não Deve dar lance fora do horário do leilão", async () => {
    const inputCreateAuction = {
        startDate: "2025-03-01T10:00:00Z",
        endDate: "2025-03-01T12:00:00Z",
        minIncrement: 10,
        startAmount: 1000,
    };
    const responseCreateAuction = await axios.post("http://localhost:3000/auctions", inputCreateAuction);
    const outputCreateAuction = responseCreateAuction.data;
    expect(outputCreateAuction.auctionId).toBeDefined();

    const inputBid1 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "a",
        amount: 1010,
        date: "2025-03-01T14:00:00Z",
    };
    const responseCreateBid1 = await axios.post("http://localhost:3000/bids", inputBid1);
    expect(responseCreateBid1.status).toBe(422);
    const outCreateBid1 = responseCreateBid1.data;
    expect(outCreateBid1.error).toBe("Auction is already closed");

});

test("não pode dar lance que o lance anterior", async () => {
    const inputCreateAuction = {
        startDate: "2025-03-01T10:00:00Z",
        endDate: "2025-03-01T12:00:00Z",
        minIncrement: 10,
        startAmount: 1000,
    };
    const responseCreateAuction = await axios.post("http://localhost:3000/auctions", inputCreateAuction);
    const outputCreateAuction = responseCreateAuction.data;

    const inputBid1 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "a",
        amount: 1010,
        date: "2025-03-01T11:00:00Z",
    };
    const responseCreateBid1 = await axios.post("http://localhost:3000/bids", inputBid1);

    const inputBid2 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "b",
        amount: 1000,
        date: "2025-03-01T11:30:00Z",
    };
    const responseCreateBid2 = await axios.post("http://localhost:3000/bids", inputBid2);
    expect(responseCreateBid2.status).toBe(422);
    const outCreateBid2 = responseCreateBid2.data;
    expect(outCreateBid2.error).toBe("Bid amount should be higher than highest bid");

});

test("não pode dar lance seguido pelo menos cliente", async () => {
    const inputCreateAuction = {
        startDate: "2025-03-01T10:00:00Z",
        endDate: "2025-03-01T12:00:00Z",
        minIncrement: 10,
        startAmount: 1000,
    };
    const responseCreateAuction = await axios.post("http://localhost:3000/auctions", inputCreateAuction);
    const outputCreateAuction = responseCreateAuction.data;

    const inputBid1 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "a",
        amount: 1010,
        date: "2025-03-01T11:00:00Z",
    };
    const responseCreateBid1 = await axios.post("http://localhost:3000/bids", inputBid1);

    const inputBid2 = {
        auctionId: outputCreateAuction.auctionId,
        customer: "a",
        amount: 1100,
        date: "2025-03-01T11:30:00Z",
    };
    const responseCreateBid2 = await axios.post("http://localhost:3000/bids", inputBid2);
    expect(responseCreateBid2.status).toBe(422);
    const outCreateBid2 = responseCreateBid2.data;
    expect(outCreateBid2.error).toBe("Auction does not accept sequential bids from the same customer");

});

afterEach(async () => {
    ws.close();
})