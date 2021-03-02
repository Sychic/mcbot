//imports
const path = require("path");
require('dotenv').config({
    path: path.join(__dirname, '.env')
});
const mineflayer = require("mineflayer");
const Discord = require("discord.js");
const ejs = require("emoji-js");
require("colors");
const wait = require("util").promisify(setTimeout);
const axios = require("axios").default;

//variables
const emojiConverter = new ejs();
emojiConverter.text_mode = true;
emojiConverter.colons_mode = true;
let lastMsg = {
    "platform": null,
    "user": null,
    "cache": null
};
const date = new Date();
let cache, cache2;
let next = new Date();
let passthrough = false;
let officers = JSON.parse(process.env.OFFICERS);

const client = new Discord.Client({
    ws: {
        intents: ['GUILDS', 'GUILD_MESSAGES']
    }
});
const options = {
    host: 'mc.hypixel.net',
    version: '1.8.9',
    username: process.env.USER,
    password: process.env.PASSWORD,
};

// minecraft bot stuff vv
let mc;
(async function init() {
    try {
        console.log("Logging in.");
        mc = mineflayer.createBot(options);
        mc._client.once("session", session => options.session = session);
        mc.once("end", async () => {
            await wait(60000);
            console.log("Connection failed. Retrying..");
            init();
        });

    } catch (e) {
        console.error(e);
    }
})();

function callEveryHour() {
    mc.chat(`/gc Dark Auction Reminder~ (3m)`);
    date.setHours(date.getHours() + 1);
    date.setMinutes(52);
    date.setSeconds(0);
    const difference = date - new Date();
    next = new Date(Date.now() + difference);
    setTimeout(() => {
        mc.chat(`/gc Jacob's Contest Reminder~ (3m)`);
    }, 20 * 60000); // 20 minutes to 3 minutes before Contest (Contest is always 20 after DA)
    setTimeout(() => {
        callEveryHour();
    }, 60 * 60000); // 60 minutes
}

if (date.getMinutes() === 52) {
    callEveryHour()
} else {
    if (date.getMinutes() > 52) {
        date.setHours(date.getHours() + 1);
    } else {
        date.setHours(date.getHours());
    }
    date.setMinutes(52);
    date.setSeconds(0);

    const difference = date - new Date();
    next = new Date(Date.now() + difference);
    setTimeout(callEveryHour, difference);
}

let lowestBin = {};

setInterval(getLowestBinPrices, 120 * 1000)

async function getLowestBinPrices() {
    let req = await axios.get("https://moulberry.codes/lowestbin.json");
    if (typeof req.data === "object") {
        lowestBin = req.data;
    }
}

async function getLowestBinForItem(query = "") {
    if (Object.keys(lowestBin).length === 0) {
        await getLowestBinPrices();
    }
    if (query === "") return null;
    query = require("autocorrect")({words: Object.keys(lowestBin)})(query.replace(" ", "_").toUpperCase());
    return {
        item: query,
        price: lowestBin[query]
    };
}

let uuid;
let name;
mc.on("login", async () => {
    uuid = mc._client.session.selectedProfile.id;
    name = mc._client.session.selectedProfile.name;
    await wait(1000);
    console.log("Sending to limbo.");
    mc.chat("/achat \u00a7c<3");
    // mc.chat("/gc Logged in")
});

let inParty = false;
let lastPartied = "";
mc.on("message", async (chatMsg) => {
    const msg = chatMsg.toString();
    console.log("Minecraft: ".brightGreen + msg);
    if (passthrough && msg !== "") {
        return client.guilds.cache.get(process.env.GUILD).channels.cache.get(process.env.CHANNEL).send(msg);
    }
    if (msg.startsWith("From") && msg.includes(":")) {
        let usernameMatcher = msg.match(/ (\w+?):/);
        if (usernameMatcher) {
            let username = usernameMatcher[1];
            const args = msg.substring(msg.indexOf(":") + 1).trim().split(/ +/g);
            const command = args.shift().toLowerCase();
            if (command === "lbin") {
                if (!args[0]) {
                    await wait(250);
                    mc.chat(`/msg ${username} You need to provide an item to lookup the price for!`);
                    return;
                }
                let data = await getLowestBinForItem(args.join(" "));
                if (data === null) {
                    await wait(250);
                    mc.chat(`/msg ${username} I was unable to get the lowest BIN prices.`);
                    return;
                }
                mc.chat(`/msg ${username} The lowest BIN price for ${data.item} is ${data.price.toLocaleString()}.`);
                return;
            }
        }
        client.guilds.cache.get(process.env.GUILD).channels.cache.get(process.env.PMS).send(msg);
        return;
    }

    if ((msg.startsWith("Guild >") || msg.startsWith("Officer >")) && msg.includes(":")) {
        let splitMsg = msg.split(" ");
        if (splitMsg[2].includes(name) || splitMsg[3].includes(name)) return;
        cache = splitMsg;
        let i = msg.search(/:/);
        let splitMsg2 = [msg.slice(0, i), msg.slice(i + 1)];
        cache2 = splitMsg2;
        let sender, sentMsg;
        if (splitMsg[2].includes("[")) {
            sender = splitMsg[3];
        } else {
            sender = splitMsg[2];
        }
        sentMsg = splitMsg2[1];

        const embed = new Discord.MessageEmbed()
            .setAuthor(sender + ": " + sentMsg, "https://minotar.net/helm/" + sender)
            .setColor("#AAAAAA");
        const rank = splitMsg[2].replace(/[\[\]']+/g, '');
        if (rank === "MVP++") {
            embed.setColor("#FFAA00")
        } else if (rank === "MVP+") {
            embed.setColor("#5555FF")
        } else if (rank === "MVP") {
            embed.setColor("#55FFFF")
        } else if (rank === "VIP+") {
            embed.setColor("#00AA00")
        } else if (rank === "VIP") {
            embed.setColor("#55FF55")
        }
        let c;
        if (msg.startsWith("Guild >") && msg.includes(":") && process.env.gToggle == `true`) {
            c = client.guilds.cache.get(process.env.GUILD).channels.cache.get(process.env.CHANNEL);
        } else if (msg.startsWith("Officer >") && msg.includes(":") && process.env.oToggle == `true`) {
            c = client.guilds.cache.get(process.env.OGUILD).channels.cache.get(process.env.OCHANNEL);
        }
        if (c === undefined) return;
        c.send(embed);
        lastMsg = {
            "user": sender,
            "platform": "minecraft",
            "cache": embed
        };
        return;
    }
    if (msg.includes("has invited you to join their party!")) {
        let usernameRegex = /(?:\[.+?\] )?(\w+)/;
        if (usernameRegex.test(msg)) {
            let username = usernameRegex.exec(msg)[1];
            if (username) {
                if (!inParty) {
                    inParty = true;
                    lastPartied = username;
                  
                    await wait(200);
                    mc.chat(`/p join ${username}`);
                    await wait(200);
                    mc.chat(`/pc Hi ${username}! Please queue for your dungeon. I will leave the party in 15 seconds.`);
                    await wait(15000);

                  if (lastPartied === username) {
                        mc.chat("/p leave");
                        inParty = false;
                    } 

                } else {
                    await wait(200);
                    mc.chat(`/msg ${username} Sorry! I'm currently helping someone else out! Please party me again in 15 seconds.`);
                }
            }
        }
    } else if (msg.includes("warped the party to a SkyBlock dungeon!")) {
        await wait(500);
        mc.chat("/pc Good luck!");
        await wait(200);
        mc.chat("/p leave");
        inParty = false;
    } else if (msg.includes("has disbanded the party!") || msg.includes("You are not in a party.")) {
        inParty = false;
    }
    await wait(200);
    mc.chat("/achat \u00a7c<3");
});

// discord bot stuff vv
client.on("ready", () => {
    console.log("Discord: Logged in.".bgBlue);
});

function processDiscordMsg(message) {
    const name = (message.author.id === "342863217892261888") ? "Nahlee" : (message.author.id === "617450312625684523") ? "Isabel" : (message.guild.member(message.author).displayName.length > 16) ? message.author.username : message.guild.member(message.author).displayName;
    const emoteregex = /(:[^:\s]+:|<:[^:\s]+:[0-9]+>|<a:[^:\s]+:[0-9]+>)/g;
    let msg = emojiConverter.replace_unified(`(${name}): ` + message.cleanContent);
    let m = msg.match(emoteregex);
    if (m !== null) {
        m.forEach((x) => {
            let emotename = x.split(":")[1].split(":")[0];
            msg = msg.replace(x, `:${emotename}:`)
        });
    }
    msg = msg.replace(/​/g, ""); // d.js cleanContent inserts ZWSP for some reason
    msg = msg.replace(/ez/g, "eࠀz");
    return msg;
}

client.on("message", (message) => {
    if ((message.channel.id !== process.env.CHANNEL && message.channel.id !== process.env.OCHANNEL) || message.author.bot) return;
    if (message.content.startsWith(process.env.PREFIX)) {
        const args = message.content.slice(process.env.PREFIX.length).trim().split(" ");
        const command = args.shift().toLowerCase();
        if (officers.includes(message.author.id)) {
            switch (command) {
                case "last":
                    message.channel.send(JSON.stringify(lastMsg));
                    break;
                case "cache2":
                    message.channel.send(JSON.stringify(cache2));
                    break;
                case "cache":
                    message.channel.send(JSON.stringify(cache));
                    break;
                case "next":
                    message.channel.send(JSON.stringify(next));
                    break;
                case "comm":
                    mc.chat(args.join(" "));
                    passthrough = true;
                    setTimeout(() => {
                        passthrough = false;
                    }, 250);
                    break;
            }
        }
        return;
    }
    if (message.content === "") return;
    let processedMsg = processDiscordMsg(message);
    console.log("Discord: ".blue + message.author.username + ": " + message.content);
    if (message.channel.id === process.env.CHANNEL) {
        mc.chat("/gc " + processedMsg);
    } else if (message.channel.id === process.env.OCHANNEL) {
        mc.chat("/oc " + processedMsg);
    }
    lastMsg = {
        "user": name,
        "platform": "discord",
        cache: "message.content"
    };
});

client.login(process.env.TOKEN).then();