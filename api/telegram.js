var fetch = require('node-fetch');

var query = `query {
	pool(id: \"0x632f8512166ec65c90a40fd85b8e0d76b2acdd89\") {
		token0Price
		token1Price
		totalValueLockedToken0
		totalValueLockedToken1
	}
}`;

var queryUSD = `query {
	pool(id: \"0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8\") {
		token0Price
	}
}`;

const TOKEN_SUPPLY = 100000;

const getValues = (cb) => {

	fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-testing', {
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json',
	    'Accept': 'application/json',
	  },
	  body: JSON.stringify({query})
	})
	  .then(r => r.json())
	  .then(data => {

	  	fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-testing', {
		  method: 'POST',
		  headers: {
		    'Content-Type': 'application/json',
		    'Accept': 'application/json',
		  },
		  body: JSON.stringify({query: queryUSD})
		})
		  .then(r2 => r2.json())
		  .then(data2 => {

		  	cb(null, {
		  		eth_usd_price: data2.data.pool.token0Price,
		  		cap_eth_price: data.data.pool.token1Price,
		  		eth_cap_price: data.data.pool.token0Price,
		  		cap_locked: data.data.pool.totalValueLockedToken0,
		  		eth_locked: data.data.pool.totalValueLockedToken1
		  	});

		  });

	  });

}

module.exports = (req, res) => {

	const { message } = req.body;

	if (message && message.text == '/price') {

		getValues((err, values) => {

			console.log(values);

			// Optional: send an error message back to the user here
			if (err) {
				console.error('[message ERROR]', err);
				return res.json(true);
			}

			const { eth_usd_price,
		  		cap_eth_price,
		  		eth_cap_price,
		  		cap_locked,
		  		eth_locked 
		  	} = values;

		  	const cap_usd_price = cap_eth_price * eth_usd_price * 1;

			const mcap = Math.round(cap_usd_price * TOKEN_SUPPLY).toLocaleString();

			res.json({
				method: 'sendMessage',
				chat_id: message.chat.id,
				parse_mode: 'HTML',
				text: `<code>(CAP/USD) $${(cap_usd_price*1).toFixed(4)}</code>
<code>(MCap) $${mcap}</code>
<code>(Pool) ${Math.round(cap_locked)} / ${(eth_locked*1).toFixed(2)}</code>
<code>(1 ETH) ${(eth_cap_price*1).toFixed(2)} CAP</code>
<code>(1 CAP) ${(cap_eth_price*1).toFixed(4)} ETH</code>`
			});

		});

	} else {
		res.json(true);
	}

};