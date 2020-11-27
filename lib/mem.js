"use strict";
const md5 = require("md5");
const moment = require("moment");
const mimicFn = require("mimic-fn");
const mongoose = require("mongoose");

const cacheStore = new WeakMap();
const COLLECTION = process.env.MEM_MONGO_COLLECTION || "mem.caches";

const model = mongoose.model(COLLECTION, new mongoose.Schema({
    key: {
        type: String,
        required: true,
        index: true
    },
    payload: mongoose.Schema.Types.Mixed,
    maxAge: Date
}, { timestamps: true }));

const mem = (fn, { cacheKey, maxAge } = {}) => {

    const id = md5(fn.toString());

    const memoized = async function (...arguments_) {

        await model
            .deleteMany({ maxAge: { $lte: moment().toDate() } });

        const key = [
            id,
            cacheKey ? cacheKey(arguments_) : typeof arguments_[0] === "object" ? md5(JSON.stringify(arguments_[0])) : arguments_[0]
        ].join("_");

        const cacheItem = await model
            .findOne({
                key,
                $or: [
                    { maxAge: { $eq: null } },
                    { maxAge: { $gte: moment().toDate() } }
                ]
            })
            .lean()
            .then(doc => doc && doc.payload);

        if (cacheItem != null)
            return cacheItem;

        const result = await fn.apply(this, arguments_);

        await model.create({
            key,
            payload: result,
            maxAge: maxAge ? moment().add(maxAge, "milliseconds") : null
        });

        return result;
    };

    try {
        mimicFn(memoized, fn);
    } catch (error) { }

    cacheStore.set(memoized, id);

    return memoized;
};

async function clear(fn) {

    if (!cacheStore.has(fn))
        throw new Error("Can't clear a function that was not memoized!");

    const prefix = cacheStore.get(fn);

    await model
        .deleteMany({ key: new RegExp("^" + prefix, "ig") });

    return "OK";
}

function flush() {
    return model.deleteMany({});
}

module.exports = mem;
module.exports.clear = clear;
module.exports.flush = flush;
module.exports.model = model;
