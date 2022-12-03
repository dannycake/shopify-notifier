const {
    endpoint,
    'discord webhook': webhook,
    content,
} = require('./config.json');
const superagent = require('superagent');

const LISTING_URL = endpoint.slice(0, -3);
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36`;

const print = str => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${str}`);
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const sendWebhook = body => superagent('POST', webhook)
    .set('content-type', 'application/json')
    .send({
        content,
        ...body
    })
    .catch(err => {
        console.error(err.response ? err.response.text : err);
        print(`Failed to send webhook message`);
    });

const agent = superagent.agent();

const fetchDetails = () => new Promise(resolve => {
    agent.get(endpoint)
        .set('user-agent', USER_AGENT)
        .then(resp => {
            return resolve(JSON.parse(resp.text));
        })
        .catch(err => {
            console.error(err.response ? err.response.text : err);
            print(`Failed to fetch item listing details`);
            return resolve();
        })
});

const main = async () => {
    print(`Started, watching ${LISTING_URL}`);

    for (; ;) {
        const details = await fetchDetails();
        if (!details) {
            sendWebhook({
                embeds: [{
                    title: 'Failed to fetch listing details',
                    description: `Check the console for more info ☹️`
                }]
            });

            await wait(10 * 1000);
            continue;
        }

        const {price, available, images} = details;
        const formattedPrice = '$' + (price / 100).toFixed(2);
        const imageUrl = images[0];

        print(`Checked price: ${formattedPrice}, available: ${available ? 'yes' : 'no'}`);

        if (available) sendWebhook({
            embeds: [{
                title: 'Item Available',
                description: `Item is now available for ${formattedPrice}`,
                url: LISTING_URL,
                color: 0x00ff00,
                thumbnail: {
                    url: `https:${imageUrl}`
                },
            }]
        });

        await wait(30 * 1000)
    }
}

main();