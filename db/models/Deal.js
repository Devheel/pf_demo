const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Deal = new Schema({
    _id: Schema.Types.ObjectId,
    dId: {
        type: Number
    },
    type: {
        type: String, // 'custom', 'exchange'
        default: 'custom'
    },
    rate: {
        type: Number,
        default: null,
    },
    currency:{
        type: String,
        default: null,
    },
    name: {
        type: String,
        required: true
    },
    seller : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    buyer : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    coin: {
        type: String, // 'BTC' 'ETH' 'PFR'
        required: true
    },
    sum: {
        type: Number
    },
    sellerConditions: {
        type: String
    },
    buyerConditions: {
        type: String
    },
    messages : [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }],
    status: {
        type: String,
        default: 'new'  // new, accepted, dispute, completed, canceled
    },
    acceptedBySeller: {
        type: Boolean,
        default: false
    },
    acceptedByBuyer: {
        type: Boolean,
        default: false
    },
    escrows: [
        {
            decision: {
                type: String // rejected, seller, buyer
            },
            escrow: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            created_at: {
                type: Date,
                default: Date.now
            },
            join_at: {
                type: Date,
                default: 0
            }
        }
    ],
    disputeDecision: {
        type: String
    },
    wallet: {
        type: String
    },
    exchange: {
        type: Schema.Types.ObjectId,
        ref: 'Exchange'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { usePushEach: true });

const counter = require('./Counter');

Deal.pre('save', function(next) {
    if (this.isNew) {
        var doc = this;
        counter.findByIdAndUpdate({_id: 'deals'}, {$inc: {seq: 1}}, {
            new: true,
            upsert: true
        }, function (error, counter) {
            if (error)
                return next(error);
            doc.dId = counter.seq;
            next();
        });
    } else {
        next();
    }
});
Deal.methods.userHasAccess = function (user_id) {
    return this.seller.toString() === user_id || this.buyer.toString() === user_id;
};
Deal.methods.getUserRole = function (user_id) {
    if (this.seller._id.toString() === user_id) {
        return 'seller';
    }
    if (this.buyer._id.toString() === user_id) {
        return 'buyer';
    }
    var flag = false;
    this.escrows.forEach(function (item) {
        if (item.escrow.toString() === user_id) {
            flag = true;
        }
    });
    if (flag) {
        return 'escrow';
    }
    return false;
};
module.exports = mongoose.model('Deal', Deal);