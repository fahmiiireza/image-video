const axios = require("axios");
const { createClient } = require('@supabase/supabase-js');
const { customAlphabet } = require('nanoid');
const crypto = require("crypto");



const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 12);
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_API_URL = process.env.MIDTRANS_API_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SIGNING_SECRET = process.env.INTERNAL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MIDTRANS_SERVER_KEY || !MIDTRANS_API_URL) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

//Membuat signed token untuk order tertentu
// Membuat signed token untuk order tertentu
function createSignedToken(orderId, price, email, ip) {
    const timestamp = Date.now();
    const payload = `${orderId}:${price}:${email}:${timestamp}`;

    console.log(`[SIGNED TOKEN CREATED]`, {
        orderId,
        price,
        email,
        ip,
        timestamp: new Date(timestamp).toISOString(),
    });

    const signature = crypto
        .createHmac("sha256", SIGNING_SECRET)
        .update(payload)
        .digest("hex");

    return Buffer.from(`${payload}:${signature}`).toString("base64");
}



//Verifikasi Signed Token
function verifySignedToken(token) {
    try {
        const decoded = Buffer.from(token, "base64").toString("utf8");
        const [orderId, price, email, timestamp, signature] = decoded.split(":");

        // Cek kadaluarsa (misal max 5 menit)
        if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
            return null;
        }

        const expectedSignature = crypto
            .createHmac("sha256", SIGNING_SECRET)
            .update(`${orderId}:${price}:${email}:${timestamp}`)
            .digest("hex");

        if (expectedSignature !== signature) return null;

        return { orderId, price, email };
    } catch {
        return null;
    }
}

exports.generatePayment = async (req, res) => {
    try {
        const { productId, name, email } = req.body;

        if (!productId || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { data: product } = await supabase
            .from("kodeka_products")
            .select("price")
            .eq("id", productId)
            .single();

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const orderId = "ORDER_" + nanoid(12);

        const response = await axios.post(
            MIDTRANS_API_URL,
            {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: product.price,
                },
                customer_details: {
                    first_name: name,
                    email: email,
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        "Basic " + Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64"),
                },
            }
        );

        const signedToken = createSignedToken(orderId, product.price, email, req.ip);


        res.status(200).json({
            snap_token: response.data.token,
            redirect_url: response.data.redirect_url,
            order_id: orderId,
            signed_token: signedToken,
        });
    } catch (error) {
        console.error("Midtrans Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create transaction" });
    }
};

// Verifikasi Payment setelah bayar
// Verifikasi Payment setelah bayar
exports.verifyPayment = async (req, res) => {
    try {
        const { order_id, signed_token } = req.body;



        console.log("[VERIFY PAYMENT] Incoming request:", {
            order_id,
            signed_token,
            ip: req.ip,
            time: new Date().toISOString(),
        });

        const decoded = verifySignedToken(signed_token);
        console.log("[VERIFY PAYMENT] Signed token from request:", signed_token);
        console.log("[VERIFY PAYMENT] Using secret:", SIGNING_SECRET);
        console.log("[VERIFY PAYMENT] Decoded token:", decoded);

        if (!decoded || decoded.orderId !== order_id) {
            console.warn("[VERIFY PAYMENT] Invalid or expired token", { decoded });
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        console.log("[VERIFY PAYMENT] Token valid, checking status with Midtrans...");

        // Cek status ke Midtrans
        const statusResponse = await axios.get(
            `https://api.sandbox.midtrans.com/v2/${order_id}/status`,
            {
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64"),
                },
            }
        );

        console.log("[VERIFY PAYMENT] Midtrans status response:", statusResponse.data);

        if (statusResponse.data.transaction_status === "settlement") {
            console.log("[VERIFY PAYMENT] Payment successful → granting access");
            return res.status(200).json({
                success: true,
                message: "Payment verified",
                product_access: `https://example.com/product/${order_id}`,
            });
        } else {
            console.warn("[VERIFY PAYMENT] Payment not completed:", statusResponse.data.transaction_status);
            return res.status(400).json({ error: "Payment not completed" });
        }
    } catch (err) {
        console.error("[VERIFY PAYMENT] Error:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};
