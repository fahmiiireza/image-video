const axios = require("axios");

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_API_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

exports.generatePayment = async (req, res) => {
    try {
        const { amount, name, email } = req.body;

        if (!amount || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const orderId = "ORDER-" + Date.now(); // unique order ID

        //TODO: how so the payload from the website didnt show the amount. so just send the product id and server will take the amount from the supabase
        const response = await axios.post(
            MIDTRANS_API_URL,
            {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: amount,
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
