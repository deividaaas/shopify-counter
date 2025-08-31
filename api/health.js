"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shopify_1 = require("../lib/shopify");
function handler(req, res) {
    const allowedShops = (0, shopify_1.getAllowedShops)().map((shop) => ({
        shop,
        tokenExists: Boolean((0, shopify_1.getTokenForShop)(shop)),
    }));
    res.status(200).json({ apiVersion: (0, shopify_1.apiVersion)(), allowedShops });
}
exports.default = handler;
