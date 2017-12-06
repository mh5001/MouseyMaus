const pinged = {};
client.on('message', function(message) {
  if (message.mentions.users.first() !== null) {
    const total = message.mentions.users.array();
    total.map(ele => {
      pinged[ele.id] = {
        message: message.content,
        byUser: message.author.id,
        time: message.createdTimestamp,
        channel: message.channel.id
      }
      setTimeout(() => {
        delete pinged[ele.id];
      },86400000);
    });
  }
  const lower = message.content.toLowerCase();
  if (lower.startsWith(prefix + 'ping')) {
    if (pinged[message.author.id] !== undefined) {
      const past = message.createdTimestamp - pinged[message.author.id].time;
      message.channel.send({embed: {
        title: "Ping Found!",
        color: 50000,
        description: `**User Pinged:**\n<@${pinged[message.author.id].byUser}>\n**In channel:**\n<#${pinged[message.author.id].channel}>\n\n**Message Content:**\n${pinged[message.author.id].message}\n**Time passed:**\n${displayTime(past)}`
      }});
      delete pinged[message.author.id];
    } else {
      return message.channel.send('No one have pinged you in the past 24 hour!');
    }
  }
});

function displayTime (time) {
  time = parseInt(time);
  time = Math.round(time / 1000);
  if (time < 60) return time + ' seconds';
  if (time < 3600) {
    var minute = Math.floor(time / 60);
    var second = time % 60;
    return minute + " minute(s) and " + second + " second(s)";
  }
}
