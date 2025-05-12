## Prerequisites
1. [Deno](https://deno.com)
2. [Malai](https://malai.sh) (preferred) or [Ngrok](https://ngrok.com)
3. Discord account


## Local setup with Malai 
Since discord sends requests to public url which is hosted on internet, it is important to host your server running. [Malai](https://malai.sh) is an excellent tool to achieve that.

1. Installation
To install Malai follow https://malai.sh/get-started/

2. Hosting localhost with malai
To host you can simply run command 
```sh
malai http <PORT_NUMBER> ---public
```

## Alternate setup with deno playground
Deno provides a playground to run serverless functions where you can test your code for the server live. This requires you to signup to [Deno deploy](http://deno.com/deploy)

After signing up. Follow the steps

1. Create a playground
2. Copy code in `main.js` in the playground editor you just created

## Discord bot setup
To create and test your bot follow these steps

1. Go to discord's [developer portal](https://discord.com/developers/applications) and create an application.

2. Copy public key and use it as `DISCORD_PUBLIC_KEY` env var for your server.

3. Enter url of your server and append `/api` in the `interaction endpoint url` field. Make sure your server is running and hosted, click on save and your bot should be registered.

4. After all the steps have succeeded Go to OAuth section of discord applications and generate a invite link for your bot. Select the following permissions
- `application.commands`
- `bot`
- `send messages`
