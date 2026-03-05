const mongoose = require("mongoose")
const transactionModel = require("../models/transaction.model.js")
const ledgerModel = require("../models/ledger.model.js")
require("dotenv").config()

async function fixLedger() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log("Connected to MongoDB")

  const transactions = await transactionModel.find({ status: "COMPLETED" })
  console.log(`Found ${transactions.length} completed transactions`)

  for (const tx of transactions) {
    // Check if ledger entries already exist
    const existing = await ledgerModel.findOne({ transaction: tx._id })
    if (existing) {
      console.log(`Skipping ${tx._id} — ledger entries already exist`)
      continue
    }

    // Create DEBIT entry for sender
    const debit = new ledgerModel({
      account: tx.fromAccount,
      amount: tx.amount,
      transaction: tx._id,
      type: "DEBIT"
    })
    await debit.save()

    // Create CREDIT entry for receiver
    const credit = new ledgerModel({
      account: tx.toAccount,
      amount: tx.amount,
      transaction: tx._id,
      type: "CREDIT"
    })
    await credit.save()

    console.log(`Fixed transaction ${tx._id} — amount: ${tx.amount}`)
  }

  console.log("✅ Done! All ledger entries backfilled.")
  await mongoose.disconnect()
}

fixLedger().catch(console.error)