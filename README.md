# Telegram Uniswap Price Bot

A bot to fetch prices for tokens trading on Uniswap. Works for Uniswap V2.

## Usage

* Add your `INFURA_TOKEN` as an environment variable. You can get one from [Infura.io](https://infura.io).

* In `api/telegram.js`, set your token's details (symbol, circulating supply, and Uniswap Pair contract).

* Set the webhook on your Telegram bot to call the `api/telegram.js` route on your server. Instructions on how to do this can be found [here](https://core.telegram.org/bots/api#setwebhook).

That's it! Now your users can type `/price` in their bot conversation to get your token's real-time price. Add the bot to your group (and make them an admin) to let users do this directly from the group.

This bot is deployed in the [Cap Telegram Group](https://t.me/capfin).