const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Shorten the link Function
exports.createShortLink = async (req, res) => {
    try {
        const { original_url, custom_slug } = req.body;

        if (!/^https?:\/\//.test(original_url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        // generate random if no slug is written
        let slug = custom_slug || Math.random().toString(36).substring(2, 8);

        // Check the slug from Supabase
        const { data: existing, error: checkError } = await supabase
            .from('short_links')
            .select('*')
            .eq('slug', slug)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Database check failed', details: checkError });
        }

        if (existing) {
            return res.status(400).json({ error: 'Slug already taken' });
        }

        const { error: insertError } = await supabase
            .from('short_links')
            .insert([{ slug, original_url }]);

        if (insertError) {
            return res.status(500).json({ error: 'Failed to insert data', details: insertError });
        }

        res.json({ short_url: `https://link.kodekalabs.com/${slug}` });
    } catch (err) {
        res.status(500).json({ error: 'Unexpected server error', details: err.message });
    }
};

// Redirect link Function
exports.redirectShortLink = async (req, res) => {
    try {
        const { slug } = req.params;

        const { data, error } = await supabase
            .from('short_links')
            .select('original_url')
            .eq('slug', slug)
            .single();

        if (error && error.code === 'PGRST116') {
            return res.status(404).send('Link not found');
        }

        if (error) {
            return res.status(500).json({ error: 'Database query failed', details: error });
        }

        res.redirect(data.original_url);
    } catch (err) {
        res.status(500).json({ error: 'Unexpected server error', details: err.message });
    }
};
