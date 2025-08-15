const axios = require("axios");
const { createClient } = require('@supabase/supabase-js');
const { customAlphabet } = require('nanoid');


const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 12);
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_API_URL = process.env.MIDTRANS_API_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MIDTRANS_SERVER_KEY || !MIDTRANS_API_URL) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
        res.status(200).json({
            token: response.data.token,
            redirect_url: response.data.redirect_url,
            order_id: orderId,
        });
    } catch (error) {
        console.error("Midtrans Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create transaction" });
    }
};
