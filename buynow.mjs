import dotenv from 'dotenv';
import bs58 from 'bs58';
import fs from 'fs';
import fetch from 'node-fetch';
import { Connection, Keypair, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

dotenv.config();

const bearerToken = process.env.API_KEY;
const walletfile = '/Users/admin/.config/solana/7T2R49BKKYwZi5ju5u2cpTxiUXBa8yyridRh696Vnfko.json'

const secretKeyArray = JSON.parse(fs.readFileSync(walletfile, 'utf-8'))
const secretKeyUint8Array = Uint8Array.from(secretKeyArray);
const senderKeypair = Keypair.fromSecretKey(secretKeyUint8Array);
const connection = new Connection(process.env.RPC_URL, "confirmed");


// Function to print the public key and balance
async function printPublicKeyAndBalance() {
  const publicKey = senderKeypair.publicKey;
  console.log(`Public Key: ${publicKey.toBase58()}`);

  // Fetch the balance
  const balance = await connection.getBalance(publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
}

// Run the function
await printPublicKeyAndBalance().catch(console.error);


/**
 * Fetches serialized transaction data from the given endpoint.
 * @param {string} endpoint - The API endpoint URL.
 * @returns {Promise<Object>} The transaction data.
 */
async function fetchTxData(endpoint) {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction data: ${response.statusText}`);
  }

  return await response.json();
}

const sendListTx = async ({
    buyerAddress,
    sellerAddress,
    tokenMintAddress,
    tokenAccountAddress,
    price,
    auctionHouseAddress,
  }) => {
  try {
    const baseUrl = "https://api-devnet.magiceden.dev/v2/instructions/buy_now";
    const endpointUrl = `${baseUrl}?buyer=${buyerAddress}&seller=${sellerAddress}&tokenMint=${tokenMintAddress}&tokenATA=${tokenAccountAddress}&price=${price}&priorityFee=100000&auctionHouseAddress=${auctionHouseAddress}&sellerExpiry=0&buyerExpiry=1&buyerCreatorRoyaltyPercent=5&priorityFee=1`;
    console.log(endpointUrl)

    const txData = await fetchTxData(endpointUrl);
    const serializedTxData = new Uint8Array(txData.txSigned.data);
    console.log("txData", txData);
    console.log("serializedTxData", serializedTxData);
    const tx = VersionedTransaction.deserialize(serializedTxData);
    console.log("tx", tx);  
  
    tx.sign([senderKeypair]);
    console.log("before send");

    const txId = await connection.sendTransaction(tx);
    console.log("sent tx", txId);
    await connection.confirmTransaction({
      signature: txId,
      blockhash: txData.blockhashData.blockhash,
      lastValidBlockHeight: txData.blockhashData.lastValidBlockHeight,
    });

    console.log(`Transaction sent. Signature: ${txId}`);
  } catch (error) {
    console.error(`Error sending list transaction: ${error.message}`);
  }
};


sendListTx({
    buyerAddress: "7T2R49BKKYwZi5ju5u2cpTxiUXBa8yyridRh696Vnfko",
    sellerAddress: "HWPRgtDGpBm8mByTGS57BWCsijMo53qPPSbskWDukfTc",
    tokenMintAddress: "Fdve9nWywud2ikjZzMBZ1FedjdgUYzqbxa1qwUDM2xr1",
    tokenAccountAddress: "DBm1UGATbmvdbn2fBCBwoTbufj7gnc5YUuieVnsJdy6M",
    price: 1,
    auctionHouseAddress: "E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe",
  });
