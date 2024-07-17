import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import 'dotenv/config';

const secretKeyArray = JSON.parse(fs.readFileSync(process.env.CC_SECRET, 'utf-8'));
const secretKeyUint8Array = Uint8Array.from(secretKeyArray);
const userWallet = Keypair.fromSecretKey(secretKeyUint8Array);

const connection = new Connection(process.env.RPC_URL, "confirmed");
const auctionHouseAddress = new PublicKey("4EJ8EhynnZbk9753jv9WCCsJYV13NqnAHgFH2VeshiL2");
const metaplex = new Metaplex(connection).use(keypairIdentity(userWallet));

const buyer = new PublicKey("8BFnYPuiA5KGrRN1TUSBywwvhKX4C44eMmxZHBk3hWRD");
//EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

(async () => {
  try {
    const auctionHouseClient = metaplex.auctionHouse();
    const auctionHouse = await auctionHouseClient.findByAddress({ address: auctionHouseAddress });

    const bids = await auctionHouseClient.findBids({ auctionHouse, buyer });

    if (bids.length === 0) {
      console.log("No bids found for the auction house.");
      return;
    }

    console.log("Existing Bids:");
    console.log(bids.entries())

    for (const [index, bid] of bids.entries()) {
      const buyerAddress = bid.buyerAddress?.toString() || "N/A";
      const price = bid.price?.basisPoints?.toNumber() || 0;
      const tokenAddress = bid.tokenAddress?.toString() || "N/A";

      console.log(`Bid ${index + 1}:`);
      console.log(`- Bidder: ${buyerAddress}`);
      console.log(`- Price: ${price} ${auctionHouse.treasuryMint.symbol}`);
      console.log(`- Token Address: ${tokenAddress}`);
      console.log(`- Auction House: ${auctionHouse.address.toString()}`);
      console.log("");
      console.log(bid);

/*      
      const cancelBidResponse = await auctionHouseClient.cancelBid({
        auctionHouse,
        bid
      });

      console.log(`Bid ${index + 1} canceled:`, cancelBidResponse);*/
    }

    // Withdraw funds from buyer's account
    try {
      const withdrawResponse = await auctionHouseClient.withdrawFromBuyerAccount({
        auctionHouse,
        buyer,
        authority: metaplex.identity(),
        amount: 1,
      });
      console.log("Withdraw Response:", withdrawResponse);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
})();
