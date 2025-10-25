// This is our secure "middleman" serverless function
// It runs on Netlify's servers, not in the browser.
// This version uses require('node-fetch') which is installed via package.json

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Get the API key and region from Netlify's secure environment variables
    const { MAILGUN_API_KEY, MAILGUN_API_REGION } = process.env;
    const API_BASE = MAILGUN_API_REGION || 'api.mailgun.net'; // Default to US

    if (!MAILGUN_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Mailgun API Key is not set in Netlify.' })
        };
    }

    const authHeader = `Basic ${Buffer.from('api:' + MAILGUN_API_KEY).toString('base64')}`;
    let url;

    // The function can do two things:
    // 1. Get the list of messages
    // 2. Get a single message (if a 'url' param is sent)

    if (event.queryStringParameters.url) {
        // Fetch a single message
        // Decode the URL sent from the app
        url = Buffer.from(event.queryStringParameters.url, 'base64').toString('ascii');
    } else if (event.queryStringParameters.domain) {
        // Fetch the inbox
        const domain = event.queryStringParameters.domain;
        url = `https://${API_BASE}/v3/${domain}/events?event=stored`;
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing domain or url parameter.' })
        };
    }

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': authHeader }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Mailgun API error: ${response.status} ${errorText}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Mailgun API error: ${response.statusText}` })
            };
        }

        const data = await response.json();
        
        // Return the data successfully to the app
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Allow our app to call this
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};


