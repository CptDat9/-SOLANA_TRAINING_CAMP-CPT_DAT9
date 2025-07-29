import { Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js"
import {payer, connection, STATIC_PUBLICKEY} from "../lib/vars";
import { explorerURL, printConsoleSeparator } from "../lib/helpers";


(async () => {
    const newWallet = Keypair.generate(); // vi tam thoi, nma co the dung process.env
    const space = 0; 
    const lamports = await connection.getMinimumBalanceForRentExemption(space);
    /* 
    getMinimumBalanceForRentExemption(0): số lamports cần để tài khoản không bị xóa vì không đủ tiền (rent exempt). */
    console.log("Payer address:", payer.publicKey.toBase58());
    console.log("Test wallet address:", newWallet.publicKey.toBase58());

    const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: newWallet.publicKey,
        lamports: lamports + 0.1 * LAMPORTS_PER_SOL,
        space,
        programId: SystemProgram.programId,
    });

    const transferToStaticWalletIx = SystemProgram.transfer({
        fromPubkey: newWallet.publicKey,
        toPubkey: STATIC_PUBLICKEY,
        lamports: 0.1 * LAMPORTS_PER_SOL,
    });
    /* transfer phan con lai ve vi payer */
    const closeNewlyAccountIx = SystemProgram.transfer({
        fromPubkey: newWallet.publicKey,
        toPubkey: payer.publicKey, 
        lamports: lamports,
    });
    /* lay blockhash moi nhat de dung tx */
    const {
        context: {slot: minContextSlot},
        value: {blockhash, lastValidBlockHeight},
    } = await connection.getLatestBlockhashAndContext();
    /* v0 message */
    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        instructions: [createAccountIx, transferToStaticWalletIx, closeNewlyAccountIx],
        recentBlockhash: blockhash,
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    tx.sign([payer, newWallet]);

    const sig = await connection.sendTransaction(tx, {minContextSlot});

    await connection.confirmTransaction({blockhash, lastValidBlockHeight, signature: sig});

    printConsoleSeparator();
    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));
})();