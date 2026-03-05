// Run this script ONCE to:
// 1. Create a system user
// 2. Create a system account
// 3. Fix the existing user's balance by adding proper CREDIT ledger entries

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── inline models so we don't need imports ────────────────────────────────────

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name:  { type: String, required: true },
  password: { type: String, required: true, select: false },
  systemUser: { type: Boolean, default: false, immutable: true }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const accountSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
  status:   { type: String, default: 'ACTIVE' },
  currency: { type: String, default: 'INR' }
}, { timestamps: true });

const ledgerSchema = new mongoose.Schema({
  account:     { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
  amount:      { type: Number, required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'transaction', required: true },
  type:        { type: String, enum: ['CREDIT', 'DEBIT'], required: true }
});

const transactionSchema = new mongoose.Schema({
  fromAccount:    { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  toAccount:      { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  amount:         { type: Number, required: true },
  status:         { type: String, default: 'COMPLETED' },
  idempotencyKey: { type: String, unique: true }
}, { timestamps: true });

const UserModel        = mongoose.model('user', userSchema);
const AccountModel     = mongoose.model('account', accountSchema);
const LedgerModel      = mongoose.model('ledger', ledgerSchema);
const TransactionModel = mongoose.model('transaction', transactionSchema);

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Create system user if not exists
  let systemUser = await UserModel.findOne({ email: 'system@ledgerbank.com' });
  if (!systemUser) {
    systemUser = new UserModel({
      name: 'SYSTEM',
      email: 'system@ledgerbank.com',
      password: 'System@123456',
      systemUser: true
    });
    // bypass immutable for seed
    await systemUser.save();
    console.log('✅ System user created:', systemUser._id);
  } else {
    console.log('ℹ️  System user already exists:', systemUser._id);
  }

  // 2. Create system account if not exists
  let systemAccount = await AccountModel.findOne({ user: systemUser._id });
  if (!systemAccount) {
    systemAccount = new AccountModel({ user: systemUser._id, status: 'ACTIVE' });
    await systemAccount.save();
    console.log('✅ System account created:', systemAccount._id);
  } else {
    console.log('ℹ️  System account already exists:', systemAccount._id);
  }

  // 3. Find the existing user account (69a88a6ca5e537b90e868fd4)
  const USER_ACCOUNT_ID = '69a88a6ca5e537b90e868fd4';
  const userAccount = await AccountModel.findById(USER_ACCOUNT_ID);
  if (!userAccount) {
    console.error('❌ User account not found!');
    process.exit(1);
  }
  console.log('\nℹ️  User account found:', userAccount._id);

  // 4. Check existing ledger entries for this account
  const existingEntries = await LedgerModel.find({ account: userAccount._id });
  console.log('ℹ️  Existing ledger entries:', existingEntries.length);
  existingEntries.forEach(e => console.log(`   ${e.type} ₹${e.amount}`));

  // 5. Calculate current balance
  const credits = existingEntries.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0);
  const debits  = existingEntries.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0);
  const currentBalance = credits - debits;
  console.log(`\nℹ️  Current balance: ₹${currentBalance} (Credits: ${credits}, Debits: ${debits})`);

  // 6. Fix: delete the bad DEBIT entries that cancel out the credits
  // The problem: same account was used for both DEBIT and CREDIT
  // Solution: delete DEBIT entries where account = user account (those should be system account)
  const badDebits = existingEntries.filter(e => e.type === 'DEBIT');
  if (badDebits.length > 0) {
    console.log(`\n🔧 Removing ${badDebits.length} incorrect DEBIT entries from user account...`);
    for (const entry of badDebits) {
      await LedgerModel.deleteOne({ _id: entry._id });
      console.log(`   Deleted DEBIT entry: ${entry._id} ₹${entry.amount}`);
    }
    console.log('✅ Bad DEBIT entries removed');
  }

  // 7. Update those transactions to have correct fromAccount = system account
  const affectedTxIds = badDebits.map(e => e.transaction);
  for (const txId of affectedTxIds) {
    // Create correct DEBIT entry on system account instead
    const alreadyFixed = await LedgerModel.findOne({ account: systemAccount._id, transaction: txId, type: 'DEBIT' });
    if (!alreadyFixed) {
      const tx = await TransactionModel.findById(txId);
      const debit = new LedgerModel({
        account: systemAccount._id,
        amount: tx.amount,
        transaction: txId,
        type: 'DEBIT'
      });
      await debit.save();
      console.log(`✅ Created correct DEBIT on system account for tx: ${txId}`);

      // Update transaction fromAccount to system account
      await TransactionModel.updateOne({ _id: txId }, { fromAccount: systemAccount._id });
      console.log(`✅ Updated transaction fromAccount to system account`);
    }
  }

  // 8. Final balance check
  const finalEntries = await LedgerModel.find({ account: userAccount._id });
  const finalCredits = finalEntries.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0);
  const finalDebits  = finalEntries.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0);
  const finalBalance = finalCredits - finalDebits;
  console.log(`\n✅ FIXED! New balance for user account: ₹${finalBalance}`);

  await mongoose.disconnect();
  console.log('\n✅ Done! Refresh your dashboard now.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});