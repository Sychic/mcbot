//imports
require('dotenv').config({path:__dirname+'/.env'})
const mineflayer = require("mineflayer");
const discord = require("discord.js");
const ejs = require("emoji-js");
require("colors");

//variables
const emojiConverter = new ejs();
emojiConverter.text_mode = true;
emojiConverter.colons_mode = true;
let lastMsg = {"platform":null,"user":null,"cache":null};
const date = new Date();
let cache, cache2;
let next = new Date();
let passthrough = false;
let officers = JSON.parse(process.env.OFFICERS);

const client = new discord.Client();
const options = {
    host: 'mc.hypixel.net',
    version: '1.8.9',
    username: process.env.USER,
    password: process.env.PASSWORD,
};

// minecraft bot stuff vv
let mc;
(function init() {
    try{
        console.log("Logging in.");
        mc = mineflayer.createBot(options);
        mc._client.once("session", session => options.session = session);
        mc.once("end", () => {
            setTimeout(() => {
                console.log("Connection failed. Retrying..");
                init();
            }, 60000);
        });

    }catch(e){
        console.error(e);
    }
})();

function callEveryHour() {
    mc.chat(`/gc Dark Auction Reminder~ (3m)`);
    date.setHours(date.getHours()+1);
    date.setMinutes(52);
    date.setSeconds(0);
    const difference = date - new Date();
    next=new Date(Date.now()+difference);
    setInterval(function(){
        callEveryHour();
    }, 1000 * 60 * 60);
}

if (date.getMinutes() === 52) {
    callEveryHour()
} else {
    date.setHours(date.getHours()+1);
    date.setMinutes(52);
    date.setSeconds(0);

    const difference = date - new Date();
    next=new Date(Date.now()+difference);
    setTimeout(callEveryHour, difference);
}

let uuid;
let name;
mc.on("login", () => {
    uuid = mc._client.session.selectedProfile.id;
    name = mc._client.session.selectedProfile.name;
    setTimeout(() => {
        console.log("Sending to limbo.");
        mc.chat("/achat \u00a7c<3");
    }, 1000);
    // mc.chat("/gc Logged in")
});

mc.on("message", (chatMsg) => {
    const msg = chatMsg.toString();
    console.log("Minecraft: ".brightGreen + msg);
    if(passthrough&&msg!==""){
        return client.guilds.cache.get(process.env.GUILD).channels.cache.get(process.env.CHANNEL).send(msg);
    }
    if (msg.endsWith(" joined the lobby!") && msg.includes("[MVP+")) {
        console.log("Sending to limbo.");
        mc.chat("/achat \u00a7ca");
        return;
    }
    if(msg.startsWith("From")&&msg.includes(":")){
        client.guilds.cache.get(process.env.GUILD).channels.cache.get(process.env.PMS).send(msg);
        return;
    }

    if ((msg.startsWith("Guild >") || msg.startsWith("Officer >")) && msg.includes(":")) {
        let splitMsg = msg.split(" ");
        if(splitMsg[2].includes(name)||splitMsg[3].includes(name)) return;
        cache=splitMsg;
        let i = msg.search(/:/);
        let splitMsg2 = [msg.slice(0,i), msg.slice(i+1)];
        cache2=splitMsg2;
        let sender, sentMsg;
        if (splitMsg[2].includes("[")) {
            sender = splitMsg[3];
        } else {
            sender = splitMsg[2];
        }
        sentMsg = splitMsg2[1];

        const embed = new discord.MessageEmbed()
            .setAuthor(sender + ": " + sentMsg, "https://minotar.net/helm/" + sender)
            .setColor("#AAAAAA");
        const rank = splitMsg[2].replace(/[\[\]']+/g,'');
        if(rank==="MVP++"){
            embed.setColor("#FFAA00")
        } else if(rank==="MVP+"){
            embed.setColor("#5555FF")
        } else if(rank==="MVP"){
            embed.setColor("#55FFFF")
        } else if(rank==="VIP+"){
            embed.setColor("#00AA00")
        } else if(rank==="VIP"){
            embed.setColor("#55FF55")
        }
        let c;
        if (msg.startsWith("G") && process.env.gToggle===`true`) {
            c = client.guilds.cache.get(process.env.GUILD).channels.cache.get(process.env.CHANNEL);
        } else if (msg.startsWith("O") && process.env.oToggle===`true`) {
            c = client.guilds.cache.get(process.env.OGUILD).channels.cache.get(process.env.OCHANNEL);
        }
        if (c === undefined) return;
        c.send(embed);
        lastMsg={"user":sender,"platform":"minecraft","cache":embed};
    }
});

// discord bot stuff vv
client.on("ready", () => {
    console.log("Discord: Logged in.".bgBlue);
});

function processDiscordMsg(message) {
    const name = (message.author.id === "342863217892261888") ? "Nahlee" :(message.author.id === "617450312625684523") ? "Isabel" :(message.guild.member(message.author).displayName.length>16) ? message.author.username : message.guild.member(message.author).displayName;
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
    if((message.channel.id !== process.env.CHANNEL && message.channel.id !== process.env.OCHANNEL )|| message.author.bot) return;
    if(officers.includes(message.author.id)&&message.content.startsWith(`${process.env.PREFIX}last`)){
        message.channel.send(JSON.stringify(lastMsg));
        return;
    }else if(officers.includes(message.author.id)&&message.content.startsWith(`${process.env.PREFIX}cache2`)){
        message.channel.send(JSON.stringify(cache2));
        return;
    }else if(officers.includes(message.author.id)&&message.content.startsWith(`${process.env.PREFIX}cache`)){
        message.channel.send(JSON.stringify(cache));
        return;
    }else if(officers.includes(message.author.id)&&message.content.startsWith(`${process.env.PREFIX}next`)){
        message.channel.send(JSON.stringify(next));
        return;
    }else if(officers.includes(message.author.id)&&message.content.startsWith(`${process.env.PREFIX}comm`)){
        mc.chat(message.content.substring(6));
        passthrough=true;
        setTimeout(() => {
            passthrough=false;
        }, 250);
        return;
    }
    if(message.content.startsWith(process.env.PREFIX)) return;
    if(message.content === "") return;
    let processedMsg = processDiscordMsg(message);
    console.log("Discord: ".blue + message.author.username + ": " + message.content);
    if (message.channel.id === process.env.CHANNEL){
        mc.chat("/gc " + processedMsg);
    }else if (message.channel.id === process.env.OCHANNEL){
        mc.chat("/oc " + processedMsg);
    }
    lastMsg={"user":name,"platform":"discord",cache:"message.content"};
});

client.login(process.env.TOKEN).then();
