const fs = require('fs')
/**
 * Handles a Minecraft command
 * @param client The mineflayer client to be used
 * @param text Message Content
 * @param user Username of the member that sent the message
 * @param prefix The prefix to be used (content should include this)
 * @param type Either 'dm' or 'gc', determines the response method
 */
module.exports = async (client, text, user, prefix, type) => {

    // the super boring error handlers bc i cant use types
    if (typeof client !== 'object')
        throw 'HandlerError: Mineflayer client not defined or invalid'

    if (typeof text !== 'string')
        throw 'HandlerError: Message Content not defined or invalid'

    if (typeof user !== 'string')
        throw 'HandlerError: User not defined or invalid'

    if (typeof prefix !== 'string')
        throw 'HandlerError: Prefix not defined or invalid'

    if (typeof text !== 'string')
        throw 'HandlerError: Type not defined or invalid'

    if (!text.startsWith(prefix))
        throw 'HandlerError: Prefix is not in text. This should never be thrown.'


    let newtext = text.slice(prefix.length) // w/o prefix
    let label = newtext.split(' ')[0] // should be the command name
    let args = newtext.trim().split(' ').slice(1);

    console.log( module.exports.commands)
    if (!module.exports.commands) module.exports.init()
    try {
        module.exports.commands.get(label).execute(client, args, user, type)
    }
    catch (err) {
        console.log(err)
        // cmd probably doesnt exist, ignore (other than logging)
    }
}

module.exports.init = () => {
    const cmdsdir = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); 
    module.exports.commands = new Map();

    cmdsdir.forEach(cmd => {
        const command = require(`./commands/${cmd}`); // legit the discordjs.guide command handler
        module.exports.commands.set(command.name, command);
    });
}