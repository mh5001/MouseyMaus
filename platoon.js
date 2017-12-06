var count = {};
client.on('message', function(message) {
  if (!message.channel.name.startsWith('platoon')) return;
  if (message.author.id == client.user.id) return;
  const lower = message.content.toLowerCase();
  if (lower.startsWith(prefix + 'stop-plat')) {
    const id = message.author.id;
    message.channel.send('Ending search...');
    message.guild.members.get(id).removeRole(role.platoon);
    count[message.channel.id] = [];
    clearInterval(check);
    message.channel.send('Timed out. Nobody wanna play with u, u loser!');//Waiting time of user is out
  }
  if (lower.includes('plat') && !lower.startsWith(prefix)) {
    const id = message.author.id;
    if(JSON.stringify(count).includes(id)) return message.channel.send('You already is in queue for a platoon!');
    var delay;
    var users = [];
    if (count[message.channel.id] == null) {
      users.push('<@' + id + '>');
      count[message.channel.id] = users;
    } else {
      users = count[message.channel.id];
      users.push('<@' + id + '>');
      count[message.channel.id] = users;
    }
    if (count[message.channel.id].length > 1) {
      message.channel.send("Another player wanted to platoon!\n" + count[message.channel.id].join('\n'));//Found some1
      return count[message.channel.id] = [];
    }
    message.channel.send('It seems like you have wanted to platoon with someone! Specify the duration to wait for other players in minutes, default is 120 minutes!') // Start prompt
    .then(message => {
      message.channel.awaitMessages(input => {
        return input.author.id == id;
      },{
        time: 120000,
        max: 1,
        errors: ['time']
      }).then(col => {
        delay = parseInt(col.first().content);
        if (!isNaN(delay)) {
          if (delay > 180) {
            delay = 180;
            message.channel.send('Time to look for platoon mate too high, has been set to maximum of **180** minutes!');// User used value higher than 180
          } else if (delay < 1) {
            delay = 1;
            message.channel.send('Time to look for platoon mate too low, has been set to maximum of **1** minutes!'); // User used negative values
          } else {
            message.channel.send(`Successfully waiting for other players for **${delay}** minutes!`);// User provided time
          }
          delay = delay * 60;
        } else {
          message.channel.send('Unknown input, default delay of **120** minutes will be used!'); // User didnt provide numbers
          delay = 7200;
        }
      }).catch(err => {
        if (err) {
          message.channel.send('Timed out, default time of **120** minutes will be used!'); // User didn't respond to the prompt
          delay = 7200;
        }
      });
      message.guild.members.get(id).addRole(role.platoon);
    });
    var check = setInterval(() => {
      if (delay !== undefined) {
        clearInterval(check);
        setTimeout(() => {
          message.guild.members.get(id).removeRole(role.platoon);
          count[message.channel.id] = [];
          message.channel.send('Timed out. Nobody wanna play with u, u loser!');//Waiting time of user is out
        },delay * 1000);
      }
    },1000);
  }
});
