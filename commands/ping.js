module.exports.execute = (client, args, user, type) => {
    if (type === 'dm')
    client.chat(`/msg ${user} Pong!`)
    else if (type === 'gc')
    client.chat(`/gc ${user}, Pong!`)
}
module.exports.name = 'ping'