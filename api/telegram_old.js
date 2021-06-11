if (process.env.NODE_ENV == 'development') require('dotenv').config();

const Web3 = require('web3');
const UniswapPair = require('../abi/UniswapPair.json');

// Your token
const TOKEN_SYMBOL = 'CAP';
const TOKEN_SUPPLY = 100000;

// This is the Uniswap pair contract, not the token's main contract. E.g. https://uniswap.info/pair/0xC169F0eb31403c0bcc43Dc9feCa648A79faFC0F4 for CAP
const TOKEN_CONTRACT = '0xC169F0eb31403c0bcc43Dc9feCa648A79faFC0F4';

// Used to convert to USD prices. This is the Uniswap USDC/ETH pair contract.
const USDC_CONTRACT = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc';

const getUniswapPrice = (pair, swap, cb) => {
	
	const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' + process.env.INFURA_TOKEN));

	const contract = new web3.eth.Contract(UniswapPair.abi, pair);
	
	contract.methods.getReserves().call({}, (err, data) => {
		if (err) return cb(err);
		const { reserve0, reserve1 } = data;
		cb(null, swap ? reserve1 / reserve0 : reserve0 / reserve1, reserve0, reserve1);
	});

}

const getPrices = function(cb) {

	const regExp = /e-(\d+)/;

	// Get TOKEN price
	getUniswapPrice(TOKEN_CONTRACT, true, (err, uniswapTokenEth, rTOKEN, rETH) => {

		if (err) return cb(err);
		
		uniswapTokenEth = (uniswapTokenEth) ? uniswapTokenEth.toFixed(8) : 0;
		
		// Get USDC price
		getUniswapPrice(USDC_CONTRACT, false, (err, uniswapEthUsdc) => {

			if (err) return cb(err);
			
			uniswapEthUsdc = (uniswapEthUsdc) ? (uniswapEthUsdc * 1000000000000).toFixed(2) : 0;
			
			let uniswapTokenUsdc = uniswapTokenEth * uniswapEthUsdc;
			uniswapTokenUsdc = uniswapTokenUsdc.toString().replace(regExp, '');
			uniswapTokenUsdc = Number(uniswapTokenUsdc).toFixed(4);

			cb(null, {
				tokeneth: uniswapTokenEth,
				tokenusdc: uniswapTokenUsdc,
				rtoken: Math.round(rTOKEN / Math.pow(10,18)),
				reth: (rETH / Math.pow(10,18)).toFixed(2)
			});

		});
	
	});

}

module.exports = (req, res) => {

	const { message } = req.body;

	if (message && message.text == '/price') {

		getPrices((err, prices) => {

			// Optional: send an error message back to the user here
			if (err) {
				console.error('[getPrices ERROR]', err);
				return res.json(true);
			}

			const { tokeneth, tokenusdc, rtoken, reth } = prices;

			const ETH_to_TOKEN = Number(1/tokeneth).toFixed(2);
			const TOKEN_to_ETH = Number(tokeneth).toFixed(4);
			const mcap = Math.round(tokenusdc * TOKEN_SUPPLY).toLocaleString();

			res.json({
				method: 'sendMessage',
				chat_id: message.chat.id,
				parse_mode: 'HTML',
				text: `<code>(${TOKEN_SYMBOL}/USD) $${tokenusdc}</code>
<code>(MCap) $${mcap}</code>
<code>(Pool) ${rtoken} / ${reth}</code>
<code>(1 ETH) ${ETH_to_TOKEN} ${TOKEN_SYMBOL}</code>
<code>(1 ${TOKEN_SYMBOL}) ${TOKEN_to_ETH} ETH</code>`
			});

		});

	} else {
		res.json(true);
	}

}